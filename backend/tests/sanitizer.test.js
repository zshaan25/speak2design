import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHTMLContent, sanitizeCanvas } from '../controllers/voiceController.js';

test('sanitizeHTMLContent strips <script> tags', () => {
  const dirty = '<div>hi</div><script>alert(1)</script>';
  const clean = sanitizeHTMLContent(dirty);
  assert.ok(!clean.includes('<script'));
  assert.ok(clean.includes('hi'));
});

test('sanitizeHTMLContent strips inline event handlers', () => {
  const clean = sanitizeHTMLContent('<img src="x" onerror="alert(1)">');
  assert.ok(!/onerror/i.test(clean));
});

test('sanitizeHTMLContent neutralises javascript: URLs', () => {
  const clean = sanitizeHTMLContent('<a href="javascript:alert(1)">x</a>');
  assert.ok(!/javascript:/i.test(clean));
});

test('sanitizeHTMLContent removes <iframe>', () => {
  const clean = sanitizeHTMLContent('<iframe src="https://evil.test"></iframe>');
  assert.ok(!/<iframe/i.test(clean));
});

test('sanitizeHTMLContent keeps safe Tailwind markup', () => {
  const html = '<nav class="bg-slate-900 text-white px-6 py-4">Home</nav>';
  assert.equal(sanitizeHTMLContent(html), html);
});

test('sanitizeHTMLContent handles non-string input', () => {
  assert.equal(sanitizeHTMLContent(null), '');
  assert.equal(sanitizeHTMLContent(undefined), '');
  assert.equal(sanitizeHTMLContent(42), '');
});

test('sanitizeCanvas drops components with disallowed types', () => {
  const out = sanitizeCanvas([
    { id: '1', type: 'navbar', name: 'Nav', htmlContent: '<nav>x</nav>' },
    { id: '2', type: 'malware', name: 'Bad', htmlContent: '<div>x</div>' },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, 'navbar');
});

test('sanitizeCanvas backfills a missing id', () => {
  const out = sanitizeCanvas([{ type: 'hero', name: 'Hero', htmlContent: '<section>x</section>' }]);
  assert.equal(out.length, 1);
  assert.ok(typeof out[0].id === 'string' && out[0].id.length > 0);
});

test('sanitizeCanvas sanitizes htmlContent of each component', () => {
  const out = sanitizeCanvas([
    { id: '1', type: 'hero', name: 'Hero', htmlContent: '<section>ok</section><script>bad()</script>' },
  ]);
  assert.ok(!out[0].htmlContent.includes('<script'));
});

test('sanitizeCanvas returns empty array for non-array input', () => {
  assert.deepEqual(sanitizeCanvas(null), []);
  assert.deepEqual(sanitizeCanvas('nope'), []);
  assert.deepEqual(sanitizeCanvas({}), []);
});
