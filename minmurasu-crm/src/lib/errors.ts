// Maps Supabase/PostgREST errors to messages that are safe to show users.
// Raw Postgres messages can leak table, column and policy names, so they are
// logged server-side and replaced with a generic message unless they are
// validation errors we raise on purpose (SQLSTATE P0001, or our own 42501 guards).

export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
}

const GENERIC = 'Something went wrong. Please try again.';
const NO_PERMISSION = "You don't have permission to do that.";

export function toUserError(error: DbErrorLike | null | undefined, context = 'database'): string {
  if (!error) return GENERIC;
  const code = error.code ?? '';
  const message = (error.message ?? '').trim();

  switch (code) {
    case 'P0001':
      // RAISE EXCEPTION from our own SQL functions: written for end users.
      return message || GENERIC;
    case '42501':
      if (!message || /row-level security|permission denied/i.test(message)) {
        return NO_PERMISSION;
      }
      // Our trigger guards (e.g. "An organization must keep at least one active admin").
      return message;
    case '23505':
      return 'A record with these details already exists.';
    case '23503':
      return 'A related record was not found. Refresh the page and try again.';
    case '23502':
    case '23514':
    case '22P02':
    case '22007':
    case '22008':
      return 'Some of the values entered are invalid.';
    case 'PGRST116':
      return 'Record not found.';
    default:
      console.error(`[${context}]`, code, message);
      return GENERIC;
  }
}
