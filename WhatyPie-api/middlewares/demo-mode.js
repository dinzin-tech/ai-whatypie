import jwt from 'jsonwebtoken';
import { Setting, User } from '../models/index.js';

const CACHE_MS = 60 * 1000;
let cached = { value: null, at: 0 };
let demoEmailsCache = { emails: [], at: 0 };

export function clearDemoModeCache() {
  cached = { value: null, at: 0 };
  demoEmailsCache = { emails: [], at: 0 };
}

export async function isDemoMode() {
  const now = Date.now();
  if (cached.value !== null && now - cached.at < CACHE_MS) {
    return cached.value;
  }
  try {
    const setting = await Setting.findOne({}).select('is_demo_mode').lean();
    const value = setting?.is_demo_mode === true || setting?.is_demo_mode === 1;
    cached = { value, at: now };
    return value;
  } catch (err) {
    console.error('demo-mode middleware: failed to read setting', err);
    return false;
  }
}

async function getDemoAccountEmails() {
  const now = Date.now();
  if (demoEmailsCache.emails.length && now - demoEmailsCache.at < CACHE_MS) {
    return demoEmailsCache.emails;
  }
  try {
    const setting = await Setting.findOne({}).select('demo_user_email demo_agent_email').lean();
    const emails = [setting?.demo_user_email, setting?.demo_agent_email]
      .filter(Boolean)
      .map((e) => String(e).trim().toLowerCase());
    demoEmailsCache = { emails, at: now };
    return emails;
  } catch (err) {
    console.error('demo-mode middleware: failed to read demo emails', err);
    return [];
  }
}

async function tryResolveUserEmail(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('email deleted_at').lean();
    if (!user?.email || user.deleted_at) {
      return null;
    }
    return user.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

/** True when this login is a showcase demo account, not the deployed super admin. */
async function isDemoAccountEmail(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const deployAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (deployAdmin && normalized === deployAdmin) {
    return false;
  }
  const demoEmails = await getDemoAccountEmails();
  return demoEmails.includes(normalized);
}

const ALLOWED_PATHS = [
  '/api/webhook/stripe',
  '/api/webhook/razorpay',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
];

function isAllowedPath(path) {
  return ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + '?'));
}

const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export const denyMutationInDemo = async (req, res, next) => {
  if (!MUTATING_METHODS.includes(req.method)) {
    return next();
  }
  if (isAllowedPath(req.originalUrl)) {
    return next();
  }

  const demo = await isDemoMode();
  if (!demo) {
    return next();
  }

  const userEmail = await tryResolveUserEmail(req);
  if (userEmail && !(await isDemoAccountEmail(userEmail))) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'action is denied in demo mode',
  });
};
