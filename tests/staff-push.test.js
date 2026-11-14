import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStaffPinger, DEFAULT_STAFF_PUSH_URL, staffPushUrl } from '../api/_lib/portal/staff-push.js';

test('staff push: POSTs to the dashboard with no body and no key', async () => {
  const calls = [];
  const ping = createStaffPinger({ env: {}, fetch: async (url, init) => calls.push({ url, init }) });
  await ping();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, DEFAULT_STAFF_PUSH_URL);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.body, undefined);
  assert.equal(calls[0].init.headers, undefined);
});

test('staff push: a failing dashboard never fails the member action', async () => {
  const ping = createStaffPinger({ env: {}, fetch: async () => { throw new Error('down'); } });
  await assert.doesNotReject(ping());
});

test('staff push: only an https override is accepted', () => {
  assert.equal(staffPushUrl({ LEVELUP_STAFF_PUSH_URL: 'http://evil.example' }), DEFAULT_STAFF_PUSH_URL);
  assert.equal(staffPushUrl({ LEVELUP_STAFF_PUSH_URL: 'https://preview.example/api/push/staff' }), 'https://preview.example/api/push/staff');
});
