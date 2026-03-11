/**
 * AI Content Analysis Utilities
 * 
 * Provides sophisticated title generation and summarization for slot content.
 * Uses AI chat API when available, with intelligent client-side NLP fallback.
 */

import { chatCompletion } from '../../../lib/api/aiChat';
import { getAccessToken } from '../../../lib/api';

// ─── AI-Powered Title Generation ────────────────────────────────────────────

/**
 * Generate an accurate, concise title for content using AI or smart fallback.
 * Priority: AI API → Client-side NLP analysis
 */
export async function generateSmartTitle(content: string): Promise<string> {
  const trimmed = content.trim();
  if (!trimmed) return "Untitled";

  // Try AI API first (if authenticated and backend available)
  try {
    if (getAccessToken()) {
      const response = await chatCompletion({
        providerType: "openai",
        messages: [
          {
            role: "system",
            content: "You are an expert academic title generator with deep knowledge across sciences, humanities, and engineering. Analyze the content's domain, methodology, and core argument. Produce a single precise title (3-8 words) that would be immediately recognizable to a domain expert. Match the language of the original content. Return ONLY the title text — no quotes, no prefixes, no explanation."
          },
          {
            role: "user",
            content: `Generate the most accurate, domain-specific title for this content:\n\n${trimmed.substring(0, 3000)}`
          }
        ],
        temperature: 0.3,
        maxTokens: 30,
      });
      const title = response.content?.trim();
      if (title && title.length > 0 && title.length < 120) {
        return title.replace(/^["']|["']$/g, ''); // Strip wrapping quotes
      }
    }
  } catch {
    // AI API unavailable — fall through to client-side analysis
  }

  // ─── Client-side NLP Fallback ───────────────────────────────────────────
  return generateTitleFromContent(trimmed);
}

/**
 * Client-side title generation using NLP heuristics:
 * 1. Detect numbered sections / headings (e.g., "ΤΟΜΕΑΣ 1:", "## Chapter")
 * 2. Extract the dominant topic from keyword frequency analysis
 * 3. Identify named entities (capitalized multi-word phrases)
 * 4. Use first meaningful sentence as last resort
 */
function generateTitleFromContent(content: string): string {
  // 1. Check for explicit headings / section markers
  const headingPatterns = [
    /^#{1,3}\s+(.+)$/m,                           // Markdown headings
    /^(?:ΤΟΜΕΑΣ|ΚΕΦΑΛΑΙΟ|ΕΝΟΤΗΤΑ|SECTION|CHAPTER|TOPIC)\s*\d*[.:]\s*(.+)$/im,
    /^(?:Title|Τίτλος)[:\s]+(.+)$/im,
    /^(?:\d+\.)\s+(.{10,80})$/m,                   // Numbered section
  ];

  for (const pattern of headingPatterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      const heading = match[1].trim();
      if (heading.length >= 5 && heading.length <= 80) {
        return truncateTitle(heading);
      }
    }
  }

  // 2. Keyword frequency analysis (TF-based)
  const title = extractTopicTitle(content);
  if (title) return title;

  // 3. First meaningful sentence
  return extractFirstMeaningSentence(content);
}

/**
 * Extract the dominant topic using word frequency analysis.
 * Filters out stop words, scores bigrams, and picks the most informative phrase.
 */
function extractTopicTitle(content: string): string | null {
  const stopWords = new Set([
    // English
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
    'should', 'may', 'might', 'must', 'can', 'could', 'that', 'this',
    'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our',
    'you', 'your', 'he', 'she', 'his', 'her', 'not', 'no', 'nor', 'but',
    'and', 'or', 'if', 'then', 'else', 'when', 'where', 'how', 'what',
    'which', 'who', 'whom', 'why', 'with', 'without', 'from', 'for',
    'to', 'in', 'on', 'at', 'by', 'about', 'as', 'into', 'of', 'up',
    'out', 'off', 'over', 'under', 'again', 'further', 'also', 'more',
    'most', 'very', 'just', 'than', 'so', 'too', 'only', 'own', 'same',
    'both', 'each', 'few', 'other', 'some', 'such', 'all', 'any', 'every',
    'here', 'there', 'once', 'after', 'before', 'between', 'through',
    // Greek
    'και', 'να', 'το', 'τα', 'τη', 'τις', 'της', 'του', 'των', 'στο',
    'στα', 'στη', 'στις', 'στον', 'στην', 'από', 'για', 'με', 'σε', 'ένα',
    'μια', 'ένας', 'αυτό', 'αυτή', 'αυτά', 'αυτές', 'αυτοί', 'που',
    'δεν', 'θα', 'αν', 'ότι', 'ως', 'αλλά', 'είναι', 'ήταν', 'έχει',
    'πως', 'πού', 'πότε', 'γιατί', 'όταν', 'μπορεί', 'πρέπει', 'μου',
    'σου', 'μας', 'σας', 'τους', 'την', 'τον', 'ένα', 'δύο', 'τρία',
    'ή', 'αφού', 'πριν', 'μετά', 'εάν', 'είτε', 'ούτε', 'λοιπόν',
  ]);

  // Tokenize and filter
  const words = content
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => w.toLowerCase());

  if (words.length < 3) return null;

  // Count content word frequencies
  const freq = new Map<string, number>();
  for (const w of words) {
    if (!stopWords.has(w) && w.length > 3) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }

  // Score bigrams (adjacent word pairs)
  const bigramFreq = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (!stopWords.has(a) && !stopWords.has(b) && a.length > 2 && b.length > 2) {
      const bigram = `${a} ${b}`;
      bigramFreq.set(bigram, (bigramFreq.get(bigram) || 0) + 1);
    }
  }

  // Find top bigram (appears at least twice)
  let topBigram: string | null = null;
  let topBigramScore = 0;
  for (const [bigram, count] of bigramFreq) {
    if (count >= 2 && count > topBigramScore) {
      topBigramScore = count;
      topBigram = bigram;
    }
  }

  // Find top unigrams
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const topWords = sorted.slice(0, 5).map(([w]) => w);

  // Detect named entities (Capitalized phrases in original text)
  const entityPattern = /(?:[A-ZΑ-Ω][a-zα-ωά-ώ]+(?:\s+[A-ZΑ-Ω][a-zα-ωά-ώ]+)+)/g;
  const entities = content.match(entityPattern) || [];
  const entityFreq = new Map<string, number>();
  for (const e of entities) {
    entityFreq.set(e, (entityFreq.get(e) || 0) + 1);
  }
  const topEntity = [...entityFreq.entries()].sort((a, b) => b[1] - a[1])[0];

  // Build title from best signals
  if (topEntity && topEntity[1] >= 2) {
    // Named entity appears multiple times — likely the subject
    const entityTitle = topEntity[0];
    if (topWords[0] && !entityTitle.toLowerCase().includes(topWords[0])) {
      return truncateTitle(`${entityTitle}: ${capitalize(topWords[0])}`);
    }
    return truncateTitle(entityTitle);
  }

  if (topBigram && topBigramScore >= 2) {
    // Frequent bigram — use as core phrase
    const parts = topBigram.split(' ').map(capitalize);
    if (topWords[0] && !topBigram.includes(topWords[0])) {
      return truncateTitle(`${parts.join(' ')} — ${capitalize(topWords[0])}`);
    }
    return truncateTitle(parts.join(' '));
  }

  if (topWords.length >= 2) {
    return truncateTitle(topWords.slice(0, 4).map(capitalize).join(' '));
  }

  return null;
}

/**
 * Extract first meaningful sentence (>20 chars, not a heading marker).
 */
function extractFirstMeaningSentence(content: string): string {
  const sentences = content
    .split(/[.!?;·]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && !/^[#\-*=]+/.test(s));

  if (sentences.length > 0) {
    return truncateTitle(sentences[0]);
  }

  // Absolute fallback — first N words
  const words = content.split(/\s+/).slice(0, 8).join(' ');
  return truncateTitle(words);
}

function truncateTitle(text: string, maxLen = 60): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 1).trim() + '…';
}

function capitalize(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}


// ─── AI-Powered Summary Generation ─────────────────────────────────────────

/**
 * Generate an accurate, comprehensive summary using AI or smart fallback.
 */
export async function generateSmartSummary(content: string): Promise<string> {
  const trimmed = content.trim();
  if (!trimmed) return "";

  // Try AI API first
  try {
    if (getAccessToken()) {
      const response = await chatCompletion({
        providerType: "openai",
        messages: [
          {
            role: "system",
            content: "You are an expert academic summarizer with deep knowledge across all research domains. Produce a precise, structured summary (2-4 sentences) that captures: (1) the central thesis or research question, (2) the methodology or key arguments, (3) the main findings or conclusions. Preserve domain-specific terminology. Match the language of the original content. Return ONLY the summary text — no labels, no prefixes."
          },
          {
            role: "user",
            content: `Provide an expert-level summary of the following content:\n\n${trimmed.substring(0, 6000)}`
          }
        ],
        temperature: 0.3,
        maxTokens: 200,
      });
      const summary = response.content?.trim();
      if (summary && summary.length > 10) {
        return summary;
      }
    }
  } catch {
    // AI API unavailable — fall through to client-side
  }

  // ─── Client-side Extractive Summary ─────────────────────────────────────
  return generateExtractiveSummary(trimmed);
}

/**
 * Client-side extractive summarization:
 * 1. Split content into sentences
 * 2. Score each sentence by keyword density + position + length
 * 3. Pick top 3-4 sentences in original order
 */
function generateExtractiveSummary(content: string): string {
  // Split into sentences (handle both Latin and Greek punctuation)
  const sentenceBreaks = content.split(/(?<=[.!?;·])\s+/);
  const sentences = sentenceBreaks
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 500);

  if (sentences.length <= 3) {
    return sentences.join(' ');
  }

  // Build vocabulary frequency (content words only)
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could',
    'should', 'may', 'might', 'must', 'that', 'this', 'it', 'they', 'we',
    'you', 'he', 'she', 'not', 'but', 'and', 'or', 'if', 'then', 'when',
    'where', 'how', 'what', 'which', 'who', 'with', 'from', 'for', 'to',
    'in', 'on', 'at', 'by', 'about', 'as', 'of', 'up', 'out', 'so',
    'than', 'too', 'very', 'just', 'also', 'more', 'most',
    'και', 'να', 'το', 'τα', 'τη', 'της', 'του', 'των', 'στο', 'στα',
    'από', 'για', 'με', 'σε', 'ένα', 'μια', 'που', 'δεν', 'θα', 'αν',
    'ότι', 'ως', 'αλλά', 'είναι', 'ήταν', 'έχει', 'ή', 'αυτό', 'αυτή',
  ]);

  const allWords = content
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => w.toLowerCase());

  const wordFreq = new Map<string, number>();
  for (const w of allWords) {
    if (!stopWords.has(w) && w.length > 3) {
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }
  }

  // Normalize frequencies
  const maxFreq = Math.max(...wordFreq.values(), 1);

  // Score each sentence
  const scored = sentences.map((sentence, index) => {
    const words = sentence
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .map(w => w.toLowerCase());

    // Keyword density score
    let keywordScore = 0;
    for (const w of words) {
      keywordScore += (wordFreq.get(w) || 0) / maxFreq;
    }
    keywordScore = words.length > 0 ? keywordScore / words.length : 0;

    // Position score (first and last sentences are important)
    const positionScore = index === 0 ? 0.3 
      : index === sentences.length - 1 ? 0.15 
      : index < 3 ? 0.1 
      : 0;

    // Length score (prefer medium-length sentences)
    const idealLength = 80;
    const lengthScore = 1 - Math.abs(sentence.length - idealLength) / 300;

    // Cue phrase bonus (sentences starting with conclusion/summary indicators)
    const cuePatterns = /^(?:therefore|thus|consequently|in\s+conclusion|to\s+summarize|overall|importantly|significantly|the\s+key|specifically|notably|επομένως|συνεπώς|συμπερασματικά|συνοπτικά|σημαντικά|ειδικότερα)/i;
    const cueBonus = cuePatterns.test(sentence) ? 0.2 : 0;

    return {
      sentence,
      index,
      score: keywordScore + positionScore + Math.max(0, lengthScore) + cueBonus,
    };
  });

  // Select top 3 sentences, maintain original order
  const topN = Math.min(3, Math.ceil(sentences.length * 0.3));
  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence);

  return selected.join(' ');
}
