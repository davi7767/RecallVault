import { parse, stringify } from 'yaml';
import { z } from 'zod';
import { metadataSchema, VaultError, type Memory, type Metadata } from './schema.js';

const GRAPH_START = '<!-- recallvault:links:start -->';
const GRAPH_END = '<!-- recallvault:links:end -->';

// Obsidian accepts one alias as a string or several as a list.
const obsidianAliasesSchema = z.union([z.string(), z.array(z.string()).max(50)]);

// Obsidian uses `aliases` to find a note by its title in search and link suggestions,
// even though the filename is a UUID. RecallVault regenerates it from the title on every
// write and ignores it on read, so a stale alias can never override the real title.
function withoutObsidianAliases(frontmatter: unknown): unknown {
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) return frontmatter;
  if (!('aliases' in frontmatter)) return frontmatter;
  const { aliases, ...rest } = frontmatter as Record<string, unknown>;
  obsidianAliasesSchema.parse(aliases);
  return rest;
}

export function serializeMemory(meta: Metadata, content: string): string {
  const links = meta.relations.length === 0
    ? ''
    : `\n\n${GRAPH_START}\n\n## Related memories\n\n${meta.relations
        .map((r) => `- ${r.type.replaceAll('_', ' ')}: [[${r.target}]] — ${r.rationale.replace(/[\r\n\[\]<>|]/g, ' ')}`)
        .join('\n')}\n\n${GRAPH_END}`;
  const frontmatter = { ...meta, aliases: [meta.title] };
  return `---\n${stringify(frontmatter, { lineWidth: 0 })}---\n\n# ${meta.title}\n\n${content.trim()}${links}\n`;
}

export function parseMemory(raw: string, relativePath: string): Memory {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  if (!match) throw new VaultError('INVALID_NOTE', `Missing YAML frontmatter: ${relativePath}`);
  try {
    const meta = metadataSchema.parse(withoutObsidianAliases(parse(match[1]!, { maxAliasCount: 0 })));
    let body = match[2]!.trim();
    const lines = body.split(/\r?\n/);
    if (lines[0]?.startsWith('# ')) {
      if (lines[0].slice(2) !== meta.title)
        throw new Error('Heading and title differ; update both');
      body = lines.slice(1).join('\n').trim();
    }
    const graphBlock = new RegExp(`\\n\\n${GRAPH_START}[\\s\\S]*?${GRAPH_END}$`);
    body = body.replace(graphBlock, '').trim();
    if (!body || body.length > 20000) throw new Error('Content must contain 1 to 20000 characters');
    return { ...meta, content: body, path: relativePath };
  } catch (error) {
    throw new VaultError(
      'INVALID_NOTE',
      `Invalid memory ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
