import { omit, deepMerge, type DeepMergeOptions } from "@std/collections";
import { _extends_to_parents, _record_to_id_prop } from "./_utils.ts";

/**
 * Base interface for objects that can declare inheritance via `__extends`.
 *
 * @example
 * ```ts
 * const schema: Record<string, WithExtends> = {
 *   base: { foo: 1 },
 *   child: { __extends: "base", bar: 2 },
 *   multi: { __extends: ["base", "child"], baz: 3 }
 * };
 * ```
 */
export interface WithExtends extends Record<string, any> {
	/** Parent node ID(s) to inherit from. Can be a single string or array of strings. */
	__extends?: string | string[];
}

/**
 * Internal interface representing a node with an assigned `id` property.
 * Used during the transformation pipeline.
 */
export interface Extended extends WithExtends {
	/** Unique identifier for this node (derived from the schema's object key). */
	id: string;
}

/**
 * Node structure used by `topoSort`. Contains resolved parent references.
 */
export interface InheritedNode extends Record<string, any> {
	/** Unique identifier for this node. */
	id: string;
	/** Resolved parent node references (populated from `__extends`). */
	__parents?: InheritedNode[];
}

/**
 * Topologically sorts nodes based on their `__parents` dependency hierarchy.
 *
 * Uses depth-first search to order nodes so that parents appear before children.
 * This is a lower-level utility; most users should use `topoMerge` instead.
 *
 * @param nodes - Array of nodes with `id` and optional `__parents` references.
 * @returns Sorted array where parent nodes precede their dependents.
 * @throws {Error} If a circular dependency is detected.
 *
 * @example
 * ```ts
 * const parent = { id: "a" };
 * const child = { id: "b", __parents: [parent] };
 * topoSort([child, parent]); // Returns [parent, child]
 * ```
 */
export function topoSort(nodes: InheritedNode[]): InheritedNode[] {
	const result: InheritedNode[] = [];
	const seen = new Set<InheritedNode>();
	const tmp = new Set<InheritedNode>(); // For cycle detection
	const parentsLookup = new Map<InheritedNode, InheritedNode[]>();

	function visit(node: InheritedNode) {
		// If node is in tmp, we have a cycle (a.k.a. "diamond shape")
		if (tmp.has(node)) {
			throw new Error("Graph has a cycle, cannot perform topological sort");
		}

		// If we've already processed this node, skip
		if (seen.has(node)) {
			return;
		}

		// Mark node as temporarily visited
		tmp.add(node);

		// Visit all parents first
		const parents = parentsLookup.get(node);
		for (const parent of parents || []) {
			visit(parent);
		}

		// Mark as fully visited and add to result
		tmp.delete(node);
		seen.add(node);
		result.push(node);
	}

	// First, collect parents
	nodes.forEach((node) => parentsLookup.set(node, [...(node.__parents || [])]));

	// Visit all nodes
	for (const node of nodes) {
		if (!seen.has(node)) visit(node);
	}

	return result;
}

/**
 * Merges objects with multiple inheritance support via `__extends`.
 *
 * Resolves inheritance hierarchy using topological sorting, then deep merges
 * each node with its parents. Child properties override parent properties.
 *
 * @param recordOrEntries - Schema object or entries array. Keys become node IDs.
 * @param mergeOptions - Options passed to `deepMerge` from `@std/collections`.
 *   Defaults to `{ arrays: "replace" }` (arrays are replaced, not concatenated).
 * @param mergeOmitIdProp - Whether to omit the `id` property from results. Default: `true`.
 * @returns Record of fully merged objects keyed by their original IDs.
 * @throws {Error} If circular dependency, self-reference, or missing parent is detected.
 *
 * @example
 * ```ts
 * const result = topoMerge({
 *   base: { foo: 1, bar: 2 },
 *   child: { __extends: "base", bar: 3, baz: 4 }
 * });
 * // result.base  → { foo: 1, bar: 2 }
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
 *
 * @example Clearing inherited properties with explicit `undefined`
 * ```ts
 * const result = topoMerge({
 *   base: { foo: 1, bar: 2 },
 *   child: { __extends: "base", foo: undefined }
 * });
 * // result.child → { bar: 2 } (foo is removed)
 * ```
 */
export function topoMerge(
	recordOrEntries: Record<string, WithExtends> | [string, WithExtends][],
	mergeOptions?: DeepMergeOptions,
	mergeOmitIdProp = true
): Record<string, Record<string, any>> {
	const record = Array.isArray(recordOrEntries)
		? Object.fromEntries(recordOrEntries)
		: recordOrEntries;
	const sorted = topoSort(_extends_to_parents(_record_to_id_prop(record)));
	const result: Record<string, Record<string, any>> = {};
	const omitKeys = ["__parents", mergeOmitIdProp ? "id" : ""].filter(Boolean);

	// Arrays are replaced by default (not merged)
	mergeOptions ??= {};
	mergeOptions.arrays ??= "replace";

	function process(node: InheritedNode) {
		result[node.id] ??= deepMerge(
			omit(node, omitKeys),
			result[node.id] || {},
			mergeOptions
		);

		node.__parents?.forEach((parent) => {
			result[node.id] = deepMerge(
				omit(parent, omitKeys),
				deepMerge(result[parent.id] || {}, result[node.id], {
					// Always need to replace in this "inner" merge
					arrays: "replace",
					sets: "replace",
					maps: "replace",
				}),
				mergeOptions
			);
			process(parent);
		});
	}

	sorted.forEach((node) => process(node));

	return result;
}
