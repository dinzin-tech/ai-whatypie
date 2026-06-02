# Wapto codebase — start here (deployment)

This folder is a **lightweight copy** of the Wapto product source (API, frontend, admin, and documentation). It was prepared for packaging, review, or handoff **without** `node_modules`, build caches, or other heavy artifacts.

**Rule for this package:** make code and config changes **only inside `wapto-codebase-zip/`**, not in the parent repo folders, unless you intentionally sync back later.

**Brand logo:** the canonical asset is **`wapto-logo.png`** at the zip root. Copies live under `Wapto-api/branding/`, `Wapto-frontend/public/assets/logos/`, `Wapto-admin/public/assets/logos/`, and `wapto-documentation/assets/images/`. Seeders copy it into API `uploads/` on first run. Do not ship legacy `logo1.png` / WAPI wordmark files.

---

## Step 1 — Open the documentation first (required)

Deployment and installation are explained in **`wapto-documentation/`**. Read that **before** editing code or running servers.

### How to open the docs

1. Go to the documentation folder:
   ```
   wapto-codebase-zip/wapto-documentation/
   ```
2. Open **`index.html`** in a web browser (double-click, or drag the file into Chrome/Firefox/Safari/Edge).
3. Use the **left sidebar** on every page — it is the table of contents for the whole guide.
4. Use the **search box** at the top of the home page to find topics (e.g. “Docker”, “VPS”, “env”, “seed”).

> **Tip:** If styles look broken, open `index.html` via the file path directly (not from a random subfolder). Assets live under `wapto-documentation/assets/`.

### After go-live

When deployed, the same HTML is usually served at your **docs domain** (e.g. `https://docsv2.yourdomain.com`). Until then, browsing local `index.html` is enough.

---

## Step 2 — Recommended reading order (deployment)

Follow the sidebar section **“Wapto Installation”** in this order:

| Order | Page | File | What you learn |
|------:|------|------|----------------|
| 1 | Introduction | `index.html` | Product overview and doc map |
| 2 | Prerequisite | `prerequisite.html` | Server requirements, PHP/Node versions, ports, domains |
| 3 | Overview | `overview.html` | Architecture: API + Frontend + Admin + MongoDB + Redis |
| 4 | Quick Installation | `quick-installation.html` | **Recommended path** — automated / Docker-style setup |
| 5a | Backend → Local Server | `local-server.html` | Run API on your machine (dev) |
| 5b | Backend → Virtual Private Server | `virtual-server.html` | API on a VPS (production-style) |
| 5c | Backend → C-panel | `cpanel.html` | Shared hosting / cPanel variant |
| 6a | Frontend → Local Server | `frontend-local.html` | Tenant app (chat) locally |
| 6b | Frontend → Virtual Private Server | `frontend-vps.html` | Tenant app on VPS |
| 6c | Frontend → Vercel | `vercel.html` | Optional: frontend on Vercel |
| 7 | Update | `update.html` | Upgrading an existing installation |
| 8 | Database Seeding | `database-seeding.html` | Default admin, roles, pages (`npm run seed`) — **replaces old `/install` wizard** |

Expand sidebar menus with the **chevron (▼)** next to “Wapto Installation”, “Backend Installation”, and “Frontend Installation”.

### Removed or moved (do not use old docs)

| Old item | What to use instead |
|----------|---------------------|
| Browser install wizard (`/install`, `install.html`) | `npm run seed` in `Wapto-api`, then admin login — see `database-seeding.html` |
| `dev-installation.html` | `quick-installation.html` or `overview.html` |
| `live-server.html` | Redirects to `virtual-server.html` |
| `frontend-installation.html` | Redirects to `frontend-local.html` |
| CodeCanyon / Envato license steps | Not required for Wapto v2 whitelabel deploys |

### Production VPS (most common)

For a single server running everything (API + chat app + admin + docs):

1. `prerequisite.html`
2. `overview.html`
3. `quick-installation.html`
4. `virtual-server.html` (backend)
5. `frontend-vps.html` (frontend + admin URLs and env)

### Local development only

1. `prerequisite.html`
2. `local-server.html`
3. `frontend-local.html`

---

## Step 3 — What each folder in this package is

| Folder | Role | Typical URL (example) |
|--------|------|------------------------|
| `Wapto-api/` | Node.js API — auth, WhatsApp, billing, webhooks, settings | `https://apiv2.yourdomain.com` |
| `Wapto-frontend/` | Next.js tenant app (inbox, WABA, campaigns) | `https://chatv2.yourdomain.com` |
| `Wapto-admin/` | Next.js admin (CMS, plans, system preferences) | `https://adminv2.yourdomain.com` |
| `wapto-documentation/` | Static HTML operator/user documentation | `https://docsv2.yourdomain.com` |

Each app has a **`Dockerfile`** and **`.env.example`** (and may ship a local `.env` for reference). The documentation pages describe which variables must match across API, frontend, and admin (API URL, storage URL, socket URL, domains).

---

## Step 4 — Install dependencies (not included in this zip)

This copy **excludes** `node_modules`, `.next`, and caches. After reading the docs:

```bash
# API
cd Wapto-api && npm install

# Frontend (tenant app)
cd ../Wapto-frontend && npm install

# Admin
cd ../Wapto-admin && npm install
```

Use the commands and ports from the documentation pages you followed (local vs VPS vs Docker).

**Database seeding** (default admin, roles, pages) is described in the installation docs; the API also supports `npm run seed` in `Wapto-api/` when you are ready.

---

## Step 5 — Sidebar map (beyond installation)

After deployment, use the same `wapto-documentation/` site for day-to-day operation:

| Sidebar section | Purpose |
|-----------------|--------|
| **Core Features** / **Advanced Features** | Product capabilities |
| **Admin Meta Details** | Meta Business Partner, pricing, permissions, billing |
| **Usage** | Admin, tenant, and agent usage guides |
| **Admin Guide** | CMS, plans, users, settings, gateways |
| **Tenant / Agent guides** | Inbox, WABA, campaigns, automations, etc. |

Use search or browse the left nav — every `.html` file in `wapto-documentation/` is one article.

---

## Step 6 — Post-deploy checks (from documentation)

After DNS and SSL are live, confirm in the docs and in the live apps:

1. **Admin** — log in with seeded super-admin credentials; open **System Preferences** and save settings.
2. **Frontend** — open the tenant URL; verify login and **Integrate WABA** if using WhatsApp.
3. **API** — health and public routes (e.g. settings, public pages) respond without 502.
4. **Docs** — documentation site loads CSS (`assets/css/fontawesome.css` etc.).

Details and troubleshooting are in **Update** and the VPS installation pages.

---

## Quick reference — installation HTML files

```
wapto-documentation/
├── index.html                 ← START: open in browser
├── prerequisite.html
├── overview.html
├── quick-installation.html
├── local-server.html          ← backend local
├── virtual-server.html        ← backend VPS
├── cpanel.html
├── frontend-local.html
├── frontend-vps.html
├── vercel.html
├── database-seeding.html
└── update.html

Legacy URLs (redirect only): `live-server.html`, `frontend-installation.html`
```

---

## Support

- Documentation: `wapto-documentation/` (this package)
- Email (as linked in docs): hello@wapto.com

---

*Read `wapto-documentation/index.html` first, then follow the “Wapto Installation” section in the sidebar before changing code or deploying.*
