// deno-lint-ignore-file no-explicit-any

import { omit } from "@std/collections";
import { deepMerge, type DeepMergeOptions } from "@std/collections/deep-merge";

export interface WithExtends extends Record<string, any> {
	__extends?: string[];
}

export interface Extended extends WithExtends {
	id: string;
}

export interface InheritedNode extends Record<string, any> {
	id: string;
	__parents?: InheritedNode[];
}

/**
 * Will topologically sort the provided nodes based on their inheritance (dependency) hierarchy.
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
 * Main API - will topologically sort dependencies and recursively merge (self last).
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

	// arrays are replaced by default (not merged)
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
					// always need to replace in this "inner" merge
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

/** Internal helper - will convert the Entended[] to Inherited[], so it's suitable for topo-sorting. */
export function _extends_to_parents(nodes: Extended[]): InheritedNode[] {
	const lookup = new Map<string, Extended>();
	const seen = new Set<InheritedNode>();
	const result = new Set<InheritedNode>();

	function process(node: Extended, _depth = 0) {
		// console.log("    ".repeat(_depth), "processing", node.id, "extends", node.extends);

		if (seen.has(node)) {
			return node;
		}

		const parents = new Set<InheritedNode>();
		(node.__extends || []).forEach((id) => {
			if (node.id === id) throw new Error(`Cannot extend self ("${id}")`);
			if (!lookup.has(id)) throw new Error(`Node "${id}" not found`);
			parents.add(process(lookup.get(id)!, _depth + 1));
		});

		node.__parents = [...parents];
		delete node.__extends;

		seen.add(node);
		return node;
	}

	// Create a flat lookup table first
	nodes.forEach((node) => lookup.set(node.id, node));

	// Process all nodes
	nodes.forEach((node) => result.add(process(node)));

	return [...result];
}

/** Internal helper - will just convert top level object keys as `id` prop of it's value */
export function _record_to_id_prop(
	obj: Record<string, WithExtends>
): InheritedNode[] {
	const entries = Object.entries(obj).reduce((m, [id, v]) => {
		if (v.id && v.id !== id) {
			throw new Error(
				`Record's value already contains id prop "${v.id}" which is different from "${id}"`
			);
		}
		m.push({ id, ...v });
		return m;
	}, [] as InheritedNode[]);

	return entries;
}
