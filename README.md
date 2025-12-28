# @marianmeres/topo-merge

[![JSR](https://jsr.io/badges/@marianmeres/topo-merge)](https://jsr.io/@marianmeres/topo-merge)
[![npm](https://img.shields.io/npm/v/@marianmeres/topo-merge)](https://www.npmjs.com/package/@marianmeres/topo-merge)
[![license](https://img.shields.io/github/license/marianmeres/topo-merge)](https://github.com/marianmeres/topo-merge/blob/master/LICENSE)

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

- `schema` - Object or entries array where keys become node IDs
- `mergeOptions` - Options for [`deepMerge`](https://jsr.io/@std/collections/doc/~/deepMerge). Default: `{ arrays: "replace" }`
- `mergeOmitIdProp` - Whether to exclude the `id` property from results. Default: `true`

### `topoSort(nodes)`

Lower-level utility for topological sorting. Most users should use `topoMerge` instead.

## Merge Behavior

- **Child overrides parent** - Properties defined on a node override inherited ones
- **Arrays are replaced** - By default, arrays replace rather than concatenate (configurable via `mergeOptions.arrays`)
- **Deep merge** - Nested objects are recursively merged
- **Explicit `undefined`** - Set a property to `undefined` to remove an inherited value

## Full API Documentation

See [API.md](./API.md) for complete API reference including all interfaces, error handling, and detailed examples.
