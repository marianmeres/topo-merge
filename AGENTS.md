# Agent Instructions for @marianmeres/topo-merge

## Package Overview

- **Name**: `@marianmeres/topo-merge`
- **Purpose**: Multiple inheritance for POJOs via topological sort and deep merge
- **Runtime**: Deno (primary), Node.js (via npm distribution)
- **Language**: TypeScript
- **License**: MIT

## Architecture

```
src/
├── mod.ts           # Entry point, re-exports from topo-merge.ts
├── topo-merge.ts    # Core implementation (topoSort, topoMerge, interfaces)
└── _utils.ts        # Internal helpers (_extends_to_parents, _record_to_id_prop)

tests/
└── topo-merge.test.ts  # Test suite (Deno.test)

scripts/
└── build-npm.ts     # NPM build script using @marianmeres/npmbuild
```

## Public API

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `topoMerge` | `(recordOrEntries, mergeOptions?, mergeOmitIdProp?) => Record<string, Record<string, any>>` | Resolves inheritance and deep merges objects |
| `topoSort` | `(nodes: InheritedNode[]) => InheritedNode[]` | Topological sort utility (low-level) |

### Interfaces

| Interface | Purpose |
|-----------|---------|
| `WithExtends` | Base interface with optional `__extends?: string \| string[]` |
| `InheritedNode` | Node with `id: string` and `__parents?: InheritedNode[]` |
| `Extended` | Internal: `WithExtends` + `id: string` |

### Re-exports

- `DeepMergeOptions` from `@std/collections`

## Key Implementation Details

1. **Inheritance resolution**: Uses DFS-based topological sort
2. **Merge strategy**: `deepMerge` from `@std/collections`
3. **Default array behavior**: Replace (not concatenate)
4. **Cycle detection**: Throws on circular dependencies
5. **Self-reference detection**: Throws if node extends itself

## Dependencies

- `@std/collections` (deepMerge, omit)

## Commands

```sh
deno task test          # Run tests
deno task test:watch    # Run tests in watch mode
deno task npm:build     # Build npm distribution
deno task publish       # Publish to JSR and npm
```

## Error Messages

| Error Pattern | Cause |
|---------------|-------|
| `"Graph has a cycle..."` | Circular dependency |
| `"Cannot extend self..."` | Self-reference in `__extends` |
| `"Node \"X\" not found"` | Missing parent reference |
| `"...already contains id prop..."` | ID mismatch between key and value |

## Testing

- Framework: Deno.test with @std/assert
- Location: `tests/topo-merge.test.ts`
- Coverage: topoSort, topoMerge, error cases, edge cases

## Code Style

- Tabs for indentation
- Line width: 90
- Indent width: 4
- Internal functions prefixed with `_`
