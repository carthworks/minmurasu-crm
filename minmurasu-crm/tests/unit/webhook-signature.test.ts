import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyMetaSignature } from '../../src/lib/security/webhook-signature.ts';

const SECRET = 'test-app-secret';
const BODY = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
const sign = (body: string, secret = SECRET) =>
  'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

test('accepts a correct signature', () => {
  assert.equal(verifyMetaSignature(BODY, sign(BODY), SECRET), true);
});

test('rejects a signature made with another secret', () => {
  assert.equal(verifyMetaSignature(BODY, sign(BODY, 'other'), SECRET), false);
});

test('rejects a tampered body', () => {
  assert.equal(verifyMetaSignature(BODY + ' ', sign(BODY), SECRET), false);
});

test('rejects missing header, missing secret, wrong prefix and wrong length', () => {
  assert.equal(verifyMetaSignature(BODY, null, SECRET), false);
  assert.equal(verifyMetaSignature(BODY, sign(BODY), ''), false);
  assert.equal(verifyMetaSignature(BODY, sign(BODY), undefined), false);
  assert.equal(verifyMetaSignature(BODY, sign(BODY).replace('sha256=', 'sha1='), SECRET), false);
  assert.equal(verifyMetaSignature(BODY, 'sha256=abc', SECRET), false);
});
