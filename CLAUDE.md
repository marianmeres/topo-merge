# CLAUDE.md

This file provides context for Claude Code when working with this repository.

## What is this?

`@marianmeres/topo-merge` is a TypeScript library for implementing multiple inheritance in plain JavaScript objects (POJOs). It uses topological sorting to resolve inheritance order and deep merging to combine properties.

## Core Concept

Objects declare parents via `__extends` property. The library resolves the inheritance DAG, sorts dependencies, and merges properties so children override parents.

```ts
topoMerge({
  base: { a: 1 },
  child: { __extends: "base", b: 2 }
});
// → { base: { a: 1 }, child: { a: 1, b: 2 } }
```

## File Structure

- `src/mod.ts` - Entry point
- `src/topo-merge.ts` - Core logic (topoSort, topoMerge)
- `src/_utils.ts` - Internal helpers
- `tests/topo-merge.test.ts` - Test suite

## Quick Commands

```sh
deno task test       # Run tests
deno task publish    # Publish to JSR + npm
```

## Key Points

- Arrays replaced by default (use `{ arrays: "merge" }` to concatenate)
- Explicit `undefined` removes inherited property
- Circular dependencies throw errors
- `topoSort` is low-level; use `topoMerge` for most cases
