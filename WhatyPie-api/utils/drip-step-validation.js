const getTemplateVariableKeys = (template) => {
  if (!template) return [];
  const keys = new Set();

  (template.body_variables || []).forEach((v) => {
    if (v?.key) keys.add(String(v.key));
  });
  (template.button_variables || []).forEach((v) => {
    if (v?.key) keys.add(String(v.key));
  });

  const scanText = (text) => {
    if (!text) return;
    const matches = String(text).match(/\{\{([^}]+)\}\}/g) || [];
    matches.forEach((m) => keys.add(m.replace(/\{\{|\}\}/g, '').trim()));
  };

  (template.components || []).forEach((c) => {
    scanText(c.text);
    (c.buttons || []).forEach((b) => scanText(b.text));
  });
  (template.buttons || []).forEach((b) => scanText(b.text));
  scanText(template.message_body);

  return Array.from(keys);
};

const stepMappingPlain = (step) => {
  const m = step.variables_mapping;
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m);
  return typeof m === 'object' ? m : {};
};

const hasCopyCodeButton = (template) =>
  (template.buttons || []).some((b) => b.type === 'copy_code') ||
  (template.components || []).some((c) => (c.buttons || []).some((b) => b.type === 'copy_code'));

export const validateDripStepTemplateConfig = (step, template, stepIndex) => {
  const label = `Step ${stepIndex + 1}`;
  if (!template) {
    throw new Error(`${label}: template not found`);
  }

  const mapping = stepMappingPlain(step);
  const requiredVars = getTemplateVariableKeys(template);
  for (const key of requiredVars) {
    const val = mapping[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      throw new Error(`${label}: variable "{{${key}}}" must be mapped`);
    }
  }

  const templateType = (template.template_type || '').toLowerCase();
  const headerFormat = (template.header?.format || '').toLowerCase();

  if (['image', 'video', 'document'].includes(headerFormat) || headerFormat === 'media') {
    if (!step.media_url?.trim()) {
      throw new Error(`${label}: media header URL is required`);
    }
  }

  if (['carousel_product', 'carousel_media', 'carousel'].includes(templateType)) {
    const products = step.carousel_products || [];
    const cards = step.carousel_cards_data || [];
    const isProduct =
      templateType === 'carousel_product' ||
      template.carousel_cards?.[0]?.components?.find((c) => c.type === 'header')?.format === 'product';
    if (isProduct) {
      if (!products.length) {
        throw new Error(`${label}: select products for carousel`);
      }
      const missing = products.some((p) => !p?.product_retailer_id || !p?.catalog_id);
      if (missing) {
        throw new Error(`${label}: complete all carousel product selections`);
      }
    } else if (!cards.length) {
      throw new Error(`${label}: configure carousel card media`);
    } else {
      const missingMedia = cards.some((c) => !c?.header?.link?.trim());
      if (missingMedia) {
        throw new Error(`${label}: each carousel card needs a media URL`);
      }
    }
  }

  if (hasCopyCodeButton(template) && !step.coupon_code?.trim()) {
    throw new Error(`${label}: coupon code is required for this template`);
  }

  return true;
};

export default validateDripStepTemplateConfig;
