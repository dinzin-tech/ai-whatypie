import {
  toOrderedTemplateParamValues
} from './campaign-job-processor.js';

/**
 * Build WhatsApp Cloud API template components for broadcast + drip sends.
 * @param {object} template - Template mongoose doc
 * @param {object} templateVariables - Resolved variable key -> value for this recipient
 * @param {object} templateData - Step/campaign config (media, carousel, coupon, etc.)
 */
export const buildOutboundTemplateComponents = (template, templateVariables = {}, templateData = {}) => {
  const templateComponents = [];
  const isAuthenticationTemplate =
    template?.category && template.category.toUpperCase() === 'AUTHENTICATION';

  if (templateData.media_url) {
    let mediaType = 'image';
    if (templateData.media_url.endsWith('.mp4') || templateData.media_url.includes('video')) {
      mediaType = 'video';
    }
    if (templateData.media_url.endsWith('.pdf') || templateData.media_url.includes('document')) {
      mediaType = 'document';
    }
    templateComponents.push({
      type: 'header',
      parameters: [{
        type: mediaType,
        [mediaType]: { link: templateData.media_url }
      }]
    });
  }

  if (isAuthenticationTemplate) {
    let authParams = [];
    if (templateVariables && Object.keys(templateVariables).length > 0) {
      const values = toOrderedTemplateParamValues(templateVariables);
      values.forEach((value) => authParams.push({ type: 'text', text: value }));
    }
    if (authParams.length > 0) {
      templateComponents.push({ type: 'body', parameters: authParams });
    }
    if (template?.buttons?.length) {
      template.buttons.forEach((button, index) => {
        if (button.type === 'website' && button.website_url?.includes('otp')) {
          templateComponents.push({
            type: 'button',
            sub_type: 'url',
            index: index.toString(),
            parameters: authParams
          });
        }
      });
    }
  } else if (templateVariables && Object.keys(templateVariables).length > 0) {
    let bodyParams = [];
    if (template?.body_variables?.length > 0) {
      bodyParams = template.body_variables.map((bodyVar, index) => {
        const varKey = bodyVar.key || String(index + 1);
        const value = templateVariables[varKey] ?? '';
        const param = { type: 'text', text: String(value) };
        if (Number.isNaN(Number(varKey))) {
          param.parameter_name = varKey;
        }
        return param;
      });
    } else {
      const values = toOrderedTemplateParamValues(templateVariables);
      bodyParams = values.map((value) => ({ type: 'text', text: value }));
    }
    if (bodyParams.length > 0) {
      templateComponents.push({ type: 'body', parameters: bodyParams });
    }
  }

  const templateType = (template?.template_type || '').toLowerCase();
  const isCarouselTemplate = ['carousel_product', 'carousel_media', 'carousel'].includes(templateType);
  const carouselProducts = Array.isArray(templateData.carousel_products) ? templateData.carousel_products : [];
  const carouselCardsData = Array.isArray(templateData.carousel_cards_data) ? templateData.carousel_cards_data : [];

  if (isCarouselTemplate) {
    if (carouselProducts.length > 0) {
      templateComponents.push({
        type: 'carousel',
        cards: carouselProducts.map((product, index) => ({
          card_index: index,
          components: [{
            type: 'header',
            parameters: [{
              type: 'product',
              product: {
                product_retailer_id: product.product_retailer_id,
                catalog_id: product.catalog_id
              }
            }]
          }]
        }))
      });
    } else if (carouselCardsData.length > 0) {
      templateComponents.push({
        type: 'carousel',
        cards: carouselCardsData.map((card, index) => {
          const cardComponents = [];
          if (card.header?.type) {
            const mediaType = card.header.type.toLowerCase();
            const param = { type: mediaType };
            param[mediaType] = card.header.id ? { id: card.header.id } : { link: card.header.link };
            cardComponents.push({ type: 'header', parameters: [param] });
          }
          if (Array.isArray(card.buttons)) {
            card.buttons.forEach((btn, btnIndex) => {
              const subType = (btn.type || '').toLowerCase();
              if (subType === 'quick_reply') {
                cardComponents.push({
                  type: 'button',
                  sub_type: 'quick_reply',
                  index: btnIndex,
                  parameters: btn.payload ? [{ type: 'payload', payload: String(btn.payload) }] : []
                });
              } else if (subType === 'url' && btn.url_value) {
                cardComponents.push({
                  type: 'button',
                  sub_type: 'url',
                  index: btnIndex,
                  parameters: [{ type: 'text', text: String(btn.url_value) }]
                });
              }
            });
          }
          return { card_index: index, components: cardComponents };
        })
      });
    } else {
      throw new Error(
        `Template "${template?.template_name}" is a carousel template. Provide carousel_products or carousel_cards_data.`
      );
    }
  }

  if (template?.is_limited_time_offer === true) {
    const expirationMinutes = templateData.offer_expiration_minutes ?? 60;
    templateComponents.push({
      type: 'limited_time_offer',
      parameters: [{
        type: 'limited_time_offer',
        limited_time_offer: {
          expiration_time_ms: Date.now() + expirationMinutes * 60 * 1000
        }
      }]
    });
  }

  if (Array.isArray(template?.buttons)) {
    template.buttons.forEach((btn, btnIndex) => {
      if (btn.type === 'catalog') {
        templateComponents.push({
          type: 'button',
          sub_type: 'CATALOG',
          index: btnIndex.toString(),
          parameters: [{
            type: 'action',
            action: {
              thumbnail_product_retailer_id: templateData.thumbnail_product_retailer_id
            }
          }]
        });
      } else if (btn.type === 'copy_code' && templateData.coupon_code) {
        templateComponents.push({
          type: 'button',
          sub_type: 'copy_code',
          index: btnIndex.toString(),
          parameters: [{
            type: 'coupon_code',
            coupon_code: String(templateData.coupon_code)
          }]
        });
      } else if (btn.type === 'url' && typeof btn.url === 'string' && btn.url.includes('{{')) {
        const urlValue =
          templateVariables?.url ??
          templateVariables?.['1'] ??
          Object.values(templateVariables).find((v) => typeof v === 'string' && /^https?:\/\//.test(v));
        if (urlValue) {
          templateComponents.push({
            type: 'button',
            sub_type: 'url',
            index: btnIndex.toString(),
            parameters: [{ type: 'text', text: String(urlValue) }]
          });
        }
      } else if (String(btn.type).toLowerCase() === 'flow') {
        const flowToken = templateData.flow_token || `flow_${Date.now()}`;
        const flowActionData = templateData.flow_action_data || {};
        templateComponents.push({
          type: 'button',
          sub_type: 'flow',
          index: btnIndex.toString(),
          parameters: [{
            type: 'action',
            action: {
              flow_token: String(flowToken),
              ...(Object.keys(flowActionData).length > 0 ? { flow_action_data: flowActionData } : {})
            }
          }]
        });
      }
    });
  }

  return templateComponents;
};

export default buildOutboundTemplateComponents;
