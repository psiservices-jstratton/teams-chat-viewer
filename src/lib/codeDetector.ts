import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import sql from 'highlight.js/lib/languages/sql';
import css from 'highlight.js/lib/languages/css';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import csharp from 'highlight.js/lib/languages/csharp';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('css', css);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('yaml', yaml);

/**
 * Convert HTML content to plain text, preserving line breaks.
 * <br> and <br/> become newlines, &nbsp; becomes space, tags stripped.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n/g, '\n');
}

/**
 * Try to parse text as JSON. Returns the parsed result if valid, null otherwise.
 */
function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if a block of text looks like code based on heuristics.
 */
function looksLikeCode(text: string): boolean {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return false;

  // Count code-like indicators
  let codeSignals = 0;
  const totalLines = lines.length;

  // Check for consistent indentation (spaces or tabs at start of lines)
  const indentedLines = lines.filter(l => /^\s{2,}/.test(l));
  if (indentedLines.length / totalLines > 0.3) codeSignals += 2;

  // Check for common code patterns
  const codePatterns = [
    /[{}[\]();]/, // brackets and semicolons
    /^\s*(const|let|var|function|class|import|export|return|if|else|for|while)\s/m,
    /^\s*(public|private|protected|static|void|int|string|bool)\s/m,
    /=>\s*[{(]/, // arrow functions
    /^\s*<\/?[a-zA-Z][a-zA-Z0-9]*[\s>]/m, // XML/HTML tags
    /^\s*(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|JOIN)\s/im, // SQL
    /^\s*(def |class |import |from |print\(|if __name__)/m, // Python
    /^\s*#\s*(include|define|ifdef|endif)/m, // C/C++ preprocessor
    /^\s*@(Component|Injectable|Module|Override|Test)/m, // decorators
    /^\s*(\.[\w-]+\s*\{|#[\w-]+\s*\{|[\w-]+\s*:\s*[\w-]+;)/m, // CSS
  ];

  for (const pattern of codePatterns) {
    if (pattern.test(text)) codeSignals++;
  }

  // Lines ending with common code terminators
  const terminatorLines = lines.filter(l =>
    /[;{},)\]:]$/.test(l.trim())
  );
  if (terminatorLines.length / totalLines > 0.3) codeSignals++;

  return codeSignals >= 3;
}

/**
 * Find the matching closing brace/bracket position in text, starting from an opening brace.
 */
function findMatchingBrace(text: string, startIdx: number): number {
  const open = text[startIdx];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"' && !escape) {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

interface ContentSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

/**
 * Split HTML message content into text and code segments.
 * Works on already-parsed content (with <br> for newlines, &nbsp; for spaces).
 */
function segmentContent(html: string): ContentSegment[] {
  const text = htmlToText(html);
  const segments: ContentSegment[] = [];
  let lastEnd = 0;

  // Find JSON blocks: look for { or [ at start of line or after whitespace
  const jsonPattern = /(?:^|\n)\s*([{[])/g;
  let match: RegExpExecArray | null;

  while ((match = jsonPattern.exec(text)) !== null) {
    const braceStart = match.index + match[0].indexOf(match[1]);
    const braceEnd = findMatchingBrace(text, braceStart);
    if (braceEnd === -1) continue;

    const candidate = text.slice(braceStart, braceEnd + 1);
    const parsed = tryParseJson(candidate);
    if (parsed === null) continue;

    // Only treat as JSON code block if it's multi-line or complex
    const prettyJson = JSON.stringify(parsed, null, 2);
    if (prettyJson.split('\n').length < 3) continue;

    // Add preceding text as a text segment
    if (braceStart > lastEnd) {
      const before = text.slice(lastEnd, braceStart).trim();
      if (before) {
        segments.push({ type: 'text', content: before });
      }
    }

    segments.push({
      type: 'code',
      content: prettyJson,
      language: 'json',
    });

    lastEnd = braceEnd + 1;
    jsonPattern.lastIndex = lastEnd;
  }

  // Handle remaining text
  if (lastEnd < text.length) {
    const remaining = text.slice(lastEnd).trim();
    if (remaining) {
      // Check if the remaining text itself looks like code
      if (looksLikeCode(remaining) && remaining.split('\n').length >= 3) {
        const result = hljs.highlightAuto(remaining);
        segments.push({
          type: 'code',
          content: remaining,
          language: result.language || undefined,
        });
      } else {
        segments.push({ type: 'text', content: remaining });
      }
    }
  }

  // If we found no code segments, check the entire message
  if (segments.length === 0 || segments.every(s => s.type === 'text')) {
    return []; // Return empty to signal no transformation needed
  }

  return segments;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Process message HTML content: detect code/JSON blocks and apply syntax highlighting.
 * Returns the original HTML unchanged if no code blocks are detected.
 */
export function highlightCodeBlocks(html: string): string {
  if (!html || html.length < 10) return html;

  const segments = segmentContent(html);
  if (segments.length === 0) return html;

  return segments
    .map(seg => {
      if (seg.type === 'code') {
        const lang = seg.language || 'plaintext';
        let highlighted: string;
        try {
          if (lang !== 'plaintext' && hljs.getLanguage(lang)) {
            highlighted = hljs.highlight(seg.content, { language: lang }).value;
          } else {
            highlighted = escapeHtml(seg.content);
          }
        } catch {
          highlighted = escapeHtml(seg.content);
        }
        const lineCount = seg.content.split('\n').length;
        const pre = `<pre class="code-block"><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        if (lineCount >= 4) {
          const langLabel = lang === 'plaintext' ? 'Code' : lang.toUpperCase();
          return `<details class="code-collapsible"><summary class="code-summary">${langLabel} — ${lineCount} lines</summary>${pre}</details>`;
        }
        return pre;
      } else {
        // Preserve line breaks in text segments
        return seg.content
          .split('\n')
          .map(line => `<p>${escapeHtml(line)}</p>`)
          .join('');
      }
    })
    .join('');
}
