# Real Estate Property Listing & AI Recommendation Engine - Architecture Analysis & Implementation Plan

## Executive Summary
A cost-effective solution to add real estate property crawling, storage, and AI-driven recommendations leveraging Wapto's existing architecture patterns.

---

## 1. CODEBASE ARCHITECTURE ANALYSIS

### Current Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Redux
- **Backend**: Express.js (Node.js), MongoDB, Mongoose ODM
- **AI Integration**: Multi-provider support (OpenAI, Anthropic, Google, Cohere, Mistral, Groq, DeepSeek)
- **Automation**: Node-based visual flow builder with triggers, conditions, actions
- **Catalog System**: Ecommerce catalog pattern (proven, tested)
- **Authentication**: JWT-based with user_id references

### Key Observations
1. **Ecommerce Catalog Pattern** - Already implements product listing with similar structure
2. **Automation Builder** - Supports custom actions and AI responses
3. **AI Models** - Multi-provider support already configured
4. **Webhooks** - Infrastructure exists for external data sync
5. **Modular Architecture** - Clear separation: routes → controllers → models → services

---

## 2. COST-EFFECTIVE ARCHITECTURE SOLUTION

### Approach: Reuse Ecommerce Catalog Pattern

**Why this is cost-effective:**
- No new infrastructure needed
- Minimal frontend code (reuse existing components)
- Leverages proven patterns
- Reduces bugs and maintenance overhead
- Quick implementation (~2-3 weeks)

---

## 3. IMPLEMENTATION STRATEGY

### Phase 1: Database Layer (Core Foundation)

#### A. Create Property Catalog Model
```javascript
// models/property-catalog.model.js
New collection: property_catalogs
- user_id (reference User)
- workspace_id (reference Workspace)
- name (string)
- property_source_type (enum: 'website_url', 'xml_feed', 'api', 'manual_upload')
- website_url (string - for web crawling)
- api_endpoint (string - optional)
- xml_feed_url (string - optional)
- is_active (boolean)
- sync_frequency (enum: 'hourly', 'daily', 'weekly', 'manual')
- last_sync_at (date)
- metadata (JSON for custom fields)
- created_at, updated_at
```

#### B. Create Property Listing Model
```javascript
// models/property-listing.model.js
New collection: property_listings
- user_id (reference User)
- catalog_id (reference PropertyCatalog)
- property_id (string - unique external ID)
- title (string)
- description (text)
- address (string)
- property_type (enum: 'apartment', 'house', 'commercial', 'land', 'villa')
- status (enum: 'available', 'sold', 'rented', 'archived')
- price (number)
- currency (string)
- location_coords (geoJSON - for map display)
- images (array of URLs)
- features (array: ['pool', 'garage', 'garden', 'furnished'])
- amenities (array)
- bedrooms, bathrooms (numbers)
- square_feet (number)
- property_url (string - link back to listing)
- contact_info (object: phone, email)
- metadata (JSON - flexible storage)
- is_active (boolean)
- created_at, updated_at
- external_sync_id (string)

Indexes:
- user_id, catalog_id
- property_type
- status
- created_at
- location_coords (for geo queries)
```

#### C. Create Property Recommendation Log Model
```javascript
// models/property-recommendation-log.model.js
New collection: property_recommendation_logs
- automation_id (reference AutomationFlow)
- property_listing_id (reference PropertyListing)
- contact_id (reference Contact)
- reason (text - why this property was recommended)
- ai_confidence_score (number: 0-1)
- recommended_at (date)
- message_sent_at (date)
- user_id, workspace_id
- metadata (JSON)
```

---

### Phase 2: Data Crawling & Sync Service

#### A. Crawling Service Architecture

```javascript
// services/property-crawler.service.js

export async function crawlWebsiteProperties(catalogId) {
  // 1. Fetch HTML from website_url
  // 2. Parse using cheerio/puppeteer (headless browser)
  // 3. Extract property data using CSS selectors
  // 4. Validate & normalize
  // 5. Save to PropertyListing collection
  // 6. Update sync status
}

export async function syncXMLFeed(catalogId) {
  // 1. Fetch XML feed
  // 2. Parse XML
  // 3. Map to PropertyListing schema
  // 4. Upsert into database
}

export async function syncAPISource(catalogId) {
  // 1. Make API call with auth
  // 2. Transform response to PropertyListing
  // 3. Batch upsert
}
```

#### B. Crawling Configuration UI
- **CSS Selector Mapping** - Allow users to map HTML elements to property fields
- **Test Preview** - Show sample data before production sync
- **Sync Schedule** - Configure crawl frequency
- **Error Logging** - Track failed syncs

#### C. Queue-Based Sync
```javascript
// Use existing BullMQ (already in package.json)
// Create background job: syncPropertyCatalog
// Trigger on schedule or webhook
```

**Cost-Effective Alternative to Expensive Crawlers:**
- Use Cheerio for static HTML parsing (free, fast)
- Use Puppeteer only if JavaScript rendering needed (cached instances)
- For most real estate sites: XML feeds or API endpoints are available

---

### Phase 3: Backend API Endpoints

#### Core CRUD Endpoints
```
POST   /api/property-catalog/create
GET    /api/property-catalog/list
GET    /api/property-catalog/:id
PUT    /api/property-catalog/:id
DELETE /api/property-catalog/:id
POST   /api/property-catalog/:id/sync-now    # Manual trigger

GET    /api/property-listings/search?type=apartment&price_min=100000&price_max=500000
GET    /api/property-listings/:id
POST   /api/property-listings/bulk-create    # For crawled data
```

#### Search & Filter Endpoints
```
POST   /api/property-listings/advanced-search
  - filters: {type, price_range, bedrooms, location_radius}
  - sort: price, date_added, relevance
  - pagination
```

---

### Phase 4: Frontend Pages & Components

#### A. New Pages
```
/workspace/[workspaceId]/properties
  ├── /properties/catalogs          # List & manage sources
  ├── /properties/listings          # View all properties
  ├── /properties/setup             # Configure crawling
  └── /properties/settings          # Sync schedule, mapping
```

#### B. Reusable Components
```
PropertyCatalogForm.tsx          # Add/edit catalog (similar to EcommerceCatalog)
PropertyListingTable.tsx         # Table view with filters
PropertyListingCard.tsx          # Card display with image gallery
PropertyMapView.tsx              # Map view using Leaflet (already in deps)
PropertySearchFilter.tsx         # Advanced filters
PropertyCrawlStatus.tsx          # Sync status & logs
CrawlerConfigBuilder.tsx         # CSS selector mapper (drag-drop)
```

#### C. Automation Builder Integration
New action node type in automation flow:
```
"send_property_recommendations" action node:
  - Input: Contact data, user preferences (bedrooms, budget, location)
  - Output: Personalized property list with AI-generated message
  - Config: Select AI model, recommendation rules
```

---

### Phase 5: AI Recommendation Engine

#### A. Recommendation Service
```javascript
// services/property-recommendation.service.js

export async function generatePropertyRecommendations(contact, preferences, topN = 5) {
  // 1. Parse contact data for preferences:
  //    - Budget (from conversation history)
  //    - Property type (from questions)
  //    - Location preferences (from tags/custom fields)
  //    - Special requirements

  // 2. Query PropertyListing with filters & scoring
  //    - Exact matches (type, budget)
  //    - Location proximity (geo search)
  //    - Feature matching

  // 3. Use AI to generate personalized message
  //    - Context: contact name, conversation history
  //    - Data: top 5 properties
  //    - Prompt template:
  //      "Generate a personalized WhatsApp message recommending
  //       these properties to {contact_name} who is looking for
  //       {preferences}. Include brief description and link."

  // 4. Return: {properties, recommendation_message, confidence_score}
}
```

#### B. Prompt Engineering (Cost-Effective)
Use cost-effective AI models:
- **Primary**: Groq (free tier available, very fast)
- **Secondary**: DeepSeek (cheaper than GPT-4)
- **Fallback**: OpenAI (GPT-3.5-turbo)

**Sample Prompt Template**:
```
You are a real estate agent assistant. A potential buyer named {contact_name} 
is interested in properties in {location}.

Their preferences:
- Budget: {budget}
- Property Type: {property_type}
- Bedrooms: {bedrooms}
- Must-have amenities: {amenities}

Here are 3-5 matching properties:
{property_listings_json}

Generate a friendly, conversational WhatsApp message (2-3 sentences max) 
recommending these properties. Include property links. Start with a greeting.

Format:
👋 Hi {contact_name}! We found some great properties matching your criteria!

🏠 [Property 1 Title] - ₹{price}
   📍 {address}
   🔗 {link}

[Closing line with CTA: "Reply with 'More' to see additional options"]
```

---

### Phase 6: Automation Builder Integration

#### New Automation Node Type: "Send Property Recommendations"

**Node Configuration**:
```javascript
{
  id: 'send_property_recommendations_1',
  type: 'send_property_recommendations',
  position: { x: 400, y: 300 },
  data: {
    catalog_id: 'cat_123',                    // Select which property source
    ai_model_id: 'groq_mistral',             // Which AI to use
    recommendation_count: 5,                  // How many properties to suggest
    personalization_level: 'high',            // Low/Medium/High AI involvement
    message_template: 'default',              // Or custom template
    include_map_image: true,
    track_recommendations: true,              // Log for analytics
    
    // Preference mapping - how to extract from contact
    preference_mapping: {
      budget_from: 'custom_field_max_budget',
      location_from: 'custom_field_preferred_area',
      property_type_from: 'custom_field_type',
    }
  }
}
```

**Execution Logic**:
1. Trigger fires (e.g., contact tagged as 'property_inquiry')
2. Extract contact preferences from custom fields / conversation
3. Call `generatePropertyRecommendations()` service
4. Get AI-generated personalized message
5. Send via WhatsApp/Email/SMS
6. Log recommendation + engagement

---

## 4. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      PROPERTY WORKFLOW                       │
└─────────────────────────────────────────────────────────────┘

1. SETUP PHASE:
   Real Estate Business
        ↓
   Wapto Properties → Create Catalog → Configure Data Source
        ↓
   [Website URL / XML / API]
        ↓
   Test Crawl → Map Fields → Preview Data
        ↓
   Set Schedule (Daily/Weekly)

2. DATA SYNC PHASE:
   BullMQ Queue
        ↓
   PropertyCrawler Service
        ↓
   Normalize & Validate
        ↓
   MongoDB: property_listings collection
        ↓
   Index & Ready

3. AUTOMATION PHASE:
   Contact arrives (WhatsApp/Form)
        ↓
   Automation Flow Trigger
        ↓
   Send_Property_Recommendations Node
        ↓
   PropertyRecommendation Service
        ↓
   Search matching properties (filters + geo)
        ↓
   AI: Generate personalized message (Groq/DeepSeek)
        ↓
   Format with property links + images
        ↓
   Send via WhatsApp + Log

4. ENGAGEMENT TRACKING:
   Click tracking via short links
        ↓
   Update contact tags
        ↓
   Trigger follow-up automations
```

---

## 5. IMPLEMENTATION ROADMAP

### Week 1-2: Foundation & Database
- [ ] Create PropertyCatalog model
- [ ] Create PropertyListing model
- [ ] Create PropertyRecommendationLog model
- [ ] Set up MongoDB indexes
- [ ] Create database migrations

### Week 2-3: Backend APIs & Crawling
- [ ] Build property-catalog controller & routes
- [ ] Build property-listings controller & routes
- [ ] Create property-crawler service (Cheerio-based)
- [ ] Create property-recommendation service
- [ ] Set up BullMQ jobs for scheduled sync

### Week 3-4: Frontend UI
- [ ] Property catalog management page
- [ ] Property listing browser (table + filters)
- [ ] Crawl configuration builder
- [ ] Sync status dashboard

### Week 4-5: Automation Integration
- [ ] Create new automation node type
- [ ] Add to automation builder UI
- [ ] Integrate with existing trigger system
- [ ] Test end-to-end flow

### Week 5-6: AI & Testing
- [ ] Integrate Groq/DeepSeek APIs
- [ ] Prompt optimization
- [ ] Quality assurance
- [ ] Performance testing

---

## 6. COST BREAKDOWN

### Infrastructure Costs (Monthly)
| Item | Cost | Notes |
|------|------|-------|
| MongoDB (existing) | $0 | Already in use |
| BullMQ (existing) | $0 | Already in use |
| Groq API (free tier) | $0 | 30 requests/minute free |
| DeepSeek (paid tier) | ~$2-5 | Fallback; ~0.003/1K tokens |
| Web Crawling | $0 | Cheerio (open source) |
| **Total** | **$2-5** | Extremely cost-effective |

### Development Effort
| Phase | Hours | Cost (@ $50/hr) |
|-------|-------|-----------------|
| Database & APIs | 40 | $2,000 |
| Frontend UI | 30 | $1,500 |
| Automation Integration | 25 | $1,250 |
| AI & Testing | 20 | $1,000 |
| **Total** | **115** | **$5,750** |

### Comparison to Alternatives
- **Build from Scratch**: $15,000+ (6+ months)
- **White-label Solution**: $500-2000/month + $5,000 setup
- **This Solution**: $5,750 one-time + $2-5/month

---

## 7. TECHNOLOGY CHOICES EXPLAINED

### Why Cheerio + Puppeteer (Not Expensive Crawlers)?
- Cheerio: Parse static HTML - free, fast
- Puppeteer: Only for JS-heavy sites (cached, efficient)
- ScraperAPI/Apify: $30-300/month (overkill for real estate)

### Why Groq (Not ChatGPT)?
- **Cost**: 99% cheaper than GPT-4
- **Speed**: 10x faster
- **Quality**: Sufficient for recommendations
- **Free tier**: Perfect for low-volume testing

### Why MongoDB/Mongoose (Already Chosen)?
- No migration needed
- Flexible schema for property metadata
- Geo queries built-in
- Already optimized in codebase

---

## 8. SECURITY CONSIDERATIONS

### 1. Data Privacy
- User isolation: Ensure user_id filters on all queries
- Workspace segregation: Multi-tenant support
- Property URL validation: No injection attacks

### 2. API Rate Limiting
- Rate limit on crawl endpoints
- Queue-based sync prevents abuse
- Exponential backoff for failed crawls

### 3. Authentication
- JWT validation on all endpoints
- Admin-only access to raw crawl configs
- Audit logging for data changes

### 4. External Data
- Validate crawled URLs
- Sanitize HTML parsing
- SSL verification for feeds
- Timeout on crawl operations (60s max)

---

## 9. SCALABILITY ROADMAP

### Phase 1 (Now)
- Single database, shared collection
- Sync runs once per day
- Max 10,000 properties per catalog

### Phase 2 (Q2)
- Add caching layer (Redis)
- Increase sync frequency (hourly)
- Support 100,000+ properties
- Advanced geo-queries

### Phase 3 (Q3)
- Elasticsearch for full-text search
- ML-based recommendation scoring
- Real-time sync via webhooks
- Property image optimization

---

## 10. QUICK START CODE TEMPLATES

### Model Template (MongoDB)
```javascript
import mongoose from 'mongoose';

const propertyListingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  catalog_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyCatalog', required: true },
  property_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  address: String,
  price: Number,
  currency: { type: String, default: 'USD' },
  property_type: { type: String, enum: ['apartment', 'house', 'commercial', 'land'] },
  status: { type: String, default: 'available' },
  images: [String],
  property_url: String,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'property_listings' });

export default mongoose.model('PropertyListing', propertyListingSchema);
```

### API Endpoint Template
```javascript
// routes/property-listings.routes.js
import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import * as controller from '../controllers/property-listings.controller.js';

const router = express.Router();

router.get('/search', authenticateToken, controller.searchProperties);
router.get('/:id', authenticateToken, controller.getPropertyById);
router.post('/bulk-create', authenticateToken, controller.bulkCreateProperties);

export default router;
```

### Recommendation Service Template
```javascript
export async function generatePropertyRecommendations(contact, catalogId) {
  // 1. Extract preferences from contact
  const preferences = extractPreferences(contact);
  
  // 2. Query properties
  const properties = await PropertyListing.find({
    catalog_id: catalogId,
    price: { $gte: preferences.min_price, $lte: preferences.max_price },
    property_type: preferences.type,
    status: 'available'
  }).limit(5);
  
  // 3. Generate AI message
  const message = await generateAIMessage(contact, properties);
  
  return { properties, message };
}
```

---

## 11. NEXT STEPS

1. **Approve Architecture** - Review above plan with team
2. **Set Up Database** - Create schemas, migrations
3. **Start Phase 1** - Database layer
4. **Iterate** - Move through phases with 1-2 week sprints
5. **Test** - With real estate partner early (Week 4)
6. **Deploy** - Beta with early users
7. **Optimize** - Based on usage patterns

---

## 12. QUESTIONS FOR CLARIFICATION

1. **Data Source Priority**: Website crawling, XML feeds, or API endpoints first?
2. **Property Fields**: Which real estate fields are essential vs. optional?
3. **Frequency**: How often should properties sync (hourly/daily)?
4. **Scale**: Expected number of properties (100s, 1000s, 100k+)?
5. **Geographic**: Specific regions or worldwide support needed?
6. **AI Personalization**: How much context from contact history?

---

## SUMMARY

This approach leverages Wapto's existing architecture to add real estate capabilities with:
- **Minimal cost** ($2-5/month infrastructure)
- **Fast development** (5-6 weeks)
- **High quality** (proven patterns reused)
- **Scalable foundation** (can grow to 100k+ properties)
- **Easy maintenance** (uses existing tech stack)

The key is treating properties like a specialized catalog and recommendations as an automation action, keeping complexity low and leveraging proven patterns.
