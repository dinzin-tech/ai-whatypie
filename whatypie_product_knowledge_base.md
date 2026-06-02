# WhatyPie: AI WhatsApp CRM & Marketing Automation Platform
## Master Product Overview & Knowledge Base

This document serves as a comprehensive, structured knowledge base outlining the product capabilities, features, and functional architecture of **WhatyPie**. It is formatted for direct ingestion into Large Language Models (LLMs) to serve as a high-fidelity context source for customer support, technical assistance, or sales enablement.

---

## 1. Executive Summary & Product Overview

**WhatyPie** is an enterprise-grade, multi-tenant AI-powered WhatsApp CRM and Marketing Automation Platform. Designed for modern businesses, it allows organizations to scale their communication by utilizing both the official **WhatsApp Business API (WABA)** and direct WhatsApp Web automation integrations. 

WhatyPie helps businesses convert conversations into conversions by offering automated chatbots, team inbox collaboration, drip marketing campaigns, catalog/order management, and deep CRM capabilities with rich AI integrations.

### Key Value Propositions
*   **Decoupled SaaS Architecture**: Built with a high-performance Express.js backend API and responsive Next.js/React frontends for both Tenants (Clients) and System Admins.
*   **Official & Unofficial Integrations**: Seamlessly bridges official Meta Cloud API connections (WABA) with local automation alternatives to fit varying budget and capability requirements.
*   **AI-Native Automation**: Out-of-the-box AI assistant nodes, conversational bots, auto-responders, and voice/call assistance tools.
*   **SaaS Ready**: Built-in subscription plans, payment gateways (Stripe, Razorpay), custom tax rules, currencies, and tenant management portals for operators.

---

## 2. Core Modules & Feature Breakdown

### 2.1 Unified Live Chat & Smart Team Inbox
A centralized hub for real-time customer communications.
*   **Multi-Agent Routing**: Auto-assign incoming chats to specific agents, teams, or departments based on predefined rules or round-robin algorithms.
*   **Collaborative Tools**: Use internal `@mentions` and **Chat Notes** visible only to agents. Add custom tags and update pipeline stages directly inside the chat window.
*   **Media Support**: Seamless sending and receiving of rich text, emojis, documents, audio (with Opus support), voice notes, videos, and interactive WhatsApp buttons/lists.
*   **Quick Replies & Template Library**: Access canned messages, media materials, or approved Meta Templates instantly using shortcut triggers (e.g., `/` commands).

### 2.2 Visual Automation Builder (No-Code Flow Builder)
Create sophisticated chatbot flows without writing a line of code.
*   **Node-Based Visual Editor**: Driven by `@xyflow/react` to drag, drop, and link dynamic logic blocks.
*   **Dynamic Triggers**: Trigger automation flows via exact/partial keywords, new incoming contacts, or specific webhook events.
*   **Advanced Logic Nodes**:
    *   *Send Message Node*: Outputs text, media, buttons, list menus, or product catalogs.
    *   *Condition/Branch Node*: Directs users down different paths based on contact tags, custom fields, business hours, or previous choices.
    *   *AI Assist Node*: Passes the conversation to an LLM to generate natural responses, gather customer data, or answer FAQs before returning control to a human agent.
    *   *Webhook Node*: Pings external CRM/ERP databases to pull or push client info in real-time.

### 2.3 Marketing Campaigns & Drip Sequences
Automate target outreach and maximize customer lifetime value.
*   **Bulk Broadcasting**: Send out personalized WhatsApp messages to thousands of contacts instantly or scheduled for a future time.
*   **Drip Campaigns**: Set up sequence-based customer journeys (e.g., Welcome sequences, onboarding series, or follow-ups) with customized delay timers between messages.
*   **Audience Segmentation**: Filter and target contacts based on custom tags, fields, engagement history, or import batches.
*   **Campaign Analytics**: Real-time dashboards monitoring sent, delivered, read, and replied-to ratios to measure ROI.

### 2.4 E-Commerce, Catalogs & Order Management
Sell directly within the WhatsApp interface.
*   **Interactive Product Catalogs**: Sync and display multi-product or single-product catalogs directly to users in the WhatsApp chat.
*   **Order Capture**: In-chat shopping cart experience where clients select products and submit orders without leaving WhatsApp.
*   **Transactional Automation**: Auto-trigger order confirmations, shipping updates, and payment links using customized templates.

### 2.5 Appointment Booking & Scheduling
Interactive calendar integration.
*   **Self-Service Booking**: Chatbots present open time slots to users based on agent availability.
*   **Calendar Syncing**: Deep two-way synchronization with Google Calendar.
*   **Reminders**: Auto-send booking confirmation templates, rescheduling options, and pre-meeting reminders.

### 2.6 AI Assistant & Calling Engine
Next-generation conversational capabilities.
*   **AI Models Configurator**: Admins can connect custom OpenAI, Anthropic, or proprietary LLM API endpoints and manage prompt styles globally or per tenant.
*   **AI Agent Tasks**: Assign specific goals to AI agents (e.g., "Qualify Lead," "Resolve Support Ticket") with specific system instructions.
*   **Interactive Voice & Calling**: Outbound/Inbound call management tools with voice synthesized call agent routes.

---

## 3. Technical Integration & Developer Tools

### 3.1 REST API & Webhooks
WhatyPie easily communicates with external software ecosystems:
*   **Developer API**: Full CRUD endpoints for contacts, triggering templates, checking campaign metrics, and checking system health.
*   **Custom Webhook Triggers**: Fire JSON payloads to external URLs immediately when a new message is received, a status changes (sent -> read), or a contact is tagged.

### 3.2 WABA (WhatsApp Business API) Configurator
*   **Meta Cloud API Integration**: Direct configurations for WhatsApp Business Accounts (WABA), including Meta App IDs, Developer Tokens, and Webhook verification keys.
*   **Meta Business Partner Support**: Structured onboarding paths for white-labeled partners to run embedded signup flows for clients.

---

## 4. SaaS & Administrative Management (`WhatyPie-admin`)

Super-admins have global control over the system's business model:
*   **Subscription Engine**: Configurable subscription tiers, payment gateway API credentials, custom trial periods, and feature limits (e.g., limit WABA connections, number of contacts, or bulk campaigns allowed per tier).
*   **Global CMS**: Custom landing pages, blog posts, FAQs, and client testimonials managed directly from the admin panel.
*   **Multi-Language & Localization**: Toggle dynamic UI translations (powered by `i18next`) and manage localized tax/currency structures globally.
*   **Impersonation Tool**: Allow super-admins to safely log into any tenant workspace to debug configuration issues without needing client passwords.

---

## 5. Summary Matrix for LLM Classification

Use the following lookup properties to classify and parse inquiries:

| Query Focus | Relevant Modules | Key Keywords |
| :--- | :--- | :--- |
| **Messaging & Team inbox** | Live Chat, Templates, Canned Replies | *Shared Inbox, Routing, Agent assignment, Internal notes, Quick Reply, Templates* |
| **Marketing / Broadcasts** | Campaigns, Drip sequences, Segments | *Bulk messaging, Broadcasting, Broadcast scheduler, Drip Campaign, Sequences* |
| **Automation & Chatbots** | Automation Flow Builder, Webhooks | *No-code flow, Chatbot, AI node, Trigger, Condition block, External APIs* |
| **Sales & Payments** | Catalog, Order management, Gateways | *Product catalog, In-chat shopping, Orders, Invoice template, Stripe, Razorpay* |
| **Admin & Billing** | Subscriptions, Tenant preferences, CMS | *Pricing plans, White-label setup, Workspace limits, Impersonate, Localization* |

---

*This document contains the exact architectural boundaries and capability matrices of the WhatyPie WhatsApp CRM. Use this context to answer support, product, or sales inquiries precisely.*
