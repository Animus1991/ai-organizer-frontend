import type { ResultItem } from "../types";

export function normalizeDoi(value: string) {
  if (!value) return "";
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
}

export function validateDoi(value: string) {
  const normalized = normalizeDoi(value);
  if (!normalized) return "empty" as const;
  const doiPattern = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
  return doiPattern.test(normalized) ? ("valid" as const) : ("invalid" as const);
}

export function dedupeResults(items: ResultItem[]) {
  const seen = new Set<string>();
  const deduped: ResultItem[] = [];
  for (const item of items || []) {
    const doiKey = item.doi ? normalizeDoi(item.doi) : "";
    const titleKey = (item.title || "").toLowerCase().trim();
    const key = doiKey || titleKey;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    deduped.push(item);
  }
  return deduped;
}
