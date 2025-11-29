import { omit, deepMerge, type DeepMergeOptions } from "@std/collections";
import { _extends_to_parents, _record_to_id_prop } from "./_utils.ts";

/**
 *
 */
export interface WithExtends extends Record<string, any> {
	__extends?: string | string[];
}

/**
 *
 */
export interface Extended extends WithExtends {
	id: string;
}

/**
 * Node type required for `topoSort`
 */
export interface InheritedNode extends Record<string, any> {
	id: string;
	__parents?: InheritedNode[];
}

/**
 * Will topologically sort the provided nodes based on their dependency hierarchy.
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
 * Main API - will topologically sort dependencies and recursively deep merge (self last).
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
