import type { Extended, InheritedNode, WithExtends } from "./topo-merge.ts";

/** Internal helper - will convert the Entended[] to Inherited[], so it's suitable for topo-sorting. */
export function _extends_to_parents(nodes: Extended[]): InheritedNode[] {
	const lookup = new Map<string, Extended>();
	const seen = new Set<InheritedNode>();
	const result = new Set<InheritedNode>();

	function process(node: Extended, _depth = 0) {
		if (seen.has(node)) {
			return node;
		}

		const parents = new Set<InheritedNode>();

		// normalize
		const __extends = (
			typeof node.__extends === "string"
				? [node.__extends]
				: node.__extends || []
		).filter(Boolean);

		__extends.forEach((id) => {
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
