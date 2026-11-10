# Changelog

## Unreleased

### Readable titles in Obsidian

- Managed notes now carry an Obsidian `aliases` property generated from the title, so notes can be found by title while filenames stay UUIDs. The property is regenerated on every write and ignored on read; notes without it remain valid. Versions before this change reject notes that contain `aliases`, so update every machine that writes to a shared vault.

### v0.2 — typed memory graph and UNO Q host recipe

- Explicit per-memory relations: supports, contradicts, depends_on and related_to, with rationale and project restrictions; scoped add/remove operations.
- Machine-readable graph queries, centered neighborhood traversal, graph-context packs and Mermaid output via CLI/MCP.
- Generated `[[UUID]]` links in managed note Markdown for Obsidian Graph View; generated text excluded from retrieved memory content.
- Graph regression tests, updated CI including Linux ARM64 and documentation for Codex over private SSH/Tailscale to an Arduino UNO Q.
- Arduino install helper and configuration examples. The deployment instructions are not a claim that the hardware has already been provisioned or benchmarked.

### Earlier MVP work

- Reviewed capture and batch ingestion with hypothesis confirmation and source enrichment.
- Kind/tag filters, any/all matching, prefixes, source indexing, matched terms, and relevant Unicode-safe excerpts.
- Incremental SQLite reconciliation, automatic cache migration, context packs, project digests, browsing, statistics, and lineage inspection.
- Portable JSONL transfer, vault diagnostics, and conservative stale-lock recovery.
- Expanded CLI and MCP tools with project scoping, read-only discovery, and bounded protocol results.
- Regression tests, test typechecking, a synthetic retrieval evaluation, and local performance benchmark.

The engine remains local and lexical. No provider key or model call is required. Model-based extraction, embeddings, and an Obsidian UI plugin remain future work.
