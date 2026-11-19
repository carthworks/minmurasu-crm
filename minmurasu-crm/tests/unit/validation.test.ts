import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isUuid, normalizePhone } from '../../src/lib/validation.ts';

test('isUuid', () => {
  assert.equal(isUuid('20000000-0000-0000-0000-000000000001'), true);
  assert.equal(isUuid('20000000-0000-0000-0000-00000000000G'), false);
  assert.equal(isUuid('all'), false);
  assert.equal(isUuid(''), false);
  assert.equal(isUuid(undefined), false);
  assert.equal(isUuid(42), false);
});

test('normalizePhone: Indian numbers in common formats collapse to one value', () => {
  const expected = '+919876543210';
  for (const input of ['9876543210', '98765 43210', '+91 98765-43210', '09876543210', '919876543210', '(+91) 98765 43210']) {
    assert.equal(normalizePhone(input), expected, input);
  }
});

test('normalizePhone: keeps other international numbers', () => {
  assert.equal(normalizePhone('+1 (415) 555-0100'), '+14155550100');
  assert.equal(normalizePhone('+44 20 7946 0958'), '+442079460958');
});

test('normalizePhone: strips filter-syntax characters', () => {
  assert.equal(normalizePhone('9876543210),email.eq.x'), '+919876543210');
});

test('normalizePhone: rejects empty and implausible input', () => {
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone('abc'), null);
  assert.equal(normalizePhone('123'), null);
  assert.equal(normalizePhone('1234567890123456'), null);
});
