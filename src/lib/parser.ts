import type { Conversation, Message } from '../types';

export function parseFilename(filename: string): {
  title: string;
  participants: string[];
  date: string;
  id: string;
} {
  const base = filename.replace(/\.html$/i, '');
  const parts = base.split('-');

  const archivedIdx = parts.lastIndexOf('ArchivedChat');
  if (archivedIdx === -1) {
    return { title: base, participants: [], date: '', id: base };
  }

  const id = parts[archivedIdx - 1] || base;

  // Date is YYYY-MM-DD spanning 3 parts before the numeric ID
  const dateStr = parts.slice(archivedIdx - 4, archivedIdx - 1).join('-');

  // Everything before the date
  const remaining = parts.slice(0, archivedIdx - 4).join('-');
  const segments = remaining.split('-');

  // Find where participants start: "LastName, FirstName" pattern
  let titleEnd = segments.length;
  for (let i = 0; i < segments.length; i++) {
    const joined = segments.slice(i).join('-');
    if (/^[A-Z][a-z]+,\s/.test(joined)) {
      titleEnd = i;
      break;
    }
  }

  const title = segments.slice(0, titleEnd).join(' - ').trim() || 'Untitled Chat';
  const participantStr = segments.slice(titleEnd).join('-').trim();

  const participants: string[] = [];
  if (participantStr) {
    const matches = participantStr.match(/[A-Z][a-zA-Z' ]*,\s*[A-Z][a-zA-Z' ]*/g);
    if (matches) {
      participants.push(
        ...matches.map(p => {
          const [last, first] = p.split(',').map(s => s.trim());
          return `${first} ${last}`;
        })
      );
    }
  }

  return { title, participants, date: dateStr, id };
}

function parseDate(dateStr: string): string {
  const cleaned = dateStr.trim();
  const match = cleaned.match(
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})\s*\(UTC\)/
  );
  if (!match) return cleaned;
  const [, month, day, year, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
}

export function parseHTML(html: string, filename: string): Conversation {
  const { title, participants, date, id } = parseFilename(filename);

  // Pre-process custom/non-standard tags before DOM parsing
  // Browser DOMParser may not handle custom elements consistently
  const processedHtml = html
    // Replace <emoji> tags with their unicode alt text
    .replace(/<emoji[^>]*alt="([^"]*)"[^>]*><\/emoji>/gi, '$1')
    .replace(/<emoji[^>]*\/>/gi, '')
    // Replace <at> tags (Teams @mentions) with styled spans
    .replace(/<at[^>]*>(.*?)<\/at>/gi, '<span class="mention">@$1</span>');

  const parser = new DOMParser();
  const doc = parser.parseFromString(processedHtml, 'text/html');
  const posts = doc.querySelectorAll('.post');

  const senderSet = new Set<string>(participants);
  const messages: Message[] = [];

  posts.forEach(post => {
    const main = post.querySelector('.main');
    if (!main) return;

    const fromEl = main.querySelector('.pFrom');
    const dateEl = main.querySelector('.pDate');

    const sender = fromEl?.textContent?.trim() || 'Unknown';
    const timestamp = dateEl ? parseDate(dateEl.textContent || '') : '';
    senderSet.add(sender);

    // Extract links
    const links: string[] = [];
    main.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href) links.push(href);
    });

    // Build content: clone, remove metadata, handle special elements
    const clone = main.cloneNode(true) as HTMLElement;
    const firstP = clone.querySelector('p');
    if (
      firstP &&
      (firstP.querySelector('.pFrom') || firstP.querySelector('.pDate'))
    ) {
      firstP.remove();
    }

    // Remove only placeholder images (BinaryTree icons used for link previews)
    // Keep inline/base64 images and other meaningful images
    clone.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src.includes('binarytree.com') || src.includes('help.binarytree.com')) {
        img.remove();
      }
    });

    let content = clone.innerHTML
      .replace(/<p>\s*<\/p>/g, '')
      .trim();

    if (!content) {
      const textClone = main.cloneNode(true) as HTMLElement;
      textClone.querySelectorAll('.pFrom, .pDate').forEach(el => el.remove());
      textClone.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        if (src.includes('binarytree.com')) img.remove();
      });
      content = textClone.innerHTML.trim();
    }

    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/^<p>\s*(.*?)\s*<\/p>$/s, '$1')
      .trim();

    messages.push({ sender, timestamp, content, links });
  });

  return {
    id,
    title,
    participants: Array.from(senderSet),
    date,
    messages,
    importedAt: Date.now(),
  };
}
