import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parse } from 'yaml';
import { MemoryStore } from '../src/index.js';

function setup(t: { after: (fn: () => void) => void }) {
  const vault = mkdtempSync(path.join(tmpdir(), 'recallvault-aliases-'));
  const store = new MemoryStore(vault);
  t.after(() => {
    store.close();
    rmSync(vault, { recursive: true, force: true });
  });
  const memory = store.remember({
    project: 'alpha',
    title: 'Classificador passou no teste',
    content: 'The classifier passed the end-to-end test.',
    kind: 'fact',
    sources: [{ reference: 'session:aliases' }],
  }).memory;
  const file = path.join(vault, memory.path);
  const frontmatter = () => parse(/^---\n([\s\S]*?)\n---/.exec(readFileSync(file, 'utf8'))![1]!);
  return { store, memory, file, frontmatter };
}

test('notes keep UUID filenames and expose the title as an Obsidian alias', (t) => {
  const { memory, file, frontmatter } = setup(t);
  assert.equal(path.basename(file), `${memory.id}.md`);
  assert.deepEqual(frontmatter().aliases, ['Classificador passou no teste']);
});

test('aliases are not part of memory metadata returned to agents', (t) => {
  const { store, memory } = setup(t);
  assert.equal('aliases' in store.get(memory.id, 'alpha'), false);
});

test('legacy notes without aliases still load and gain an alias on the next write', (t) => {
  const { store, memory, file, frontmatter } = setup(t);
  writeFileSync(file, readFileSync(file, 'utf8').replace(/^aliases:\n(?:  - .*\n)+/m, ''));
  assert.equal(frontmatter().aliases, undefined);
  assert.equal(store.get(memory.id, 'alpha').title, memory.title);
  store.addSources(memory.id, 'alpha', [{ reference: 'session:later' }]);
  assert.deepEqual(frontmatter().aliases, [memory.title]);
});

test('a stale or single-string alias is ignored on read and regenerated from the title', (t) => {
  const { store, memory, file, frontmatter } = setup(t);
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace(/^aliases:\n(?:  - .*\n)+/m, 'aliases: Old title\n'),
  );
  assert.equal(store.get(memory.id, 'alpha').title, memory.title);
  store.addSources(memory.id, 'alpha', [{ reference: 'session:later' }]);
  assert.deepEqual(frontmatter().aliases, [memory.title]);
});

test('malformed aliases make the note invalid instead of being silently dropped', (t) => {
  const { store, memory, file } = setup(t);
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace(/^aliases:\n(?:  - .*\n)+/m, 'aliases:\n  nested: true\n'),
  );
  assert.throws(() => store.get(memory.id, 'alpha'), /Invalid memory/);
});
