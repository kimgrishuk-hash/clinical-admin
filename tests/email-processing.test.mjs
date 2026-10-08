import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, summarizeEmail, hasAttachment, decodeHtmlEntities } from '../supabase/functions/clinic-gmail/email-processing.js';

test('classifies common clinic mail topics without confusing a receipt with reception', () => {
  assert.equal(classify('תוצאות בדיקת דם', '').category, 'תוצאות בדיקות');
  assert.equal(classify('בקשה לתור', '').category, 'תורים וקבלה');
  assert.equal(classify('חשבונית וקבלה', '').category, 'חשבוניות ותשלומים');
  assert.equal(classify('הזמנת ציוד רפואי', '').category, 'ספקים והזמנות');
  assert.equal(classify('שלום', 'לא מצליח להשתין').category, 'פניות רפואיות');
});

test('summary condenses the message, keeps two useful facts, and removes quoted thread/footer', () => {
  const body = 'שלום,\nרצינו לעדכן שהבדיקה של מיקה הסתיימה. התוצאה תקינה ואין צורך לחזור על הבדיקה.\nבברכה, המעבדה\nConfidentiality notice: this email is private';
  const summary = summarizeEmail('תוצאות בדיקות', 'תוצאות מיקה', body, true);
  assert.match(summary, /הבדיקה של מיקה הסתיימה/);
  assert.match(summary, /התוצאה תקינה/);
  assert.match(summary, /מצורף קובץ/);
  assert.doesNotMatch(summary, /Confidentiality|בברכה|נושא המייל/);
});

test('summary falls back to subject when the body contains only boilerplate', () => {
  assert.match(summarizeEmail('כללי', 'עדכון שעות פעילות', 'שלום רב, בברכה', false), /עדכון שעות פעילות/);
});

test('detects nested attachments', () => {
  assert.equal(hasAttachment({ parts: [{ filename: 'report.pdf', body: { attachmentId: 'abc' } }] }), true);
  assert.equal(hasAttachment({ parts: [{ filename: 'inline.png', body: { size: 0 } }] }), false);
});

test('decodes nested HTML entities such as the apostrophe in Gmail snippets', () => {
  assert.equal(decodeHtmlEntities('don&amp;#39;t &amp;amp; we&#39;ll'), "don't & we'll");
});
