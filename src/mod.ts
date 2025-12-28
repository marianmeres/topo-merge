/**
 * @module topo-merge
 *
 * Multiple inheritance for POJOs via topological sort and deep merge.
 *
 * This module provides utilities for implementing schema-based inheritance in plain
 * JavaScript objects. Objects can declare parents via `__extends` and will inherit
 * properties through deep merging, with child properties overriding parents.
 *
 * @example Basic usage
 * ```ts
 * import { topoMerge } from "@marianmeres/topo-merge";
 *
 * const result = topoMerge({
 *   base: { foo: 1, bar: 2 },
 *   child: { __extends: "base", bar: 3, baz: 4 }
 * });
 * // result.child → { foo: 1, bar: 3, baz: 4 }
 * ```
 *
 * @example Multiple inheritance
 * ```ts
 * const result = topoMerge({
 *   a: { x: 1 },
 *   b: { y: 2 },
 *   c: { __extends: ["a", "b"], z: 3 }
 * });
 * // result.c → { x: 1, y: 2, z: 3 }
 * ```
 */
export * from "./topo-merge.ts";
