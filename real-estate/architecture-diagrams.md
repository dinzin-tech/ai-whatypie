# Real Estate Feature - Technical Architecture Diagram

## High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        WAPTO REAL ESTATE EXTENSION                         │
└────────────────────────────────────────────────────────────────────────────┘

                              FRONTEND LAYER
                         ┌─────────────────────────┐
                         │   Wapto Dashboard       │
                         │  (Next.js + React 19)   │
                         └──────────┬──────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
    ┌────▼──────────┐        ┌──────▼──────┐        ┌──────────▼──┐
    │ Properties UI │        │Automation UI│        │ Analytics   │
    │ - Catalogs    │        │             │        │             │
    │ - Listings    │        │- Add nodes  │        │- Tracking   │
    │ - Map View    │        │- Connect    │        │- Metrics    │
    └─────┬─────────┘        └──────┬──────┘        └─────────────┘
          │                         │
          └─────────────┬───────────┘
                        │
                 API LAYER (Express.js)
         ┌──────────────────────────────────────┐
         │  REST API Routes & Controllers       │
         │                                      │
         │  ┌─────────────────────────────────┐ │
         │  │ Property Catalog APIs:          │ │
         │  │ - GET/POST catalogs             │ │
         │  │ - Trigger sync manually         │ │
         │  │ - Get sync status               │ │
         │  └─────────────────────────────────┘ │
         │                                      │
         │  ┌─────────────────────────────────┐ │
         │  │ Property Listing APIs:          │ │
         │  │ - Search/Filter properties      │ │
         │  │ - Get property details          │ │
         │  │ - Bulk operations               │ │
         │  └─────────────────────────────────┘ │
         │                                      │
         │  ┌─────────────────────────────────┐ │
         │  │ Recommendation APIs:            │ │
         │  │ - Generate recommendations      │ │
         │  │ - Get recommendation logs       │ │
         │  └─────────────────────────────────┘ │
         └──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        │               │               │
   ┌────▼─────┐   ┌─────▼──────┐  ┌───▼──────┐
   │ Services │   │   Queue    │  │ Webhooks │
   │           │   │            │  │          │
   │ - Crawler │   │ - BullMQ   │  │- Sync    │
   │ - Rec.    │   │ - Jobs     │  │  Status  │
   │ - Sync    │   │ - Retry    │  │- Updates │
   └────┬──────┘   └──────┬─────┘  └──────────┘
        │                 │
        └─────────┬───────┘
                  │
          DATA LAYER (MongoDB)
     ┌────────────────────────────────────┐
     │      Collections:                  │
     │                                    │
     │ ┌────────────────────────────────┐ │
     │ │ property_catalogs              │ │
     │ │ - Source configs               │ │
     │ │ - Sync schedules               │ │
     │ │ - Metadata                     │ │
     │ └────────────────────────────────┘ │
     │                                    │
     │ ┌────────────────────────────────┐ │
     │ │ property_listings              │ │
     │ │ - Full property data           │ │
     │ │ - Indexes for fast search      │ │
     │ │ - Geo-locations                │ │
     │ │ - Active/Archived status       │ │
     │ └────────────────────────────────┘ │
     │                                    │
     │ ┌────────────────────────────────┐ │
     │ │ property_recommendation_logs    │ │
     │ │ - Sent recommendations         │ │
     │ │ - Click tracking               │ │
     │ │ - AI confidence scores         │ │
     │ └────────────────────────────────┘ │
     └────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
   ┌────▼──────────┐  ┌──────▼──────────┐
   │ External Data │  │ AI Models       │
   │ Sources:      │  │                 │
   │               │  │ - Groq (free)   │
   │ ✓ Websites    │  │ - DeepSeek      │
   │ ✓ XML Feeds   │  │ - OpenAI        │
   │ ✓ APIs        │  │ - Anthropic     │
   │ ✓ Uploads     │  │ - Google        │
   └───────────────┘  └─────────────────┘
```

---

## Data Flow Diagram

```
PHASE 1: PROPERTY DATA INGESTION
═════════════════════════════════════════════════════════════════════

Real Estate Business Website / XML Feed / API
           │
           ▼
    ┌─────────────────┐
    │ PropertyCrawler │
    │   Service       │
    │                 │
    │ • Parse HTML    │
    │ • Extract data  │
    │ • Validate      │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Normalize &     │
    │ Transform       │
    │                 │
    │ • Map fields    │
    │ • Clean text    │
    │ • Set defaults  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │ MongoDB Collection:                 │
    │ property_listings                   │
    │                                     │
    │ {                                   │
    │   catalog_id, property_id,          │
    │   title, address, price,            │
    │   property_type, status,            │
    │   images[], property_url,           │
    │   bedrooms, bathrooms,              │
    │   location_coords (geo),            │
    │   created_at                        │
    │ }                                   │
    └──────────────────┬──────────────────┘
                       │
                       ▼
              ✅ Ready for Automation


PHASE 2: AUTOMATION TRIGGER
═════════════════════════════════════════════════════════════════════

Contact arrives in Wapto
       │
       ▼
Automation Flow Triggers
(e.g., Tag = "property_inquiry")
       │
       ▼
┌──────────────────────────────────┐
│ Automation Node:                 │
│ "Send Property Recommendations"  │
│                                  │
│ Config:                          │
│ • Catalog: "Premium Properties"  │
│ • AI Model: "Groq Mistral"       │
│ • Count: 5 properties            │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Recommendation Service           │
│                                  │
│ 1. Extract preferences from:     │
│    • Custom fields               │
│    • Conversation history        │
│    • Contact tags                │
│                                  │
│ 2. Query MongoDB:                │
│    • Filter by: type, budget,    │
│      location, status            │
│    • Geo-search within radius    │
│                                  │
│ 3. Score & rank results          │
│                                  │
│ 4. Prepare data for AI           │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ AI Prompt Generation             │
│ (Groq API)                       │
│                                  │
│ Input:                           │
│ • Contact: {name, preferences}   │
│ • Properties: [{title, price,    │
│     address, url, images}]       │
│ • Prompt template                │
│                                  │
│ Output:                          │
│ • Personalized message           │
│ • Markdown formatted             │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Format & Send Message            │
│                                  │
│ Via WhatsApp/Email/SMS:          │
│                                  │
│ "Hi John! We found 3 amazing    │
│  apartments in your budget:      │
│                                  │
│  🏠 Luxury Penthouse - $500K     │
│     📍 Downtown Miami            │
│     🔗 View Details              │
│     ✨ 3BR | Pool | Furnished    │
│                                  │
│  [See More Properties] ➜         │
│ "                                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Log & Track                      │
│                                  │
│ Save to:                         │
│ property_recommendation_logs     │
│                                  │
│ • Contact ID                     │
│ • Properties sent                │
│ • AI confidence score            │
│ • Timestamp                      │
│ • Message ID (for tracking)      │
└──────────┬───────────────────────┘
           │
           ▼
      Message Sent ✅
       │
       ├─→ Click tracking via short URLs
       ├─→ Update contact engagement
       └─→ Trigger follow-ups
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    USER (existing)                          │
│ _id | email | workspace_id | subscription_plan             │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 1:N
     │
     ├────────────────────────────────────────────────┐
     │                                                 │
     ▼                                                 ▼
┌──────────────────┐                    ┌──────────────────────────┐
│ CONTACT (exist)  │                    │ PROPERTY_CATALOG (NEW)   │
│                  │                    │                          │
│ _id              │                    │ _id                      │
│ user_id ────┼────┼───────────────────▶ user_id                  │
│ name         │    │                    │ workspace_id             │
│ phone       │    │                    │ name                     │
│ tags        │    │                    │ source_type (url/api)    │
│ custom_      │    │                    │ website_url / xml_feed   │
│   fields    │    │                    │ sync_frequency           │
│ conv_history│    │                    │ last_sync_at             │
└──────────────┘    │                    │ metadata                 │
                    │                    └───┬──────────────────────┘
                    │                        │
                    │                        │ 1:N
                    │                        │
                    │                    ┌───▼──────────────────┐
                    │                    │ PROPERTY_LISTING(NEW)│
                    │                    │                      │
                    │                    │ _id                  │
                    │                    │ catalog_id           │
                    │                    │ property_id (ext)    │
                    │                    │ title                │
                    │                    │ address              │
                    │                    │ price                │
                    │                    │ type                 │
                    │                    │ status               │
                    │                    │ images[]             │
                    │                    │ property_url         │
                    │                    │ location_coords      │
                    │                    │ bedrooms/bathrooms   │
                    │                    │ amenities[]          │
                    │                    └───┬──────────────────┘
                    │                        │
                    │                        │ N:M (via logs)
                    │                        │
                    │    ┌───────────────────┘
                    │    │
                    ▼    ▼
            ┌──────────────────────────────────────┐
            │ PROPERTY_RECOMMENDATION_LOG (NEW)    │
            │                                      │
            │ _id                                  │
            │ automation_id                        │
            │ contact_id ◄─────────────────────────┤
            │ property_listing_id                  │
            │ reason (text)                        │
            │ ai_confidence_score                  │
            │ recommended_at                       │
            │ message_sent_at                      │
            └──────────────────────────────────────┘
                    │
                    │ Links to
                    │
            ┌──────────────────────────────┐
            │ AUTOMATION_FLOW (existing)   │
            │                              │
            │ Contains node:               │
            │ send_property_recommendations│
            └──────────────────────────────┘
```

---

## Frontend Component Hierarchy

```
workspace/
└── [workspaceId]/
    └── properties/
        │
        ├── page.tsx (Dashboard)
        │   └── Components:
        │       ├── PropertyCatalogSummary
        │       ├── RecentListings
        │       └── SyncStatus
        │
        ├── catalogs/
        │   ├── page.tsx (List Catalogs)
        │   │   └── PropertyCatalogTable
        │   │       ├── PropertyCatalogForm (modal)
        │   │       ├── CrawlerConfigBuilder (modal)
        │   │       └── SyncLogs (modal)
        │   │
        │   └── [catalogId]/
        │       └── page.tsx (Edit Catalog)
        │           └── PropertyCatalogForm
        │               ├── BasicInfo
        │               ├── DataSourceConfig
        │               ├── FieldMapper
        │               └── SyncSchedule
        │
        ├── listings/
        │   ├── page.tsx (Browse Properties)
        │   │   └── Components:
        │   │       ├── PropertySearchFilter
        │   │       ├── PropertyListingTable
        │   │       ├── PropertyListingCard
        │   │       └── PropertyMapView
        │   │
        │   └── [propertyId]/
        │       └── page.tsx (Property Details)
        │           └── PropertyDetailView
        │               ├── ImageGallery
        │               ├── PropertyInfo
        │               ├── ContactInfo
        │               └── RelatedProperties
        │
        ├── analytics/
        │   └── page.tsx
        │       └── Components:
        │           ├── RecommendationStats
        │           ├── EngagementChart
        │           └── PropertyPerformance
        │
        └── settings/
            └── page.tsx
                └── PropertySettings
                    ├── DefaultCatalog
                    ├── SyncPreferences
                    └── AIModelConfig
```

---

## API Endpoint Map

```
BASE: /api/property-catalog/

CATALOG MANAGEMENT:
  POST   /create                    (Create new catalog)
  GET    /list                      (Get user's catalogs)
  GET    /:id                       (Get catalog details)
  PUT    /:id                       (Update catalog)
  DELETE /:id                       (Delete catalog)
  POST   /:id/sync-now              (Trigger immediate sync)
  GET    /:id/sync-status           (Get last sync status)
  GET    /:id/sync-logs             (Get sync history)
  POST   /:id/test-crawl            (Preview crawl results)

FIELD MAPPING:
  POST   /:id/field-mapping         (Save CSS selector mapping)
  GET    /:id/field-mapping         (Get mapping)
  POST   /:id/test-mapping          (Test mapping on sample)

BASE: /api/property-listings/

LISTING MANAGEMENT:
  GET    /search                    (Advanced search with filters)
  GET    /:id                       (Get listing details)
  POST   /bulk-create               (Bulk import from crawler)
  PUT    /:id                       (Update listing)
  DELETE /:id                       (Delete listing)
  GET    /by-catalog/:catalogId     (Get all listings in catalog)
  POST   /:id/archive               (Archive listing)
  POST   /:id/restore               (Restore archived)

SEARCH & FILTERS:
  POST   /advanced-search           (Complex queries)
  GET    /geo-search                (Geo-radius search)
  GET    /by-type/:type             (Filter by property type)
  GET    /featured                  (Get featured properties)

BASE: /api/property-recommendations/

RECOMMENDATIONS:
  POST   /generate                  (Generate for contact)
  GET    /logs                      (Get recommendation history)
  GET    /:logId                    (Get recommendation details)
  POST   /:logId/track-click        (Track property click)
  GET    /analytics/summary         (Recommendation stats)
```

---

## Automation Node Configuration Example

```json
{
  "id": "node_prop_rec_1",
  "type": "send_property_recommendations",
  "position": { "x": 400, "y": 300 },
  "data": {
    // Basic Configuration
    "node_name": "Send Property Recommendations",
    "description": "Recommend properties based on contact preferences",
    
    // Data Source
    "catalog_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "catalog_name": "Premium Residential Properties",
    
    // AI Settings
    "ai_model_id": "groq_mistral_7b",
    "ai_model_name": "Groq Mistral 7B",
    "personalization_level": "high",  // low | medium | high
    "include_conversation_context": true,
    "max_properties": 5,
    
    // Message Template
    "message_template": "default",  // or custom_id
    "template_content": "Hi {contact_name}! We found these amazing properties for you: {properties_list}",
    "include_images": true,
    "include_map_image": true,
    "include_cta_button": true,
    
    // Preference Mapping
    "auto_extract_preferences": true,
    "preference_mapping": {
      "budget_min": "custom_field_budget_min",
      "budget_max": "custom_field_budget_max",
      "location": "custom_field_preferred_location",
      "property_type": "custom_field_property_type",
      "bedrooms": "custom_field_bedrooms"
    },
    
    // Filtering Rules
    "filters": {
      "min_price": 100000,
      "max_price": 1000000,
      "property_types": ["apartment", "house", "villa"],
      "min_bedrooms": 2,
      "required_amenities": ["parking", "security"]
    },
    
    // Tracking & Analytics
    "track_recommendations": true,
    "log_confidence_score": true,
    "track_clicks": true,
    "use_short_urls": true,
    
    // Outbound Settings
    "send_via": ["whatsapp", "email"],  // which channels
    "delay_send": 0,  // seconds to delay
    "timezone": "America/New_York",
    
    // Fallback
    "fallback_text": "We have great properties available. Check our listings!"
  }
}
```

---

## Implementation Priority Matrix

```
┌──────────────────────────────────────────────────────────────┐
│           FEATURE IMPLEMENTATION PRIORITY                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  HIGH IMPACT + LOW EFFORT (Do First)                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Database models & schema                             │  │
│  │ • Basic CRUD APIs                                      │  │
│  │ • Web crawler (Cheerio-based)                          │  │
│  │ • Simple sync queue                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  HIGH IMPACT + MEDIUM EFFORT (Do Second)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Property listing table UI                            │  │
│  │ • Search & filter endpoints                            │  │
│  │ • Catalog management UI                                │  │
│  │ • Recommendation service logic                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  HIGH IMPACT + HIGH EFFORT (Do Third)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Automation node integration                          │  │
│  │ • AI message generation                                │  │
│  │ • Map view component                                   │  │
│  │ • Analytics dashboard                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  LOW IMPACT + HIGH EFFORT (Do Last)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • Multi-language support                               │  │
│  │ • Advanced ML recommendations                          │  │
│  │ • Image optimization                                   │  │
│  │ • 3D property tours                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
