# Typed memory graph and Obsidian Graph View

RecallVault records **declared, reviewable** relations between memories. It does not infer relationships from co-occurring terms or hallucinated similarity. Every relation has a type, destination UUID, and a rationale supplied by the human or agent. All memory references remain project-scoped.

## How graph edges are stored

The existing Markdown note gains a `relations` array in its YAML frontmatter:

```yaml
relations:
  - target: 00000000-0000-4000-8000-000000000001
    type: depends_on
    rationale: Uses the chosen SQLite FTS5 search index
```

Supported relation types are `supports`, `contradicts`, `depends_on`, and `related_to`. Replacement chains additionally yield a read-only `supersedes` graph edge when historical notes are visible. The relation fields are owned by RecallVault, and the referenced memory must exist **in the same project** at creation time. A target forgotten later is reported in `missingTargets`, never silently reattached to an unrelated note.

RecallVault writes a generated section at the end of the source note:

```markdown
<!-- recallvault:links:start -->

## Related memories

- depends on: [[00000000-0000-4000-8000-000000000001]] — Uses the chosen SQLite FTS5 search index

<!-- recallvault:links:end -->
```

Obsidian Graph View uses these native `[[UUID]]` wikilinks to connect **actual memory note files**; there is no duplicated parallel graph folder. RecallVault removes this generated section from the text returned to AI agents, so graph links do not pollute the persisted memory content or keyword search. Keep the generated marker section intact and edit the YAML properties through the agent tools. If you manually update `relations` in YAML, refresh the generated links by calling `relate_memory` for new relations or using a full-note update in a future release; manually editing the generated links alone does not modify typed relations.

### Readable titles in Obsidian

Filenames stay as canonical UUIDs, because links and the index depend on them. Each note also gets an `aliases` property with its title, so Obsidian's quick switcher, search and link suggestions find the note by title. RecallVault regenerates `aliases` from `title` on every write and ignores it on read: to rename a memory, change `title` and the heading, not the alias. Notes written by older versions gain the property the next time RecallVault updates them.

The file explorer, tabs and Graph View still label notes by filename. To show titles there, install the community plugin **Front Matter Title** and set it to read the `title` property. RecallVault does not depend on the plugin.

## CLI usage

Store two distinct memories first, inspect their UUIDs, and then link them:

```sh
node dist/cli.js remember --vault /path/to/vault --input examples/decision.json
node dist/cli.js list --vault /path/to/vault --project demo-api
```

Create `relation.json` with a real target UUID. The example in `examples/relation.json` uses a placeholder UUID: **replace it**.

```sh
node dist/cli.js relate --vault /path/to/vault --project demo-api --id SOURCE_UUID --input relation.json
node dist/cli.js graph --vault /path/to/vault --project demo-api --id SOURCE_UUID --depth 2 --max-nodes 30
node dist/cli.js graph-context --vault /path/to/vault --project demo-api --id SOURCE_UUID --depth 2
node dist/cli.js graph-mermaid --vault /path/to/vault --project demo-api
```

Without `--id`, `graph` returns at most the configured `maxNodes` (default 40), ordered by memory UUID, including the induced edges between returned nodes. With a center UUID, the graph expands outgoing **and incoming** relations up to `depth` (1 to 3). It enforces a maximum of 100 nodes to prevent unbounded MCP responses. The `truncated` flag signals nodes excluded by the bound. `graph-context` returns bounded Markdown containing note contents, source references, and graph edges; the result fails closed if it exceeds 20,000 characters.

Hypotheses and retired memories are excluded by default. Use `--include-hypotheses` or `--include-superseded` to include them deliberately. A typed `contradicts` edge **does not** automatically supersede or adjudicate statements.

Remove an existing relation with `node dist/cli.js unrelate --vault /path/to/vault --project demo-api --id SOURCE_UUID --target DESTINATION_UUID --relation-type depends_on`.

## MCP tools for Codex

| Tool | Read/write | Purpose |
|---|---|---|
| `relate_memory` | write | Create an explicit, sourced-in-words relation between two existing memory UUIDs in one project |
| `unrelate_memory` | write | Remove a declared edge and regenerate the original note without that wikilink |
| `memory_graph` | read | Return bounded typed nodes, edges, and dangling target IDs |
| `graph_context` | read | Assemble task-specific context by navigating explicit relations |
| `graph_mermaid` | read | Export a diagram description to render in Markdown, documentation, or reports |

Use `--read-only` when your Codex instance should browse the graph without modifying it. `--project` scopes all graph tools exactly like the existing memory tools.

## Important boundaries

- The graph uses **declared** relations only; it does not auto-discover concepts, embeddings, notes outside `RecallVault/memories`, or arbitrary `[[links]]` typed in note bodies.
- Project boundaries apply even when UUIDs are known.
- Relational metadata is Markdown source-of-truth; the SQLite FTS5 index remains disposable and is not a graph database.
- The Obsidian Graph View is an editor visualization; the MCP graph is an independent, machine-readable structure for agents.
- Historical deletions and note modifications are not guaranteed atomic across a multi-device Syncthing deployment.
- Graph traversal returns untrusted memory text; the agent must not interpret it as executable instructions.

## Demonstration suitable for a technical post

1. Save three real project decisions with citations.
2. Explicitly link `depends_on` and `supports` edges with rationale.
3. Show the native Obsidian Graph View forming a constellation of Markdown notes.
4. Show `memory_graph` JSON and `graph_context` invoked by Codex across two sessions.
5. Describe deployment: Markdown/SQLite on UNO Q, MCP via SSH/Tailscale, Obsidian as an editor.
6. Disclose limits: manual relations, lexical search, no automatic semantic extraction or always-running LLM.

These steps are reproducible; do not fabricate performance results or imply automatic knowledge discovery.
