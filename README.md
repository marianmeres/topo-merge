# @marianmeres/topo-merge

Mutliple inheritance for POJOs.

A tool which converts this:

```js
{
    a: { foo: "bar" },
    b: { __extends: ["a"], baz: "bat" },
    c: { __extends: ["b"], hey: "ho" },
    d: { __extends: ["c"], lets: "go", foo: "foo" },
    e: { __extends: ["b", "c"] },
}
```

into this:

```js
{
    a: { foo: "bar" },
    b: { foo: "bar", baz: "bat" },
    c: { foo: "bar", baz: "bat", hey: "ho" },
    d: { foo: "foo", baz: "bat", hey: "ho", lets: "go" },
    e: { foo: "bar", baz: "bat", hey: "ho" },
}
```

## Installation

```sh
deno add jsr:@marianmeres/topo-merge
```

```sh
npm i @marianmeres/topo-merge
```

## Usage

```js
import { topoMerge } from "@marianmeres/topo-merge";
```

```typescript
// takes one required argument "schema", which can be a Record or entries (see above)
const merged = topoMerge(
    schema: Record<string, WithExtends> | [string, WithExtends][],
    mergeOptions?: DeepMergeOptions
)
```

See [DeepMergeOptions](https://jsr.io/@std/collections@1.0.10/doc/~/DeepMergeOptions).