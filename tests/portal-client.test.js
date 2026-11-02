import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digits, formatDate, formatMoney, formatSize, isCode, isEmail, unreadCount } from '../src/pages/portal/api.ts';

test('client space: input helpers match the server rules', () => {
  assert.equal(isEmail('jane@example.com'), true);
  assert.equal(isEmail('jane..doe@example.com'), false);
  assert.equal(isEmail('not-an-email'), false);
  assert.equal(digits('123 456'), '123456');
  assert.equal(digits('12-34-56-78'), '123456');
  assert.equal(isCode('123456'), true);
  assert.equal(isCode('12345a'), false);
});

test('client space: money, dates and sizes come from stored values only', () => {
  assert.equal(formatMoney(260, 'usd', 'en'), '$2.60');
  assert.equal(formatMoney(110000, 'usd', 'en'), '$1,100');
  assert.equal(formatDate('2026-12-01', 'en'), 'December 1, 2026');
  assert.equal(formatDate(null, 'en'), '');
  assert.equal(formatSize(2.5 * 1024 * 1024, 'en'), '2.5 MB');
  assert.equal(formatSize(null, 'en'), '');
});

test('client space: unread badge counts unread items and unread replies', () => {
  const home = {
    items: [{ read: false }, { read: true }],
    messages: [{ read: true }, { read: false }, { read: false }]
  };
  assert.equal(unreadCount(home), 3);
});
