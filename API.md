# API Reference

Complete API documentation for `@marianmeres/topo-merge`.

## Functions

### `topoMerge`

Main function that resolves inheritance and merges objects.

```ts
function topoMerge(
    recordOrEntries: Record<string, WithExtends> | [string, WithExtends][],
    mergeOptions?: DeepMergeOptions,
    mergeOmitIdProp?: boolean
): Record<string, Record<string, any>>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `recordOrEntries` | `Record<string, WithExtends>` \| `[string, WithExtends][]` | — | Schema object or entries array. Keys become node IDs. Each value can have an optional `__extends` property referencing parent IDs. |
| `mergeOptions` | `DeepMergeOptions` | `{ arrays: "replace" }` | Options passed to `deepMerge` from `@std/collections`. Controls how arrays, sets, and maps are merged. |
| `mergeOmitIdProp` | `boolean` | `true` | Whether to omit the `id` property from merged results. |

#### Returns

`Record<string, Record<string, any>>` — Object containing all nodes with their inherited properties merged. Keys match the input schema keys.

#### Throws

- `Error` — If a circular dependency is detected in the inheritance graph.
- `Error` — If a node references itself via `__extends`.
- `Error` — If `__extends` references a non-existent node ID.
- `Error` — If a node's `id` property conflicts with its key in the schema.

#### Examples

**Basic inheritance:**

```ts
import { topoMerge } from "@marianmeres/topo-merge";

const result = topoMerge({
    base: { foo: 1, bar: 2 },
    child: { __extends: "base", bar: 3, baz: 4 }
});

// result.base  → { foo: 1, bar: 2 }
// result.child → { foo: 1, bar: 3, baz: 4 }
```

**Multiple inheritance:**

```ts
const result = topoMerge({
    a: { x: 1 },
    b: { y: 2 },
    c: { __extends: ["a", "b"], z: 3 }
});

// result.c → { x: 1, y: 2, z: 3 }
```

**Removing inherited properties with `undefined`:**

```ts
const result = topoMerge({
    base: { foo: 1, bar: 2 },
    child: { __extends: "base", foo: undefined }
});

// result.child → { bar: 2, foo: undefined }
```

**Array merging (instead of replacing):**

```ts
const result = topoMerge(
    {
        a: { items: [1, 2] },
        b: { __extends: "a", items: [3, 4] }
    },
    { arrays: "merge" }
);

// result.b.items contains [1, 2, 3, 4] (order may vary)
```

**Using entries array format:**

```ts
const result = topoMerge([
    ["base", { foo: 1 }],
    ["child", { __extends: "base", bar: 2 }]
]);

// result.child → { foo: 1, bar: 2 }
```

---

### `topoSort`

Lower-level utility that performs topological sorting on nodes based on their parent dependencies. Most users should use `topoMerge` instead.

```ts
function topoSort(nodes: InheritedNode[]): InheritedNode[]
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `nodes` | `InheritedNode[]` | Array of nodes with `id` and optional `__parents` references. |

#### Returns

`InheritedNode[]` — Sorted array where parent nodes always precede their dependents.

#### Throws

- `Error` — If the graph contains a cycle (circular dependency).

#### Example

```ts
import { topoSort } from "@marianmeres/topo-merge";

const parent = { id: "a" };
const child = { id: "b", __parents: [parent] };
const grandchild = { id: "c", __parents: [child] };

const sorted = topoSort([grandchild, parent, child]);
// Returns: [parent, child, grandchild]
// (sorted by id: ["a", "b", "c"])
```

---

## Interfaces

### `WithExtends`

Base interface for objects that can declare inheritance via `__extends`.

```ts
interface WithExtends extends Record<string, any> {
    /** Parent node ID(s) to inherit from. Can be a single string or array of strings. */
    __extends?: string | string[];
}
```

### `InheritedNode`

Node structure used by `topoSort`. Contains resolved parent references.

```ts
interface InheritedNode extends Record<string, any> {
    /** Unique identifier for this node. */
    id: string;
    /** Resolved parent node references (populated from `__extends`). */
    __parents?: InheritedNode[];
}
```

### `Extended`

Internal interface representing a node with an assigned `id` property. Used during the transformation pipeline.

```ts
interface Extended extends WithExtends {
    /** Unique identifier for this node (derived from the schema's object key). */
    id: string;
}
```

---

## Type Re-exports

### `DeepMergeOptions`

Re-exported from `@std/collections`. Controls merge behavior for arrays, sets, and maps.

```ts
interface DeepMergeOptions {
    arrays?: "replace" | "merge";
    sets?: "replace" | "merge";
    maps?: "replace" | "merge";
}
```

See [@std/collections documentation](https://jsr.io/@std/collections/doc/~/deepMerge) for details.

---

## Merge Behavior

### Property Override

Child properties always override parent properties:

```ts
topoMerge({
    parent: { a: 1, b: 2 },
    child: { __extends: "parent", b: 3 }
});
// child → { a: 1, b: 3 }
```

### Deep Merge

Nested objects are recursively merged:

```ts
topoMerge({
    parent: { config: { debug: true, port: 3000 } },
    child: { __extends: "parent", config: { port: 8080 } }
});
// child.config → { debug: true, port: 8080 }
```

### Array Handling

By default, arrays are **replaced** (not concatenated):

```ts
topoMerge({
    parent: { items: [1, 2] },
    child: { __extends: "parent", items: [3, 4] }
});
// child.items → [3, 4]
```

Use `{ arrays: "merge" }` to concatenate arrays:

```ts
topoMerge({ ... }, { arrays: "merge" });
// child.items → [1, 2, 3, 4] (order may vary)
```

### Explicit `undefined`

Set a property to `undefined` to mark it as explicitly removed from the inherited chain:

```ts
topoMerge({
    parent: { secret: "value", public: "data" },
    child: { __extends: "parent", secret: undefined }
});
// child → { public: "data", secret: undefined }
```

---

## Error Handling

The library throws descriptive errors for common issues:

| Error | Cause |
|-------|-------|
| `"Graph has a cycle, cannot perform topological sort"` | Circular dependency detected (A extends B extends A). |
| `"Cannot extend self (\"id\")"` | A node's `__extends` includes its own ID. |
| `"Node \"id\" not found"` | `__extends` references a non-existent node. |
| `"Record's value already contains id prop..."` | A node has an `id` property that differs from its key in the schema. |
