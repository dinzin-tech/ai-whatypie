import { AiPromptLog } from '../models/index.js';
import { decryptApiKey } from './encryption-utils.js';

const DEFAULT_TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) || 30000;

const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const getRequestFormat = (model) => {
  if (model.request_format) {
    return model.request_format.toLowerCase();
  }
  const provider = (model.provider || '').toLowerCase();
  if (provider === 'anthropic') return 'anthropic';
  if (provider === 'google') return 'google';
  return 'openai';
};

const formatRequestBody = (model, prompt) => {
  const { model_id, config } = model;
  const safeConfig = config || {};
  const format = getRequestFormat(model);

  switch (format) {
    case 'anthropic':
      return {
        model: model_id,
        max_tokens: safeConfig.max_tokens || 1024,
        messages: [{ role: 'user', content: prompt }]
      };

    case 'google':
      return {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: safeConfig.temperature ?? 0.7,
          maxOutputTokens: safeConfig.max_tokens ?? 1024,
          topP: safeConfig.top_p ?? 0.95
        }
      };

    case 'openai':
    default:
      return {
        model: model_id,
        messages: [{ role: 'user', content: prompt }],
        temperature: safeConfig.temperature ?? 0.7,
        max_tokens: safeConfig.max_tokens || 1024,
        top_p: safeConfig.top_p ?? 1,
        frequency_penalty: safeConfig.frequency_penalty ?? 0,
        presence_penalty: safeConfig.presence_penalty ?? 0
      };
  }
};

const formatRequestHeaders = (model, apiKey) => {
  const { provider, api_version, headers_template } = model;
  const headers = {
    'Content-Type': 'application/json'
  };

  const rawApiKey = decryptApiKey(apiKey);

  if (headers_template) {
    let entries = [];
    if (headers_template instanceof Map) {
      entries = Array.from(headers_template.entries());
    } else if (typeof headers_template === 'object') {
      entries = Object.entries(headers_template);
    }

    entries.forEach(([key, value]) => {
      if (typeof key !== 'string' || key.startsWith('$')) {
        return;
      }
      let headerValue = value;
      if (typeof headerValue === 'string') {
        headerValue = headerValue.replace('{{API_KEY}}', rawApiKey || '');
      }
      if (typeof headerValue === 'string' && headerValue.trim() !== '') {
        headers[key] = headerValue;
      }
    });

    if (headers['Authorization'] || headers['x-api-key'] || headers['x-goog-api-key']) {
      return headers;
    }
  }

  const normalizedProvider = (provider || '').toLowerCase();

  switch (normalizedProvider) {
    case 'anthropic':
      if (!headers['x-api-key'] && typeof rawApiKey === 'string') {
        headers['x-api-key'] = rawApiKey;
      }
      if (typeof api_version === 'string' && api_version) {
        headers['anthropic-version'] = api_version;
      } else if (!headers['anthropic-version']) {
        headers['anthropic-version'] = '2023-06-01';
      }
      break;

    case 'google':
      if (rawApiKey && !headers['x-goog-api-key']) {
        headers['x-goog-api-key'] = rawApiKey;
      }
      break;

    case 'openrouter':
      if (!headers['Authorization'] && typeof rawApiKey === 'string') {
        headers['Authorization'] = `Bearer ${rawApiKey}`;
      }
      if (!headers['HTTP-Referer']) {
        headers['HTTP-Referer'] = 'https://whatypie.com';
      }
      if (!headers['X-Title']) {
        headers['X-Title'] = 'WhatyPie';
      }
      break;

    case 'openai':
    case 'groq':
    case 'mistral':
    case 'deepseek':
    case 'xai':
    case 'cohere':
    default:
      if (!headers['Authorization'] && typeof rawApiKey === 'string') {
        headers['Authorization'] = `Bearer ${rawApiKey}`;
      }
      break;
  }

  return headers;
};

const buildApiEndpoint = (model, apiKey) => {
  let { api_endpoint, provider, model_id } = model;
  const normalizedProvider = (provider || '').toLowerCase();
  const rawApiKey = decryptApiKey(apiKey);

  if (normalizedProvider === 'openrouter') {
    if (!api_endpoint || api_endpoint.trim() === '') {
      return 'https://openrouter.ai/api/v1/chat/completions';
    }
    return api_endpoint;
  }

  if (normalizedProvider === 'openai') {
    if (!api_endpoint || api_endpoint.trim() === '') {
      return 'https://api.openai.com/v1/chat/completions';
    }
    return api_endpoint;
  }

  if (normalizedProvider === 'anthropic') {
    if (!api_endpoint || api_endpoint.trim() === '') {
      return 'https://api.anthropic.com/v1/messages';
    }
    return api_endpoint;
  }

  if (normalizedProvider === 'google') {
    let url = api_endpoint || 'https://generativelanguage.googleapis.com/v1/models';

    if (url.includes('v1beta') && (model_id.includes('gemini-1.5') || model_id.includes('gemini-2.'))) {
      url = url.replace('v1beta', 'v1');
    }

    if (url.endsWith('/models') || url.endsWith('/v1') || url.endsWith('/v1beta')) {
      const baseUrl = url.endsWith('/models') ? url : `${url.replace(/\/$/, '')}/models`;
      url = `${baseUrl}/${model_id}:generateContent`;
    } else if (!url.includes(':generateContent')) {
      if (url.endsWith(model_id)) {
        url = `${url}:generateContent`;
      } else if (!url.includes('/models/')) {
        url = `${url.replace(/\/$/, '')}/models/${model_id}:generateContent`;
      }
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}key=${rawApiKey}`;
  }

  return api_endpoint;
};

export const normalizeAiError = (status, errorData, originalError) => {
  let code = 'UNKNOWN_PROVIDER_ERROR';
  let message = originalError?.message || 'AI request failed';

  if (status === 401 || status === 403) {
    code = 'INVALID_API_KEY';
    message = 'The AI provider rejected the API key.';
  } else if (status === 404) {
    code = 'MODEL_NOT_FOUND';
    message = 'The requested AI model was not found.';
  } else if (status === 429) {
    code = 'RATE_LIMITED';
    message = 'Rate limit exceeded by the AI provider. Please try again later.';
  } else if (status >= 500 && status < 600) {
    code = 'PROVIDER_UNAVAILABLE';
    message = 'The AI provider is currently unavailable or returned a server error.';
  } else if (status === 400) {
    code = 'INVALID_REQUEST';
    message = errorData?.error?.message || errorData?.message || 'Invalid request parameters sent to AI provider.';
  } else if (originalError?.name === 'AbortError' || originalError?.message?.includes('timeout')) {
    code = 'TIMEOUT';
    message = 'The request to the AI provider timed out.';
  }

  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
};

const callAIModel = async (userId, model, apiKey, prompt, options = {}) => {
  const isTest = !!options.isTest;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const rawApiKey = decryptApiKey(apiKey);

  if (!rawApiKey) {
    const err = new Error('API key is missing or invalid');
    err.code = 'INVALID_API_KEY';
    throw err;
  }

  if (!model) {
    const err = new Error('AI Model configuration is required');
    err.code = 'MODEL_NOT_FOUND';
    throw err;
  }

  const requestBody = formatRequestBody(model, prompt);
  const requestHeaders = formatRequestHeaders(model, rawApiKey);
  const apiEndpoint = buildApiEndpoint(model, rawApiKey);

  const executeFetch = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(`[AI Request] Provider: ${model.provider}, Model: ${model.model_id}, Status: ${response.status}, Latency: ${latencyMs}ms, Success: false`);
        throw normalizeAiError(response.status, errorData);
      }

      const data = await response.json();
      console.log(`[AI Request] Provider: ${model.provider}, Model: ${model.model_id}, Status: 200, Latency: ${latencyMs}ms, Success: true`);

      let responseText;
      const normalizedProvider = (model.provider || '').toLowerCase();

      if (normalizedProvider === 'google') {
        const parts = data.candidates?.[0]?.content?.parts || [];
        responseText = parts.map(part => part.text).join('');
        if (!responseText) {
          throw new Error('Unable to extract response from Google AI model');
        }
      } else {
        const responsePath = model.response_path || 'choices.0.message.content';
        responseText = getNestedValue(data, responsePath);
        if (!responseText) {
          throw new Error('Unable to extract response from AI model');
        }
      }

      return { responseText, latencyMs };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw normalizeAiError(408, null, new Error('Request timed out'));
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  let result;
  try {
    result = await executeFetch();
  } catch (err) {
    if (!isTest && (err.status >= 500 || err.code === 'TIMEOUT' || !err.status)) {
      result = await executeFetch();
    } else {
      throw err;
    }
  }

  if (userId && !isTest) {
    try {
      await AiPromptLog.create({
        user_id: userId,
        feature: 'ai_prompts'
      });
    } catch (logErr) {
      // Intentionally swallow logging errors so main AI flow succeeds
    }
  }

  if (options.returnDetails) {
    return result;
  }
  return result.responseText;
};

const testAIModel = async (model, prompt, apiKey, options = {}) => {
  if (!apiKey) {
    const err = new Error('API key is required for testing AI model');
    err.code = 'INVALID_API_KEY';
    throw err;
  }

  return await callAIModel(null, model, apiKey, prompt, { ...options, isTest: true, returnDetails: true });
};

export {
  getNestedValue,
  getRequestFormat,
  formatRequestBody,
  formatRequestHeaders,
  buildApiEndpoint,
  callAIModel,
  testAIModel
};
