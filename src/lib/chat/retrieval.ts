// Knowledge-base retrieval.
//
// The ONLY context the chatbot may use is the curated markdown under
// knowledge-base/projects/. Files are bundled at build time via
// import.meta.glob (?raw) — no runtime fs access, works on any adapter.
// Raw repo files are never fed to the model.

const docModules = import.meta.glob('/knowledge-base/projects/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface KbDoc {
  slug: string;
  text: string;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did',
  'what', 'who', 'how', 'why', 'when', 'where', 'which', 'with', 'to', 'of', 'in',
  'on', 'for', 'and', 'or', 'at', 'by', 'it', 'its', 'this', 'that', 'you', 'your',
  'i', 'me', 'my', 'we', 'our', 'about', 'tell', 'know', 'built', 'made', 'make',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export function loadKbDocs(): KbDoc[] {
  return Object.entries(docModules).map(([path, text]) => ({
    slug: path.split('/').pop()?.replace(/\.md$/, '') ?? path,
    text: String(text),
  }));
}

const docs: KbDoc[] = loadKbDocs();

/**
 * Simple keyword-overlap scoring; returns the top `k` docs for a query.
 * The KB is intentionally small, so this is sufficient and fully deterministic.
 */
export function retrieve(query: string, k = 3): KbDoc[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return docs.slice(0, k);
  const scored = docs.map((doc) => {
    const docTokens = tokenize(doc.text);
    let score = 0;
    for (const t of docTokens) {
      if (queryTokens.has(t)) score += 1;
    }
    // Slight boost for title/slug match.
    const slugTokens = tokenize(doc.slug.replace(/-/g, ' '));
    for (const t of slugTokens) {
      if (queryTokens.has(t)) score += 2;
    }
    return { doc, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score > 0)
    .slice(0, k)
    .map((s) => s.doc);
}

export function buildContext(query: string, k = 3): string {
  const selected = retrieve(query, k);
  if (selected.length === 0) selected.push(...docs.slice(0, 1));
  return selected
    .map((d) => `--- ${d.slug} ---\n${d.text.trim()}`)
    .join('\n\n');
}
