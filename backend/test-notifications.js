/**
 * Quick notification smoke-test.
 *
 * Usage:
 *   node test-notifications.js
 *
 * Set these env vars (or edit the constants below) before running:
 *   USER_TOKEN   — JWT of a regular (non-admin) user
 *   ADMIN_TOKEN  — JWT of the admin user
 *   API_URL      — base URL of the backend (default: http://localhost:3000)
 *
 * How to get tokens:
 *   Open the browser DevTools on the frontend → Application → Local Storage
 *   Copy the value of `sb-<project>-auth-token` → `access_token` field.
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const API_URL  = process.env.API_URL    || 'http://localhost:3000';
const USER_TOKEN  = process.env.USER_TOKEN  || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

if (!USER_TOKEN || !ADMIN_TOKEN) {
  console.error(`
  ❌  Set USER_TOKEN and ADMIN_TOKEN before running.

  Example:
    $env:USER_TOKEN  = "eyJhbGc..."
    $env:ADMIN_TOKEN = "eyJhbGc..."
    node test-notifications.js
  `);
  process.exit(1);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function request(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const lib = url.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : undefined;
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function ok(label, cond, detail) {
  if (cond) {
    console.log('  ✅ ', label);
  } else {
    console.error('  ❌ ', label, detail ? ('→ ' + JSON.stringify(detail)) : '');
  }
}

// ── tests ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🔔  Notification Smoke-Test');
  console.log('    API:', API_URL);
  console.log('─'.repeat(50));

  // ── 1. Snapshot admin unread count before ──────────────────────────────────
  console.log('\n[1] Admin unread count (before)');
  const before = await request('GET', '/api/notifications/unread-count', ADMIN_TOKEN);
  ok('GET /api/notifications/unread-count returns 200', before.status === 200, before.body);
  const countBefore = before.body?.count ?? -1;
  console.log('     count before:', countBefore);

  // ── 2. Post a mandate as a regular user ────────────────────────────────────
  console.log('\n[2] POST /api/mandates (as user)');
  const mandate = await request('POST', '/api/mandates', USER_TOKEN, {
    type: 'BUY',
    title: 'Test Mandate ' + Date.now(),
    description: 'Automated notification test',
    city: 'Mumbai',
    state: 'Maharashtra',
    propertyType: 'COMMERCIAL',
    ticketSize: 5000000,
    tags: [],
    isOffMarket: false,
  });
  ok('POST /api/mandates returns 201', mandate.status === 201, mandate.body);
  const mandateId = mandate.body?.id;
  console.log('     mandate id:', mandateId);

  if (mandate.status !== 201) {
    console.error('\n     Cannot continue — mandate POST failed.');
    return;
  }

  // Wait a moment for the async notification to persist
  await new Promise(r => setTimeout(r, 1500));

  // ── 3. Check poster gets a notification ───────────────────────────────────
  console.log('\n[3] User notifications (poster should see MANDATE_POSTED)');
  const userNotifs = await request('GET', '/api/notifications', USER_TOKEN);
  ok('GET /api/notifications returns 200', userNotifs.status === 200, userNotifs.body);
  const posterNotif = (userNotifs.body || []).find(n => n.type === 'MANDATE_POSTED');
  ok('Poster has a MANDATE_POSTED notification', !!posterNotif, userNotifs.body?.[0]);

  // ── 4. Check admin gets a notification ────────────────────────────────────
  console.log('\n[4] Admin notifications (admin should see MANDATE_POSTED)');
  const adminNotifs = await request('GET', '/api/notifications', ADMIN_TOKEN);
  ok('GET /api/notifications returns 200', adminNotifs.status === 200, adminNotifs.body);
  const adminNotif = (adminNotifs.body || []).find(n => n.type === 'MANDATE_POSTED');
  ok('Admin has a MANDATE_POSTED notification', !!adminNotif, adminNotifs.body?.[0]);

  const countAfter = await request('GET', '/api/notifications/unread-count', ADMIN_TOKEN);
  const newCount = countAfter.body?.count ?? -1;
  ok('Admin unread count increased', newCount > countBefore, { before: countBefore, after: newCount });

  // ── 5. Check user gets a notification for unread count ────────────────────
  console.log('\n[5] User unread count (poster)');
  const userCount = await request('GET', '/api/notifications/unread-count', USER_TOKEN);
  ok('User unread count > 0', (userCount.body?.count ?? 0) > 0, userCount.body);

  console.log('\n─'.repeat(50));
  console.log('Done. If any ❌ appear, check the backend terminal logs for:');
  console.log('  "[mandates] admin IDs found: [...]"');
  console.log('  If the array is empty, run: node set-admin.js');
}

run().catch(console.error);
