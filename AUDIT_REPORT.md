# WhatyPie Code Quality & Security Audit Report

This report presents the findings of a comprehensive code audit performed across the **WhatyPie** repository, covering the **API Backend (`Wapto-api`)**, the **Client Frontend (`Wapto-frontend`)**, and the **Admin Panel (`Wapto-admin`)**.

---

## Executive Summary

The codebase has a rich, modern feature set for a CRM and WhatsApp marketing platform. However, the audit revealed **several critical security vulnerabilities and logic bugs** that could compromise the application in a production environment:

1. **Security Vulnerabilities:** Hardcoded backend database credentials exposed to remote execution, fixed OTP bypasses (`123456`), unauthenticated settings APIs leaking SMTP config/API keys, cross-site scripting (XSS) risks on the client side, and open redirect vectors.
2. **Logic Bugs:** Broken cascading trial deletions that could delete paying customers' data, incorrect update aggregations corrupting subscription expiration dates, and non-functional delete-account endpoints due to undefined variables (`ReferenceError`).
3. **Admin Architecture:** A lack of client-side authentication redirect guards in the admin portal allows unauthenticated users to view route layouts, alongside invalid/non-existent package dependencies (like Next.js pinned to version 16.x).

Below is the structured breakdown of findings across all components.

---

## 🔵 1. API Backend (`Wapto-api`) Findings

### ════ CRITICAL SEVERITY ════

#### [API-C-01] Hardcoded DB Credentials & Remote Shell Execution (Unprotected Route)
* **File:** [auth.routes.js](Wapto-api/routes/auth.routes.js#L34-L95)
* **Description:** An unauthenticated GET route `/api/auth/refresh-db` exposes a hardcoded database host (`167.71.224.42`), username (`wapto_node_user`), and password (`strongpassword123`) in plain text. It executes shell commands using `execPromise()` with no validation on the backup path.
* **Fix:** Remove this route entirely from production.

#### [API-C-02] Hardcoded OTP Bypass ("123456")
* **File:** [auth.controller.js](Wapto-api/controllers/auth.controller.js#L28-L32)
* **Description:** The `generateOTP()` function ignores min/max limits and returns the static string `"123456"`. This allows an attacker to reset any user's password simply by guessing the fixed OTP.
* **Fix:** Generate a cryptographically secure random value using `crypto.randomInt()`.

#### [API-C-03] Hardcoded Encryption Key Fallback
* **File:** [encryption-utils.js](Wapto-api/utils/encryption-utils.js#L5) and `.env.example`
* **Description:** A fallback key `v8y/A?D(G+KbPeShVmYq3t6w9z$C&E)H` is hardcoded. This key encrypts sensitive WhatsApp integration tokens and payment keys. If the fallback is used in production, anyone with repository access can decrypt the credentials.
* **Fix:** Require `ENCRYPTION_KEY` to be defined in environment variables and throw a fatal error on startup if it is missing.

#### [API-C-04] Plaintext Demo Passwords Leaked in API Response
* **File:** [app.js](Wapto-api/app.js#L148-L177)
* **Description:** The `/api/is-demo-mode` endpoint returns raw demo user/agent passwords in plain text from settings. If demo mode is accidentally enabled in production, these credentials are fully exposed.
* **Fix:** Avoid storing passwords in plaintext; use hashed values or isolate demo-mode credentials.

#### [API-C-05] `deleteAccount` Endpoint Crashes on ReferenceError (`now` is undefined)
* **File:** [auth.controller.js](Wapto-api/controllers/auth.controller.js#L973-L978)
* **Description:** The account deletion controller attempts to use a variable named `now` to update database records. Because `now` is undefined, this throws a `ReferenceError` and crashes with a 500 error every time a user attempts to delete their account.
* **Fix:** Add `const now = new Date();` at the beginning of the function.

#### [API-C-06] Subscription Expiry Logic Corruption in Status Cron Job
* **File:** [status.cronService.js](Wapto-api/cronjob/status.cronService.js#L11-L38)
* **Description:** An update operation uses a plain query object to set `expires_at: "$current_period_end"`. MongoDB treats this as a literal string rather than referencing the document field, causing the date field to contain corrupted string values.
* **Fix:** Wrap the update query inside an aggregation pipeline array: `[{ $set: { expires_at: "$current_period_end" } }]`.

#### [API-C-07] Unbounded Cascade Delete on Expiration (Destructive Logic)
* **File:** [trialPeriod.cronService.js](Wapto-api/cronjob/trialPeriod.cronService.js#L37-L44)
* **Description:** A cron job iterates through all loaded schemas in Mongoose and runs `deleteMany({ user_id })` on every model. This lacks a dry-run check, confirmation, or audit trail, risking accidental deletion of shared or paid customer data.
* **Fix:** Implement a strict, explicit allow-list of schemas that can be cascade-deleted.

#### [API-C-08] Unauthenticated Settings Retrieval (SMTP Credentials Leak)
* **File:** [setting.routes.js](Wapto-api/routes/setting.routes.js#L30) and `setting.controller.js`
* **Description:** The `GET /api/settings` and `GET /api/setting` routes do not have authentication middleware. Anonymous users can access settings details, exposing the SMTP username, host, and partially masked API keys.
* **Fix:** Apply the `authenticate` middleware to the settings routes.

---

### ════ HIGH SEVERITY ════

* **[API-H-01] Missing Rate Limiting:** No rate limiting is configured on `/api/auth/login`, `/api/auth/verify-otp`, or password reset routes, leaving them vulnerable to brute-force attacks.
* **[API-H-02] Missing Security Headers:** `helmet` is not used in `app.js`, exposing the API to basic browser-level framing and clickjacking exploits.
* **[API-H-03] CORS Origin Check Substring Bug:** `allowedOrigins.includes(origin)` performs a substring check on a comma-separated string `process.env.ALLOWED_ORIGINS` in `app.js`. An attacker using a domain like `http://evil.com/localhost:3000` could bypass the CORS check.
* **[API-H-04] Sessions Never Expire:** There is no MongoDB TTL index on the sessions collection, and expired tokens are not cleaned up.
* **[API-H-05] Unauthenticated Webhooks:** `POST /webhook/whatsapp` does not verify the Meta `X-Hub-Signature-256` signature, accepting arbitrary payloads.
* **[API-H-06] ReDoS Vulnerability:** User inputs are passed directly to MongoDB `$regex` queries without escaping special characters, exposing the system to Regular Expression Denial of Service (ReDoS) CPU locks.

---

## 🟢 2. Client Frontend (`Wapto-frontend`) Findings

### ════ CRITICAL SEVERITY ════

#### [FE-C-01] XSS via Unsanitized Server-Side Content
* **File:** [PageContent.tsx](Wapto-frontend/src/components/landing/PageContent.tsx#L13)
* **Description:** Content received from the API is directly rendered using `dangerouslySetInnerHTML={{ __html: content }}` with no sanitization. If the server or an admin account is compromised, malicious script payloads will execute in visitors' browsers.
* **Fix:** Use `dompurify` to sanitize HTML content before rendering.

#### [FE-C-02] XSS in Data Export Utilities
* **File:** [exportUtils.ts](Wapto-frontend/src/utils/exportUtils.ts)
* **Description:** Fields such as title, description, and cell data are concatenated directly into HTML strings for Excel exports and printing without escaping. This exposes users to HTML injection/XSS when viewing exported reports.
* **Fix:** Escape all strings before concatenating them into HTML templates.

#### [FE-C-03] Open Redirect in Subscription Modals
* **File:** [SubscriptionModal.tsx](Wapto-frontend/src/components/subscription/SubscriptionModal.tsx)
* **Description:** Redirect links returned by payment gateways (`payment_link` or `approval_url`) are set directly to `window.location.href` without checking their destination, which could be abused for phishing redirections.
* **Fix:** Validate that the origin of the redirect matches known URLs (e.g., Stripe, PayPal, Razorpay) before updating the page location.

#### [FE-C-04] Bearer Token Leakage in Impersonation Redirects
* **File:** [ImpersonationBanner.tsx](Wapto-frontend/src/components/layouts/ImpersonationBanner.tsx#L26)
* **Description:** Admin restore-session URLs are built as query string parameters: `?token=${result.token}`. Tokens passed in query strings are leaked to browser history, proxy server logs, and tracking scripts.
* **Fix:** Use a POST request or session-to-session messaging (`postMessage`) to securely transfer auth states.

---

### ════ HIGH SEVERITY ════

* **[FE-H-01] Disabled React Strict Mode:** Strict mode is set to `false` in `next.config.ts`, hiding lifecycle bugs and memory leaks.
* **[FE-H-02] Incomplete Dependency Arrays:** Stale closures exist in several `useEffect` and `useCallback` hooks (like `SubscriptionModal` and `useSocketHandler`), causing UI updates to lag or use old state variables.
* **[FE-H-03] Unencrypted Settings in Storage:** The app caches the entire settings object (including API keys and `app_id` configs) as plain JSON inside `localStorage`.
* **[FE-H-04] SSR Import Crashes:** The Socket client singleton is initialized at module import time instead of inside a hook or client-safe provider, creating hydration mismatch issues.

---

## 🟡 3. Admin Portal (`Wapto-admin`) Findings

### ════ CRITICAL SEVERITY ════

#### [ADM-C-01] Missing Global Authentication Guard (Authentication Bypass)
* **File:** [MainProvider.tsx](Wapto-admin/src/app/MainProvider.tsx)
* **Description:** Unlike standard client-side architectures, the admin portal does not redirect unauthenticated users to the `/auth/login` page if `isAuthenticated` is false. Anonymous users can bypass the login screen and load layout structures.
* **Fix:** Add a redirect hook inside the main route provider:
  ```tsx
  useEffect(() => {
    const isAuthPage = pathname?.startsWith("/auth");
    if (!isAuthenticated && !isAuthPage) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, pathname, router]);
  ```

#### [ADM-C-02] Non-existent Next.js & ESLint Package Dependencies
* **File:** [package.json](Wapto-admin/package.json#L42)
* **Description:** The admin project defines `"next": "16.1.6"` and `"eslint-config-next": "16.1.6"`. As of 2026, Next.js 16.x is not a stable/released package. This causes installation issues or unexpected package manager fallbacks during builds.
* **Fix:** Pin dependencies to verified Next.js 15.x versions matching the frontend configuration.

---

### ════ HIGH SEVERITY ════

* **[ADM-H-01] Lack of Destructive Action Confirmations:** Multiple administrative mutations (such as deleting users, resetting settings, or removing faqs) are executed instantly upon clicking, lacking double confirmation dialog guards.
* **[ADM-H-02] Plaintext localStorage Cache:** Similarly to the frontend app, admin configurations and tokens are cached in plain text inside browser local storage.

---

## Recommendation & Action Plan

1. **Security Shielding:** Prioritize removing `/api/auth/refresh-db`, fixing the hardcoded `"123456"` OTP logic, and adding the redirect check in `MainProvider.tsx` for the Admin app.
2. **Data Integrity:** Correct the MongoDB pipeline query in `status.cronService.js` and add variables inside `deleteAccount` to prevent crash scenarios.
3. **Data Sanitization:** Apply sanitization libraries to rich HTML elements (`dangerouslySetInnerHTML`) and escape fields used in reporting modules.
