# Real Estate Feature - Code Implementation Samples

## 1. DATABASE MODELS

### PropertyCatalog Model
```javascript
// models/property-catalog.model.js
import mongoose from 'mongoose';

const propertyCatalogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  property_source_type: {
    type: String,
    enum: ['website_url', 'xml_feed', 'api_endpoint', 'manual_upload'],
    default: 'website_url'
  },
  
  website_url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  
  api_endpoint: String,
  api_auth_type: {
    type: String,
    enum: ['none', 'api_key', 'bearer_token', 'basic'],
    default: 'none'
  },
  api_key: String,
  
  xml_feed_url: {
    type: String,
    trim: true
  },
  
  // CSS Selectors for web scraping
  css_selectors: {
    property_container: String,
    title: String,
    price: String,
    address: String,
    description: String,
    images: String,
    property_type: String,
    bedrooms: String,
    bathrooms: String,
    property_url: String
  },
  
  sync_frequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'manual'],
    default: 'daily'
  },
  
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  is_syncing: {
    type: Boolean,
    default: false
  },
  
  last_sync_at: Date,
  last_sync_status: {
    type: String,
    enum: ['success', 'failed', 'partial', 'pending'],
    default: 'pending'
  },
  
  last_sync_count: {
    type: Number,
    default: 0
  },
  
  last_sync_error: String,
  
  total_properties: {
    type: Number,
    default: 0
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  deleted_at: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true,
  collection: 'property_catalogs'
});

propertyCatalogSchema.index({ user_id: 1, is_active: 1 });
propertyCatalogSchema.index({ workspace_id: 1 });
propertyCatalogSchema.index({ last_sync_at: -1 });

export default mongoose.model('PropertyCatalog', propertyCatalogSchema);
```

### PropertyListing Model
```javascript
// models/property-listing.model.js
import mongoose from 'mongoose';

const propertyListingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  catalog_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyCatalog',
    required: true,
    index: true
  },
  
  property_id: {
    type: String,
    required: true,
    index: true,
    unique: true  // External unique ID
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  address: {
    type: String,
    required: true,
    trim: true
  },
  
  city: String,
  state: String,
  postal_code: String,
  country: String,
  
  location_coords: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      default: [0, 0]
    }
  },
  
  property_type: {
    type: String,
    enum: [
      'apartment',
      'house',
      'villa',
      'townhouse',
      'commercial',
      'land',
      'office',
      'retail'
    ],
    index: true
  },
  
  status: {
    type: String,
    enum: ['available', 'sold', 'rented', 'archived', 'pending'],
    default: 'available',
    index: true
  },
  
  price: {
    type: Number,
    required: true,
    index: true
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  bedrooms: Number,
  bathrooms: Number,
  square_feet: Number,
  
  features: [String],  // pool, garage, garden, furnished, etc
  amenities: [String],
  
  images: [{
    url: String,
    alt_text: String,
    is_primary: { type: Boolean, default: false }
  }],
  
  property_url: {
    type: String,
    required: true
  },
  
  contact_info: {
    name: String,
    phone: String,
    email: String,
    website: String
  },
  
  rental_period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'sale'],
    default: 'sale'
  },
  
  rules: [String],
  
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  is_featured: {
    type: Boolean,
    default: false
  },
  
  view_count: {
    type: Number,
    default: 0
  },
  
  recommendation_count: {
    type: Number,
    default: 0
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  external_sync_id: String,
  
  deleted_at: {
    type: Date,
    default: null
  }
  
}, {
  timestamps: true,
  collection: 'property_listings'
});

// Geospatial index for location-based queries
propertyListingSchema.index({ 'location_coords': '2dsphere' });
propertyListingSchema.index({ user_id: 1, property_type: 1, status: 1 });
propertyListingSchema.index({ catalog_id: 1, is_active: 1 });
propertyListingSchema.index({ price: 1, property_type: 1 });

export default mongoose.model('PropertyListing', propertyListingSchema);
```

### PropertyRecommendationLog Model
```javascript
// models/property-recommendation-log.model.js
import mongoose from 'mongoose';

const propertyRecommendationLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  
  automation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationFlow'
  },
  
  contact_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
    index: true
  },
  
  property_listing_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyListing'
  }],
  
  recommendation_reason: String,
  
  ai_model_used: String,
  ai_confidence_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.7
  },
  
  message_content: String,
  message_channel: {
    type: String,
    enum: ['whatsapp', 'email', 'sms', 'telegram'],
    default: 'whatsapp'
  },
  
  message_id: String,
  message_status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  
  recommended_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  message_sent_at: Date,
  
  engagement: {
    clicked_count: { type: Number, default: 0 },
    opened_count: { type: Number, default: 0 },
    replied: { type: Boolean, default: false },
    properties_clicked: [{
      property_id: mongoose.Schema.Types.ObjectId,
      clicked_at: Date
    }]
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
  
}, {
  timestamps: true,
  collection: 'property_recommendation_logs'
});

propertyRecommendationLogSchema.index({ user_id: 1, contact_id: 1 });
propertyRecommendationLogSchema.index({ recommended_at: -1 });
propertyRecommendationLogSchema.index({ message_status: 1 });

export default mongoose.model('PropertyRecommendationLog', propertyRecommendationLogSchema);
```

---

## 2. BACKEND SERVICES

### Property Crawler Service
```javascript
// services/property-crawler.service.js
import axios from 'axios';
import cheerio from 'cheerio';
import { PropertyCatalog, PropertyListing } from '../models/index.js';
import logger from '../utils/logger.js';

export async function crawlWebsiteProperties(catalogId) {
  try {
    const catalog = await PropertyCatalog.findById(catalogId);
    if (!catalog) throw new Error('Catalog not found');
    
    catalog.is_syncing = true;
    catalog.last_sync_status = 'pending';
    await catalog.save();
    
    const html = await fetchWebpage(catalog.website_url);
    const $ = cheerio.load(html);
    
    const properties = [];
    const selector = catalog.css_selectors.property_container;
    
    $(selector).each((index, element) => {
      try {
        const property = extractPropertyData($, element, catalog);
        if (property) properties.push(property);
      } catch (e) {
        logger.warn(`Error extracting property ${index}:`, e.message);
      }
    });
    
    // Normalize and validate
    const validatedProperties = validateProperties(properties);
    
    // Upsert into database
    const upsertResults = await bulkUpsertProperties(
      catalogId,
      catalog.user_id,
      validatedProperties
    );
    
    // Update catalog sync status
    catalog.is_syncing = false;
    catalog.last_sync_at = new Date();
    catalog.last_sync_status = 'success';
    catalog.last_sync_count = validatedProperties.length;
    catalog.total_properties = await PropertyListing.countDocuments({
      catalog_id: catalogId,
      is_active: true
    });
    await catalog.save();
    
    logger.info(`Successfully synced ${validatedProperties.length} properties from ${catalog.name}`);
    return { success: true, count: validatedProperties.length };
    
  } catch (error) {
    logger.error('Crawl error:', error);
    await updateCatalogError(catalogId, error.message);
    throw error;
  }
}

function extractPropertyData($, element, catalog) {
  const selectors = catalog.css_selectors;
  
  return {
    title: $(element).find(selectors.title).text().trim(),
    price: parseFloat($(element).find(selectors.price).text().replace(/\D/g, '')),
    address: $(element).find(selectors.address).text().trim(),
    description: $(element).find(selectors.description).text().trim(),
    property_url: $(element).find(selectors.property_url).attr('href'),
    property_type: $(element).find(selectors.property_type).text().toLowerCase(),
    bedrooms: parseInt($(element).find(selectors.bedrooms).text()),
    bathrooms: parseInt($(element).find(selectors.bathrooms).text()),
    images: $(element).find(selectors.images).map((i, el) => 
      $(el).attr('src') || $(el).attr('data-src')
    ).get(),
    property_id: generatePropertyId(
      $(element).find(selectors.property_url).attr('href')
    ),
    external_sync_id: new Date().getTime()
  };
}

function validateProperties(properties) {
  return properties.filter(p => p.title && p.price && p.property_url);
}

async function bulkUpsertProperties(catalogId, userId, properties) {
  const operations = properties.map(prop => ({
    updateOne: {
      filter: { property_id: prop.property_id },
      update: {
        $set: {
          ...prop,
          catalog_id: catalogId,
          user_id: userId,
          is_active: true,
          updated_at: new Date()
        }
      },
      upsert: true
    }
  }));
  
  return PropertyListing.bulkWrite(operations);
}

async function fetchWebpage(url, timeout = 30000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
}

function generatePropertyId(url) {
  return require('crypto')
    .createHash('md5')
    .update(url)
    .digest('hex');
}

async function updateCatalogError(catalogId, errorMessage) {
  await PropertyCatalog.findByIdAndUpdate(catalogId, {
    is_syncing: false,
    last_sync_status: 'failed',
    last_sync_error: errorMessage,
    last_sync_at: new Date()
  });
}
```

### Property Recommendation Service
```javascript
// services/property-recommendation.service.js
import { PropertyListing, PropertyRecommendationLog, Contact } from '../models/index.js';
import { callAIModel } from '../utils/ai-service.js';

export async function generatePropertyRecommendations(contactId, catalogId, options = {}) {
  try {
    // 1. Get contact and extract preferences
    const contact = await Contact.findById(contactId);
    const preferences = extractPreferences(contact);
    
    // 2. Query matching properties
    const filters = buildPropertyFilters(preferences, options);
    const properties = await PropertyListing.find(filters)
      .limit(options.limit || 5)
      .sort({ created_at: -1 });
    
    if (properties.length === 0) {
      return { success: false, message: 'No matching properties found' };
    }
    
    // 3. Generate AI-powered message
    const message = await generateAIMessage(contact, properties, preferences);
    
    // 4. Create recommendation log
    const log = await PropertyRecommendationLog.create({
      user_id: contact.user_id,
      contact_id: contactId,
      property_listing_ids: properties.map(p => p._id),
      ai_model_used: options.ai_model || 'groq_mistral',
      ai_confidence_score: message.confidence || 0.8,
      message_content: message.text,
      message_channel: options.channel || 'whatsapp',
      recommendation_reason: `Auto-recommended based on ${preferences.criteria}`,
      metadata: { filters, preferences }
    });
    
    return {
      success: true,
      recommendation_id: log._id,
      message: message.text,
      properties: properties.map(p => ({
        id: p._id,
        title: p.title,
        price: p.price,
        address: p.address,
        property_url: p.property_url,
        images: p.images.slice(0, 2)
      }))
    };
    
  } catch (error) {
    logger.error('Recommendation error:', error);
    throw error;
  }
}

function extractPreferences(contact) {
  return {
    budget_min: contact.custom_fields?.budget_min || 0,
    budget_max: contact.custom_fields?.budget_max || 1000000,
    property_type: contact.custom_fields?.property_type,
    location: contact.custom_fields?.preferred_location,
    bedrooms: contact.custom_fields?.bedrooms,
    amenities: contact.custom_fields?.amenities || [],
    criteria: generateCriteria(contact)
  };
}

function buildPropertyFilters(preferences, options) {
  const filters = {
    is_active: true,
    status: 'available',
    price: {
      $gte: preferences.budget_min,
      $lte: preferences.budget_max
    }
  };
  
  if (preferences.property_type) {
    filters.property_type = preferences.property_type;
  }
  
  if (preferences.bedrooms) {
    filters.bedrooms = { $gte: preferences.bedrooms };
  }
  
  if (options.catalog_id) {
    filters.catalog_id = options.catalog_id;
  }
  
  return filters;
}

async function generateAIMessage(contact, properties, preferences) {
  const prompt = buildPrompt(contact, properties, preferences);
  
  const response = await callAIModel({
    model: 'groq_mistral',
    prompt,
    max_tokens: 300,
    temperature: 0.7
  });
  
  return {
    text: response.content,
    confidence: 0.85
  };
}

function buildPrompt(contact, properties, preferences) {
  const propertyList = properties.map(p => 
    `🏠 ${p.title} - ${p.currency}${p.price}\n📍 ${p.address}\n🔗 ${p.property_url}`
  ).join('\n\n');
  
  return `You are a real estate agent assistant. Generate a friendly WhatsApp message 
    recommending these properties to ${contact.name} who is looking for properties 
    in ${preferences.location} with a budget of ${preferences.currency}${preferences.budget_min} - ${preferences.budget_max}.
    
    Available properties:
    ${propertyList}
    
    Keep the message concise (2-3 sentences), friendly, and include a CTA.
    Format: Greeting + 1-2 properties + CTA to explore more.`;
}

function generateCriteria(contact) {
  const tags = contact.tags || [];
  return tags.slice(0, 2).join(' and ') || 'contact preferences';
}

export async function trackRecommendationEngagement(logId, eventType, propertyId = null) {
  const log = await PropertyRecommendationLog.findById(logId);
  
  if (eventType === 'click') {
    log.engagement.clicked_count += 1;
    if (propertyId) {
      log.engagement.properties_clicked.push({
        property_id: propertyId,
        clicked_at: new Date()
      });
    }
  }
  
  if (eventType === 'reply') {
    log.engagement.replied = true;
  }
  
  await log.save();
  return log;
}
```

---

## 3. BACKGROUND JOB

### BullMQ Job for Scheduled Sync
```javascript
// queues/property-sync.queue.js
import Queue from 'bullmq';
import { crawlWebsiteProperties } from '../services/property-crawler.service.js';
import { PropertyCatalog } from '../models/index.js';

const propertySyncQueue = new Queue('property-sync', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Register job processor
propertySyncQueue.process('sync-catalog', async (job) => {
  const { catalogId } = job.data;
  return await crawlWebsiteProperties(catalogId);
});

// Schedule recurring syncs based on frequency
export async function schedulePropertySyncs() {
  const catalogs = await PropertyCatalog.find({ is_active: true });
  
  for (const catalog of catalogs) {
    const frequency = catalog.sync_frequency;
    const repeatPattern = getRepeatPattern(frequency);
    
    await propertySyncQueue.add(
      'sync-catalog',
      { catalogId: catalog._id },
      {
        repeat: repeatPattern,
        jobId: `sync-${catalog._id}`,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true
      }
    );
  }
}

function getRepeatPattern(frequency) {
  const patterns = {
    hourly: { pattern: '0 * * * *' },
    daily: { pattern: '0 0 * * *' },
    weekly: { pattern: '0 0 * * 0' },
    manual: null
  };
  return patterns[frequency];
}

// Manual trigger endpoint
export async function triggerManualSync(catalogId) {
  return await propertySyncQueue.add('sync-catalog', { catalogId });
}

export default propertySyncQueue;
```

---

## 4. API CONTROLLER

### PropertyListing Controller
```javascript
// controllers/property-listings.controller.js
import { PropertyListing, PropertyCatalog } from '../models/index.js';

export async function searchProperties(req, res) {
  try {
    const {
      catalog_id,
      property_type,
      min_price,
      max_price,
      bedrooms,
      location,
      radius,
      page = 1,
      limit = 20,
      sort_by = 'created_at'
    } = req.query;
    
    const filters = { user_id: req.user._id, is_active: true };
    
    if (catalog_id) filters.catalog_id = catalog_id;
    if (property_type) filters.property_type = property_type;
    if (bedrooms) filters.bedrooms = { $gte: parseInt(bedrooms) };
    
    if (min_price || max_price) {
      filters.price = {};
      if (min_price) filters.price.$gte = parseFloat(min_price);
      if (max_price) filters.price.$lte = parseFloat(max_price);
    }
    
    // Geo-search
    if (location && radius) {
      filters.location_coords = {
        $near: {
          $geometry: parseLocation(location),
          $maxDistance: parseFloat(radius) * 1609 // Convert miles to meters
        }
      };
    }
    
    const skip = (page - 1) * limit;
    
    const properties = await PropertyListing.find(filters)
      .sort({ [sort_by]: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PropertyListing.countDocuments(filters);
    
    res.json({
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getPropertyById(req, res) {
  try {
    const property = await PropertyListing.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Increment view count
    property.view_count += 1;
    await property.save();
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function bulkCreateProperties(req, res) {
  try {
    const { catalog_id, properties } = req.body;
    
    // Verify user owns the catalog
    const catalog = await PropertyCatalog.findOne({
      _id: catalog_id,
      user_id: req.user._id
    });
    
    if (!catalog) {
      return res.status(403).json({ error: 'Catalog not found' });
    }
    
    const ops = properties.map(prop => ({
      updateOne: {
        filter: { property_id: prop.property_id },
        update: {
          $set: {
            ...prop,
            catalog_id,
            user_id: req.user._id,
            is_active: true
          }
        },
        upsert: true
      }
    }));
    
    const result = await PropertyListing.bulkWrite(ops);
    
    res.json({
      success: true,
      inserted: result.upsertedCount,
      updated: result.modifiedCount
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function parseLocation(locationString) {
  const [lat, lng] = locationString.split(',').map(parseFloat);
  return {
    type: 'Point',
    coordinates: [lng, lat]  // GeoJSON format: [longitude, latitude]
  };
}
```

---

## 5. AUTOMATION NODE TYPE

### Add to Automation Builder
```javascript
// Update automation-flow.model.js to include new node type

const automationFlowSchema = new mongoose.Schema({
  // ... existing fields ...
  nodes: {
    type: [{
      id: String,
      type: {
        enum: [
          // ... existing types ...
          'send_property_recommendations'  // NEW
        ]
      },
      data: {
        type: mongoose.Schema.Types.Mixed
      }
    }]
  }
  // ... rest of schema ...
});
```

### Register Node Handler
```javascript
// services/automation-executor.service.js (add handler)

const nodeHandlers = {
  // ... existing handlers ...
  
  send_property_recommendations: async (node, context) => {
    const { 
      catalog_id, 
      ai_model_id, 
      recommendation_count,
      preference_mapping
    } = node.data;
    
    const { contact } = context;
    
    // Get preferences from contact's custom fields
    const preferences = extractContactPreferences(contact, preference_mapping);
    
    // Generate recommendations
    const result = await generatePropertyRecommendations(
      contact._id,
      catalog_id,
      {
        limit: recommendation_count,
        ai_model: ai_model_id,
        channel: 'whatsapp'
      }
    );
    
    if (result.success) {
      // Send message via WhatsApp
      await sendWhatsAppMessage(contact.phone, result.message);
      
      return { 
        status: 'success',
        properties_sent: result.properties.length 
      };
    }
    
    return { status: 'no_recommendations' };
  }
};

function extractContactPreferences(contact, mapping) {
  return {
    budget_min: contact.custom_fields?.[mapping.budget_min],
    budget_max: contact.custom_fields?.[mapping.budget_max],
    property_type: contact.custom_fields?.[mapping.property_type],
    location: contact.custom_fields?.[mapping.location],
    bedrooms: contact.custom_fields?.[mapping.bedrooms]
  };
}
```

---

## 6. API ROUTES

### Property Routes Setup
```javascript
// routes/property-catalog.routes.js
import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import * as catalogController from '../controllers/property-catalog.controller.js';

const router = express.Router();

router.post('/create', authenticateToken, catalogController.createCatalog);
router.get('/list', authenticateToken, catalogController.listCatalogs);
router.get('/:id', authenticateToken, catalogController.getCatalogById);
router.put('/:id', authenticateToken, catalogController.updateCatalog);
router.delete('/:id', authenticateToken, catalogController.deleteCatalog);
router.post('/:id/sync-now', authenticateToken, catalogController.triggerSync);
router.get('/:id/sync-status', authenticateToken, catalogController.getSyncStatus);

export default router;
```

These code samples provide the foundation for implementing the complete real estate feature!
