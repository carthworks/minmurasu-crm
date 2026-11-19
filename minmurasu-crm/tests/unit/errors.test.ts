import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toUserError } from '../../src/lib/errors.ts';

const GENERIC = 'Something went wrong. Please try again.';

test('passes through messages raised by our SQL functions (P0001)', () => {
  assert.equal(
    toUserError({ code: 'P0001', message: 'Payment exceeds the outstanding balance of INR 50.00' }),
    'Payment exceeds the outstanding balance of INR 50.00'
  );
});

test('hides raw RLS violations behind a permission message', () => {
  assert.equal(
    toUserError({ code: '42501', message: 'new row violates row-level security policy for table "invoices"' }),
    "You don't have permission to do that."
  );
  assert.equal(
    toUserError({ code: '42501', message: 'permission denied for table invoices' }),
    "You don't have permission to do that."
  );
});

test('shows our own 42501 trigger guard messages', () => {
  assert.equal(
    toUserError({ code: '42501', message: 'An organization must keep at least one active admin' }),
    'An organization must keep at least one active admin'
  );
});

test('maps constraint violations to friendly text', () => {
  assert.equal(
    toUserError({ code: '23505', message: 'duplicate key value violates unique constraint "invoices_invoice_number_key"' }),
    'A record with these details already exists.'
  );
  assert.match(toUserError({ code: '23503', message: 'fk' }), /related record/);
  assert.match(toUserError({ code: '22P02', message: 'invalid input syntax for type uuid' }), /invalid/);
});

test('never leaks unknown database messages', (t) => {
  t.mock.method(console, 'error', () => {});
  const msg = toUserError({ code: 'XX000', message: 'relation "secret_table" does not exist' });
  assert.equal(msg, GENERIC);
  assert.ok(!msg.includes('secret_table'));
});

test('handles null and empty errors', () => {
  assert.equal(toUserError(null), GENERIC);
  assert.equal(toUserError({ code: 'P0001', message: '' }), GENERIC);
});
