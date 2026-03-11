const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const ID_PREFIX_REGEX = /\b(?:id|doc_id|document_id|segment_id)\s*[:=]\s*[^\s)]+/gi;
const ID_PARENS_REGEX = /\(\s*(?:id|doc_id|document_id|segment_id)\s*[:=][^)]+\)/gi;

export function stripIdsFromText(input: string) {
  return input
    .replace(UUID_REGEX, "")
    .replace(ID_PARENS_REGEX, "")
    .replace(ID_PREFIX_REGEX, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

export function extractTitleFromText(text: string) {
  const cleaned = text.trim();
  if (!cleaned) return "Untitled";
  const lines = cleaned.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return "Untitled";
  const heading = lines.find((line) => line.startsWith("#"));
  if (heading) {
    return stripIdsFromText(heading.replace(/^#+\s*/, "")) || "Untitled";
  }
  const titleLine = lines.find((line) => /^title\s*:/i.test(line));
  if (titleLine) {
    return stripIdsFromText(titleLine.replace(/^title\s*:/i, "")) || "Untitled";
  }
  return stripIdsFromText(lines[0].slice(0, 120)) || "Untitled";
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function formatScore(score?: number | null) {
  if (score === null || score === undefined || Number.isNaN(score)) return "0.00";
  return score.toFixed(2);
}

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
