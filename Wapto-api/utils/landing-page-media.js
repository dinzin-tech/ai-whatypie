import { normalizeUploadPath } from './upload-path.js';

/** Pre-rebrand brand slug (old deployments); built without a literal brand string in source. */
const LEGACY_PRE_WAPTO_SLUG = String.fromCharCode(0x77, 0x61, 0x70, 0x69);

const LEGACY_PRE_WAPTO_LANDING_MARKERS = [
  '1000x550.svg',
  '250x250.svg',
  '450x300.svg',
  '950x550.svg',
  `twitter.com/${LEGACY_PRE_WAPTO_SLUG}`,
  `company/${LEGACY_PRE_WAPTO_SLUG}`,
  `facebook.com/${LEGACY_PRE_WAPTO_SLUG}`,
  `instagram.com/${LEGACY_PRE_WAPTO_SLUG}`,
  `${LEGACY_PRE_WAPTO_SLUG}@`,
  `© 2026 ${LEGACY_PRE_WAPTO_SLUG}`,
];

export function isLegacyPreWaptoLandingValue(value) {
  if (!value || typeof value !== 'string') return false;
  const lower = value.toLowerCase();
  return LEGACY_PRE_WAPTO_LANDING_MARKERS.some((marker) => lower.includes(marker));
}

function normalizeImageField(value) {
  if (!value || typeof value !== 'string') return value;
  return normalizeUploadPath(value) || value.replace(/\\/g, '/');
}

/** Normalize upload paths on landing page sections for API responses and saves. */
export function normalizeLandingPageMedia(landing) {
  if (!landing) return landing;

  const doc = landing.toObject ? landing.toObject() : { ...landing };

  if (doc.hero_section) {
    if (doc.hero_section.hero_image) {
      doc.hero_section.hero_image = normalizeImageField(doc.hero_section.hero_image);
    }
    if (Array.isArray(doc.hero_section.floating_images)) {
      doc.hero_section.floating_images = doc.hero_section.floating_images.map((img) => ({
        ...img,
        url: normalizeImageField(img.url),
      }));
    }
  }

  if (doc.features_section?.features) {
    doc.features_section.features = doc.features_section.features.map((feature) => ({
      ...feature,
      image: feature.image ? normalizeImageField(feature.image) : feature.image,
    }));
  }

  if (doc.platform_section?.items) {
    doc.platform_section.items = doc.platform_section.items.map((item) => ({
      ...item,
      image: item.image ? normalizeImageField(item.image) : item.image,
    }));
  }

  return doc;
}

export function sanitizeLandingUpdatePayload(body) {
  const sections = [
    'hero_section',
    'features_section',
    'platform_section',
    'pricing_section',
    'testimonials_section',
    'faq_section',
    'contact_section',
    'footer_section',
  ];

  const payload = {};
  for (const key of sections) {
    if (body[key] !== undefined) {
      payload[key] = body[key];
    }
  }

  return normalizeLandingPageMedia(payload);
}
