// Shared search-normalization helpers. Edit here to change how queries and
// candidate strings are matched across global search, the applications page
// search, and the app comparison picker.

// Single source of truth for which characters are stripped during normalization.
// `isIgnoredChar` and `normalizeString` are derived from this — keep edits here.
const IGNORED_CHAR_SOURCE = "\\s:\\-.'";
const IGNORED_CHAR_RE = new RegExp(`[${IGNORED_CHAR_SOURCE}]`);
const IGNORED_CHARS_GLOBAL_RE = new RegExp(`[${IGNORED_CHAR_SOURCE}]+`, "g");

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isIgnoredChar = (ch: string): boolean => IGNORED_CHAR_RE.test(ch);

export function normalizeString(str: string | null | undefined): string {
  if (!isNonEmptyString(str)) return "";
  return str.toLowerCase().replace(IGNORED_CHARS_GLOBAL_RE, "");
}
