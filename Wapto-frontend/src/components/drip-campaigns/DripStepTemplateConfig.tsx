/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CarouselMediaEditor } from "@/src/components/campaigns/wizard/CarouselMediaEditor";
import { CarouselProductEditor } from "@/src/components/campaigns/wizard/CarouselProductEditor";
import { CampaignCard, CarouselProduct, TemplateCarouselCard } from "@/src/components/campaigns/wizard/types";
import { SectionCard, SectionHeading, VariableRow } from "@/src/components/campaigns/wizard/VariableMappingComponents";
import { CONTACT_SYSTEM_FIELDS } from "@/src/components/campaigns/wizard/types";
import { FormLivePreview } from "@/src/components/templates/form/FormLivePreview";
import { Input } from "@/src/elements/ui/input";
import { useGetCustomFieldsQuery } from "@/src/redux/api/customFieldApi";
import { useGetTemplateQuery } from "@/src/redux/api/templateApi";
import { DripStepDraft } from "@/src/types/dripCampaign";
import {
  formatExpirationTime,
  getTemplateVariables,
  hasMediaTemplateHeader,
  isMarketingTemplate,
} from "@/src/utils/template";
import { Image as ImageIcon, Loader2, PlayCircle, ShoppingBag, Sparkles, Ticket, Timer } from "lucide-react";
import { useEffect, useMemo } from "react";

interface DripStepTemplateConfigProps {
  wabaId: string;
  step: DripStepDraft;
  onChange: (patch: Partial<DripStepDraft>) => void;
}

const DripStepTemplateConfig: React.FC<DripStepTemplateConfigProps> = ({ wabaId, step, onChange }) => {
  const { data: templateResult, isLoading: loadingTemplate } = useGetTemplateQuery(step.template_id, {
    skip: !step.template_id,
  });
  const { data: customFieldsResult } = useGetCustomFieldsQuery({});

  const template = templateResult?.data;
  const customFields = customFieldsResult?.data?.fields || [];
  const marketingType: string = (template as any)?.template_type || "none";
  const templateCarouselCards: TemplateCarouselCard[] = (template as any)?.carousel_cards || [];

  const variables = useMemo(() => getTemplateVariables(template), [template]);

  useEffect(() => {
    if (!template || templateCarouselCards.length === 0) return;
    const isCarousel =
      marketingType === "carousel_media" ||
      (marketingType === "carousel" && templateCarouselCards.length > 0);
    if (!isCarousel) return;
    const current = step.carousel_cards_data || [];
    if (current.length === templateCarouselCards.length) return;

    const initialized = templateCarouselCards.map((tCard) => {
      const headerComp = tCard.components?.find((c) => c.type === "header");
      const buttonsComp = tCard.components?.find((c) => c.type === "buttons");
      return {
        header: { type: headerComp?.format || "image", link: "" },
        body: { text: "" },
        buttons: (buttonsComp?.buttons || []).map((b) => ({
          type: b.type,
          text: b.text || "",
          ...(b.type === "url" ? { url_value: "" } : {}),
          ...(b.type === "quick_reply" ? { payload: "" } : {}),
        })),
      };
    });
    onChange({ carousel_cards_data: initialized });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, templateCarouselCards.length, marketingType]);

  useEffect(() => {
    if (!template || templateCarouselCards.length === 0) return;
    const isProduct =
      marketingType === "carousel_product" ||
      (marketingType === "carousel" &&
        templateCarouselCards[0]?.components?.find((c: any) => c.type === "header")?.format === "product");
    if (!isProduct) return;
    const current = step.carousel_products || [];
    if (current.length === templateCarouselCards.length) return;
    onChange({
      carousel_products: templateCarouselCards.map(() => ({
        product_retailer_id: "",
        catalog_id: "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, templateCarouselCards.length, marketingType]);

  const mappingOptions = useMemo(() => {
    const customOptions = customFields.map((f: any) => ({
      label: `CF: ${f.label}`,
      value: `cf_${f.name}`,
    }));
    return [...CONTACT_SYSTEM_FIELDS, ...customOptions];
  }, [customFields]);

  const previewVariables = useMemo(() => {
    return variables.map((varKey: string) => {
      const mapped = step.variables_mapping?.[varKey];
      const displayVal = mapped
        ? mapped.startsWith("{{")
          ? mapped.replace(/^\{\{/, "").replace(/\}\}$/, "")
          : mapped
        : `{{${varKey}}}`;
      return { key: varKey, example: displayVal };
    });
  }, [variables, step.variables_mapping]);

  if (!step.template_id) return null;

  if (loadingTemplate) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading template...</span>
      </div>
    );
  }

  const isCouponType = isMarketingTemplate(template) && (template as any)?.template_type === "coupon";
  const isLimitedOffer = isMarketingTemplate(template) && (template as any)?.template_type === "limited_time_offer";
  const isCarouselProduct =
    (template as any)?.template_type === "carousel_product" ||
    ((template as any)?.template_type === "carousel" &&
      ((template as any)?.carousel_cards?.[0]?.components?.find((c: any) => c.type === "header")?.format ===
        "product"));
  const isCarouselMedia =
    (template as any)?.template_type === "carousel_media" ||
    ((template as any)?.template_type === "carousel" && !isCarouselProduct);
  const hasExtraFields = isCouponType || isLimitedOffer || isCarouselMedia || isCarouselProduct;
  const hasVariables = variables.length > 0;
  const hasMediaHeader = hasMediaTemplateHeader(template);

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-4 border-t pt-4 dark:border-(--card-border-color)">
      <div className="flex-1 space-y-4 min-w-0">
        {hasVariables && (
          <SectionCard>
            <SectionHeading
              icon={<Sparkles className="text-primary w-5 h-5" />}
              label="Body variables"
              sub="Map placeholders to contact fields for personalized messages"
            />
            <div className="space-y-3">
              {variables.map((varKey: string, index: number) => (
                  <VariableRow
                    key={index}
                    varKey={varKey}
                    example="Contact field"
                    value={step.variables_mapping?.[varKey] || ""}
                    onChange={(val) =>
                      onChange({
                        variables_mapping: { ...(step.variables_mapping || {}), [varKey]: val },
                      })
                    }
                    mappingOptions={mappingOptions}
                  />
              ))}
            </div>
          </SectionCard>
        )}

        {!hasVariables && !hasExtraFields && !hasMediaHeader && (
          <p className="text-sm text-muted-foreground">This template has no extra configuration.</p>
        )}

        {isCouponType && (
          <SectionCard>
            <SectionHeading icon={<Ticket className="text-primary w-5 h-5" />} label="Coupon code" sub="Discount code sent to contacts" />
            <Input
              placeholder="e.g. SUMMER20"
              value={step.coupon_code || ""}
              onChange={(e) => onChange({ coupon_code: e.target.value })}
              className="h-10"
            />
          </SectionCard>
        )}

        {isLimitedOffer && (
          <>
            <SectionCard>
              <SectionHeading icon={<Ticket className="text-primary w-5 h-5" />} label="Coupon code" sub="Required for limited-time offer" />
              <Input
                placeholder="e.g. FLASH50"
                value={step.coupon_code || ""}
                onChange={(e) => onChange({ coupon_code: e.target.value })}
                className="h-10"
              />
            </SectionCard>
            <SectionCard>
              <SectionHeading icon={<Timer className="text-primary w-5 h-5" />} label="Offer expiration" sub="Minutes until offer expires" />
              <Input
                type="number"
                placeholder="60"
                value={step.offer_expiration_minutes ?? ""}
                onChange={(e) => onChange({ offer_expiration_minutes: e.target.value })}
                className="h-10"
              />
              {step.offer_expiration_minutes && (
                <p className="text-xs text-primary mt-1">{formatExpirationTime(step.offer_expiration_minutes)}</p>
              )}
            </SectionCard>
          </>
        )}

        {hasMediaHeader && !isCarouselMedia && (
          <SectionCard>
            <SectionHeading icon={<ImageIcon className="text-primary w-5 h-5" />} label="Media header" sub="Public image or video URL" />
            <Input
              placeholder="https://example.com/banner.jpg"
              value={step.media_url || ""}
              onChange={(e) => onChange({ media_url: e.target.value })}
              className="h-10"
            />
          </SectionCard>
        )}

        {isCarouselMedia && (
          <SectionCard>
            <SectionHeading icon={<ImageIcon className="text-primary w-5 h-5" />} label="Carousel cards" sub="Media and buttons per card" />
            <CarouselMediaEditor
              cards={(step.carousel_cards_data as CampaignCard[]) || []}
              templateCards={templateCarouselCards}
              onChange={(cards) => onChange({ carousel_cards_data: cards })}
            />
          </SectionCard>
        )}

        {isCarouselProduct && (
          <SectionCard>
            <SectionHeading icon={<ShoppingBag className="text-primary w-5 h-5" />} label="Product carousel" sub="Select catalogue products" />
            <CarouselProductEditor
              products={(step.carousel_products as CarouselProduct[]) || []}
              templateCards={templateCarouselCards}
              wabaId={wabaId}
              onChange={(p) => onChange({ carousel_products: p })}
            />
          </SectionCard>
        )}
      </div>

      <div className="lg:w-80 shrink-0">
        <div className="sticky top-4 rounded-lg border dark:border-(--card-border-color) overflow-hidden shadow-sm bg-card">
          <div className="p-3 border-b dark:border-(--card-border-color) bg-muted/30 flex items-center gap-2">
            <PlayCircle className="text-primary w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preview</span>
          </div>
          <div className="p-4 flex justify-center bg-muted/20">
            {template ? (
              <FormLivePreview
                templateType={template.header?.format || "text"}
                headerText={template.header?.text || ""}
                messageBody={template.message_body || ""}
                variables_example={previewVariables}
                footerText={template.footer_text || ""}
                buttons={template.buttons || []}
                headerFile={null}
                mediaUrl={step.media_url}
                marketingType={marketingType as any}
                offerText={(template as any)?.offer_text}
                productCards={
                  isCarouselProduct
                    ? ((template as any)?.carousel_cards || []).map((_: any, idx: number) => ({
                        id: String(idx),
                        button_text: "View",
                      }))
                    : []
                }
                mediaCards={
                  isCarouselMedia
                    ? ((step.carousel_cards_data as any[]) || []).map((card: any, idx: number) => ({
                        id: String(idx),
                        media_url: card?.header?.link || "",
                        body_text: card?.body?.text || "",
                        file: null,
                        buttonValues: [],
                        buttons: (card?.buttons || []).map((b: any) => ({
                          type: b.type || "url",
                          text: b.text || "Button",
                          url: b.url_value || "",
                        })),
                      }))
                    : []
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DripStepTemplateConfig;
