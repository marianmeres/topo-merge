# @marianmeres/topo-merge

Multiple inheritance for POJOs via topological sort and deep merge.

## Installation

```sh
deno add jsr:@marianmeres/topo-merge
```

```sh
npm i @marianmeres/topo-merge
```

## Quick Example

```js
import { topoMerge } from "@marianmeres/topo-merge";

const result = topoMerge({
    a: { foo: "bar" },
    b: { __extends: "a", baz: "bat" },
    c: { __extends: "b", hey: "ho" },
    d: { __extends: "c", lets: "go", foo: "foo" },
    e: { __extends: ["b", "c"] }, // multiple inheritance
});

// Result:
// a: { foo: "bar" }
// b: { foo: "bar", baz: "bat" }
// c: { foo: "bar", baz: "bat", hey: "ho" }
// d: { foo: "foo", baz: "bat", hey: "ho", lets: "go" }
// e: { foo: "bar", baz: "bat", hey: "ho" }
```

## API

### `topoMerge(schema, mergeOptions?, mergeOmitIdProp?)`

Main function that resolves inheritance and merges objects.

```ts
function topoMerge(
    schema: Record<string, WithExtends> | [string, WithExtends][],
    mergeOptions?: DeepMergeOptions,
    mergeOmitIdProp?: boolean // default: true
): Record<string, Record<string, any>>
```

**Parameters:**

- `schema` - Object or entries array where keys become node IDs. Each value can have an optional `__extends` property (string or string array) referencing parent IDs.
- `mergeOptions` - Options for [`deepMerge`](https://jsr.io/@std/collections/doc/~/deepMerge). Default: `{ arrays: "replace" }`.
- `mergeOmitIdProp` - Whether to exclude the `id` property from results. Default: `true`.

**Throws:**

- Circular dependency detected
- Self-reference (`__extends` pointing to itself)
- Missing parent reference

### `topoSort(nodes)`

Lower-level utility for topological sorting. Most users should use `topoMerge` instead.

```ts
function topoSort(nodes: InheritedNode[]): InheritedNode[]
```

## Merge Behavior

- **Child overrides parent** - Properties defined on a node override inherited ones
- **Arrays are replaced** - By default, arrays replace rather than concatenate (configurable via `mergeOptions.arrays`)
- **Deep merge** - Nested objects are recursively merged
- **Explicit `undefined`** - Set a property to `undefined` to remove an inherited value:

```js
const result = topoMerge({
    base: { foo: 1, bar: 2 },
    child: { __extends: "base", foo: undefined }
});
// child: { bar: 2 }  (foo is removed)
```

## Types

```ts
interface WithExtends extends Record<string, any> {
    __extends?: string | string[];
}

interface InheritedNode extends Record<string, any> {
    id: string;
    __parents?: InheritedNode[];
}
```
