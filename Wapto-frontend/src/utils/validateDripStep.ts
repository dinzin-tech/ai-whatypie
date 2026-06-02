/* eslint-disable @typescript-eslint/no-explicit-any */
import { DripStepDraft } from "@/src/types/dripCampaign";
import { getTemplateVariables, hasMediaTemplateHeader, isMarketingTemplate } from "@/src/utils/template";

const hasCopyCodeButton = (template: any) =>
  (template?.buttons || []).some((b: any) => b.type === "copy_code") ||
  (template?.components || []).some((c: any) => (c.buttons || []).some((b: any) => b.type === "copy_code"));

export const validateDripStepClient = (
  step: DripStepDraft,
  template: any,
  stepIndex: number
): string | null => {
  const label = `Step ${stepIndex + 1}`;
  if (!template) return `${label}: template not found`;

  const mapping = step.variables_mapping || {};
  const requiredVars = getTemplateVariables(template);
  for (const key of requiredVars) {
    const val = mapping[key];
    if (val === undefined || val === null || String(val).trim() === "") {
      return `${label}: map variable {{${key}}}`;
    }
  }

  if (hasMediaTemplateHeader(template) && !step.media_url?.trim()) {
    return `${label}: media header URL is required`;
  }

  const templateType = (template.template_type || "").toLowerCase();
  const isCarouselProduct =
    templateType === "carousel_product" ||
    (templateType === "carousel" &&
      template.carousel_cards?.[0]?.components?.find((c: any) => c.type === "header")?.format === "product");
  const isCarouselMedia =
    templateType === "carousel_media" ||
    (templateType === "carousel" && !isCarouselProduct);

  if (isCarouselProduct) {
    const products = step.carousel_products || [];
    if (!products.length) return `${label}: select products for carousel`;
    if (products.some((p: any) => !p?.product_retailer_id || !p?.catalog_id)) {
      return `${label}: complete all carousel product selections`;
    }
  } else if (isCarouselMedia) {
    const cards = step.carousel_cards_data || [];
    if (!cards.length) return `${label}: configure carousel card media`;
    if (cards.some((c: any) => !c?.header?.link?.trim())) {
      return `${label}: each carousel card needs a media URL`;
    }
  }

  if (hasCopyCodeButton(template) && !step.coupon_code?.trim()) {
    return `${label}: coupon code is required`;
  }

  if (
    isMarketingTemplate(template) &&
    (template.template_type === "limited_time_offer" || template.template_type === "coupon") &&
    !step.coupon_code?.trim()
  ) {
    return `${label}: coupon code is required`;
  }

  return null;
};
