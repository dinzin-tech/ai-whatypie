# ⚡ Real Estate Feature - Quick Reference Checklist

## 🎯 One-Page Implementation Checklist

### PRE-DEVELOPMENT (Week 0)
- [ ] Clarify data sources (website scraping vs API vs XML)
- [ ] Define essential property fields
- [ ] Choose initial real estate business partner for beta
- [ ] Get approval on architecture & timeline
- [ ] Set up development & staging environments

---

### PHASE 1: Database Foundation (Days 1-5)

**PropertyCatalog Model**
```
Fields needed:
✓ user_id, workspace_id
✓ name, description
✓ property_source_type (website/xml/api/upload)
✓ website_url / api_endpoint / xml_feed_url
✓ css_selectors (for web scraping)
✓ sync_frequency, last_sync_at
✓ is_active, is_syncing, last_sync_status
```

**PropertyListing Model**
```
Fields needed:
✓ user_id, catalog_id, property_id (external)
✓ title, description, address
✓ price, currency, property_type, status
✓ location_coords (geo), bedrooms, bathrooms
✓ images[], property_url, contact_info
✓ features[], amenities[], created_at
```

**PropertyRecommendationLog Model**
```
Fields needed:
✓ automation_id, contact_id, property_listing_ids[]
✓ ai_model_used, ai_confidence_score
✓ message_content, message_channel, message_status
✓ engagement (clicks, replies)
✓ created_at, updated_at
```

**Database Actions**
- [ ] Create 3 model files (copy from code-samples.md)
- [ ] Create indexes (user_id, catalog_id, location_coords)
- [ ] Test connections
- [ ] Create migration scripts

---

### PHASE 2: Backend APIs & Crawler (Days 6-17)

**Crawler Service**
- [ ] Install cheerio + axios
- [ ] Create `property-crawler.service.js`
  - [ ] `crawlWebsiteProperties()` function
  - [ ] `extractPropertyData()` parser
  - [ ] `validateProperties()` validator
  - [ ] `bulkUpsertProperties()` DB writer
- [ ] Test with sample website

**Recommendation Service**
- [ ] Create `property-recommendation.service.js`
  - [ ] `generatePropertyRecommendations()` main function
  - [ ] `extractPreferences()` from contact
  - [ ] `buildPropertyFilters()` query builder
  - [ ] `generateAIMessage()` with Groq API
- [ ] Test with mock data

**Background Jobs (BullMQ)**
- [ ] Create `property-sync.queue.js`
- [ ] Set up job processor
- [ ] Configure repeat patterns (daily/weekly)
- [ ] Add error handling & retries

**API Controllers**
- [ ] Create `property-catalog.controller.js`
  - [ ] createCatalog(), listCatalogs(), updateCatalog()
  - [ ] triggerSync(), getSyncStatus()
  - [ ] testCrawl() for preview
  
- [ ] Create `property-listings.controller.js`
  - [ ] searchProperties() with filters
  - [ ] getPropertyById() with view tracking
  - [ ] bulkCreateProperties() for imports

- [ ] Create `property-recommendations.controller.js`
  - [ ] generateRecommendations()
  - [ ] trackEngagement()

**API Routes**
- [ ] Create `routes/property-catalog.routes.js`
- [ ] Create `routes/property-listings.routes.js`
- [ ] Create `routes/property-recommendations.routes.js`
- [ ] Register routes in app.js

**Testing**
- [ ] Test CRUD operations
- [ ] Test crawler with real website
- [ ] Test recommendation generation
- [ ] Test pagination & filters

---

### PHASE 3: Frontend Pages (Days 18-25)

**Pages Structure**
```
/workspace/[id]/properties/
├── page.tsx (Dashboard)
├── catalogs/
│   ├── page.tsx (List)
│   └── [id]/page.tsx (Edit)
├── listings/
│   ├── page.tsx (Browse)
│   └── [id]/page.tsx (Details)
├── analytics/page.tsx
└── settings/page.tsx
```

**Component List**
- [ ] PropertyCatalogTable - list with actions
- [ ] PropertyCatalogForm - create/edit modal
- [ ] CrawlerConfigBuilder - CSS selector mapper
- [ ] PropertyListingTable - with filters
- [ ] PropertyListingCard - grid view
- [ ] PropertyMapView - Leaflet map
- [ ] PropertySearchFilter - advanced search
- [ ] PropertyDetailView - full listing
- [ ] SyncStatusIndicator - live sync info
- [ ] RecommendationStats - dashboard charts

**UI Features**
- [ ] Create catalog flow
- [ ] Test crawl preview
- [ ] Field mapping UI (drag-drop selectors)
- [ ] Property search & filters
- [ ] Map view with markers
- [ ] Sync logs & error display
- [ ] Analytics dashboard

---

### PHASE 4: Automation Integration (Days 26-32)

**Automation Builder Changes**
- [ ] Add new node type: `send_property_recommendations`
- [ ] Add to node palette UI
- [ ] Create node config panel
- [ ] Add node handler in executor

**Node Configuration UI**
```
Fields in node config:
- Select catalog
- Select AI model
- How many properties to suggest
- Personalization level
- Message template
- Preference mapping (custom field to property field)
- Track engagement?
```

**Node Handler**
- [ ] Create handler in automation executor
- [ ] Extract contact preferences
- [ ] Query properties from MongoDB
- [ ] Generate AI message
- [ ] Send via WhatsApp/Email
- [ ] Log engagement

**Testing**
- [ ] Create test automation with property node
- [ ] Trigger with test contact
- [ ] Verify message sends correctly
- [ ] Check logging works

---

### PHASE 5: AI Integration (Days 33-37)

**Groq API Setup**
- [ ] Create Groq account (free tier)
- [ ] Get API key
- [ ] Add to .env file
- [ ] Create `groq-service.js` wrapper

**Prompt Engineering**
- [ ] Design base prompt template
- [ ] Test with 5 different contacts
- [ ] Refine for brevity (WhatsApp-friendly)
- [ ] Test with different property types

**Fallback Strategy**
- [ ] Set up DeepSeek as secondary
- [ ] Add OpenAI as tertiary
- [ ] Implement retry logic
- [ ] Add cost monitoring

**Message Formatting**
- [ ] Include property images
- [ ] Add tracking links (short URLs)
- [ ] Test on actual WhatsApp
- [ ] Verify CTA buttons work

---

### PHASE 6: Testing & Launch (Days 38-42)

**Quality Assurance**
- [ ] Unit tests for crawler
- [ ] Unit tests for recommendation logic
- [ ] Integration tests for APIs
- [ ] E2E test: website crawl → DB → automation → WhatsApp
- [ ] Load testing (1000 properties)
- [ ] Error handling tests

**Performance**
- [ ] Query optimization (indexes)
- [ ] API response times < 500ms
- [ ] Crawler timeout = 60s max
- [ ] AI response time tracking

**Security**
- [ ] Input validation on all APIs
- [ ] Rate limiting on crawl endpoints
- [ ] User isolation verification
- [ ] Secret scanning before deploy

**Documentation**
- [ ] API documentation
- [ ] User guide for property setup
- [ ] Automation node guide
- [ ] Troubleshooting guide

**Beta Testing**
- [ ] Deploy to staging
- [ ] Onboard 1-2 real estate businesses
- [ ] Gather feedback
- [ ] Fix issues
- [ ] Prepare launch plan

---

## 📊 Resource Allocation

| Task | Hours | Dev Hours | QA Hours |
|------|-------|-----------|----------|
| Database | 3 | 3 | - |
| Crawler Service | 12 | 12 | - |
| Recommendation Service | 10 | 10 | - |
| Background Jobs | 5 | 5 | - |
| API Controllers | 8 | 8 | - |
| Frontend Pages | 25 | 20 | 5 |
| Automation Integration | 12 | 10 | 2 |
| AI Integration | 8 | 5 | 3 |
| Testing & Launch | 15 | 5 | 10 |
| **TOTAL** | **~98 hours** | **~78 hours** | **~20 hours** |

---

## 🚨 Critical Path (Blockers to Avoid)

1. **Database schema** - Gets everything else unstuck
2. **Crawler service** - Blocks UI testing (need real data)
3. **Recommendation service** - Required for automation
4. **AI API integration** - Blocks end-to-end testing

**Parallel work**: UI can develop with mock data while crawler is built.

---

## 🔧 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Website returns 403 (blocked) | Add User-Agent header, use proxy service |
| Selectors change on each crawl | Use relative selectors, add fallbacks |
| MongoDB indexes slow queries | Add compound indexes early |
| Groq API rate limit | Implement queue + backoff, use caching |
| AI messages too long for SMS | Count tokens, truncate early |
| Location coordinates missing | Fallback to address geocoding |

---

## 📈 Success Metrics (Post-Launch)

- **Adoption**: 5+ real estate businesses in first month
- **Data Quality**: 95%+ properties sync successfully
- **Recommendations**: 40%+ click-through rate on property links
- **Performance**: API response < 300ms avg
- **Cost Efficiency**: $0-5/month infra costs maintained

---

## 🎓 Key Files to Reference

From Wapto codebase (examples to follow):

1. **Models Pattern**: `models/ecommerce-product.model.js`
2. **Controller Pattern**: `controllers/ecommerce-catalog.controller.js`
3. **Service Pattern**: `services/segment.service.js`
4. **Routes Pattern**: `routes/ecommerce-catalog.routes.js`
5. **Automation Nodes**: See `models/automation-flow.model.js` for node types
6. **AI Integration**: `controllers/ai.controller.js`

---

## 💾 Dependencies to Add

```json
{
  "cheerio": "^1.0.0-rc.12",
  "xlsx": "^0.18.5",
  "jimp": "^0.22.8",
  "sharp": "^0.33.0"
}
```

(Most others already exist: axios, mongoose, bullmq, nodemailer)

---

## 🚀 Development Environment Setup

```bash
# 1. Create feature branch
git checkout -b feature/real-estate-properties

# 2. Create models directory if needed
mkdir -p models/property

# 3. Create services
mkdir -p services/property

# 4. Create controllers
mkdir -p controllers/property

# 5. Create routes
mkdir -p routes/property

# 6. Frontend components
mkdir -p src/components/property

# 7. Frontend pages
mkdir -p src/app/workspace/\[workspaceId\]/properties
```

---

## ✅ Definition of Done

Feature is complete when:

- [ ] All 3 models created & working
- [ ] All 6 APIs responding correctly
- [ ] Crawler successfully imports properties
- [ ] Recommendations generate from automation
- [ ] Messages send via WhatsApp
- [ ] Engagement tracking works
- [ ] Unit tests pass (>80% coverage)
- [ ] E2E test succeeds
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code reviewed & merged
- [ ] Deployed to staging
- [ ] Beta partner tested
- [ ] Ready for general release

---

## 🎬 Day 1 Kickoff Tasks

1. **Setup** (1 hour)
   - Create feature branch
   - Create folder structure
   - Run migrations

2. **First Model** (2 hours)
   - Copy PropertyCatalog model from code-samples
   - Create MongoDB collection
   - Test connection

3. **First API** (2 hours)
   - Create basic CRUD endpoint
   - Test with Postman
   - Create unit test

**Goal**: Have database + one working API by end of Day 1 ✨

---

**Questions? Refer to the full documents or ask team lead! 🚀**
