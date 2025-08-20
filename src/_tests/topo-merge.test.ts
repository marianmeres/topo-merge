import { assert, assertEquals, assertThrows } from "@std/assert";
import { topoSort, topoMerge } from "../mod.ts";
import { _extends_to_parents } from "../_utils.ts";

Deno.test("topoSort works", () => {
	const a = { id: "a" };
	const b = { id: "b", __parents: [a] };
	const c = { id: "c", __parents: [b] };
	const d = { id: "d", __parents: [c] };

	const sorted = topoSort([d, d, b, a, c, b, d, b, b, b, a, a]);

	assertEquals(sorted.map((o) => o.id).join(), "a,b,c,d");
});

Deno.test("topoSort works 2", () => {
	const a = { id: "a" };
	const b = { id: "b" };
	const c = { id: "c", __parents: [a, b] };
	const e = { id: "e", __parents: [c] };

	// "d" has no relation - must come either last or first
	// (depends on the initial position in graph)
	const d = { id: "d" };

	const sorted = topoSort([e, d, d, b, a, c, b, d, e, e, b, b, b, a, a]);
	assertEquals(sorted.map((o) => o.id).join(), "a,b,c,e,d"); // "d" is last

	const sorted2 = topoSort([d, e, c, b, a]);
	assertEquals(sorted2.map((o) => o.id).join(), "d,a,b,c,e"); // "d" is first
});

Deno.test("internal: extended to inherited", () => {
	const a = { id: "a" };
	const b = { id: "b", __extends: ["a"] };
	const c = { id: "c", __extends: ["b"] };
	const d = { id: "d", __extends: ["c"] };
	// console.log([a, b, c, d]);

	const inherited = _extends_to_parents([d, d, b, a, c, b, d, b, b, b, a, a]);
	// console.log(JSON.stringify(inherited, null, 4));
	const sorted = topoSort(inherited);

	assertEquals(sorted.map((o) => o.id).join(), "a,b,c,d");
});

Deno.test("topoMerge works", () => {
	const schema = {
		a: { foo: "bar" },
		b: { __extends: ["a"], baz: "bat" },
		c: { __extends: ["b", "a", "a"], hey: "ho" }, // multiple same id refs are ignored
		d: { __extends: ["c"], lets: "go" },
		e: { __extends: ["b", "c"] },
	};

	const merged = topoMerge(schema);
	// console.log(merged);

	assertEquals(merged, {
		a: { foo: "bar" },
		b: { foo: "bar", baz: "bat" },
		c: { foo: "bar", baz: "bat", hey: "ho" },
		d: { foo: "bar", baz: "bat", hey: "ho", lets: "go" },
		e: { foo: "bar", baz: "bat", hey: "ho" },
	});
});

Deno.test("topoMerge self prop is merged over extended", () => {
	const schema = {
		a: { foo: "bar" },
		b: { baz: "bat" },
		c: { __extends: ["b", "a"], foo: "foo" }, // self "foo" must overwrite the extended one from "a"
	};

	const merged = topoMerge(schema);

	assertEquals(merged, {
		a: { foo: "bar" },
		b: { baz: "bat" },
		c: { foo: "foo", baz: "bat" }, // foo is "foo", not "bar"
	});
});

Deno.test("topoMerge self prop explicitly undefined", () => {
	const schema = {
		a: { foo: { bar: "baz" } },
		b: { foo: { hey: "ho" } },
		c: { __extends: ["b", "a"], foo: undefined }, // "foo" must be undef in the output
	};

	const merged = topoMerge(schema);

	assertEquals(merged, {
		a: { foo: { bar: "baz" } },
		b: { foo: { hey: "ho" } },
		c: { foo: undefined },
	});
});

Deno.test("topoMerge arrays are replaced by default", () => {
	const schema = {
		a: { arr: [1, 2] },
		b: { arr: [3, 4] },
		c: { __extends: ["b", "a"], arr: [5, 6] },
	};

	const merged = topoMerge(schema);
	// console.log(JSON.stringify(merged, null, 4));

	assertEquals(merged, {
		a: { arr: [1, 2] },
		b: { arr: [3, 4] },
		c: { arr: [5, 6] }, // arrays are replaced
	});
});

Deno.test("topoMerge array merge", () => {
	const schema = {
		a: { arr: [1] },
		b: { arr: [2] },
		c: { __extends: ["a", "b"], arr: [3] },
	};
	const merged = topoMerge(schema, { arrays: "merge" });
	// console.log(JSON.stringify(merged, null, 4));

	assertEquals(merged.a.arr, [1]);
	assertEquals(merged.b.arr, [2]);

	// array merge is somewhat problematic with the current implementation,
	// as it may happen in unexpected order... so testing just `includes` here
	assert(merged.c.arr.includes(1));
	assert(merged.c.arr.includes(2));
	assert(merged.c.arr.includes(3));
	assertEquals(merged.c.arr.length, 3);
});

Deno.test("unknown ref id throws", () => {
	const schema = {
		a: { foo: "bar" },
		b: { __extends: ["c"], baz: "bat" }, // extends not found
	};
	assertThrows(() => topoMerge(schema));
});

Deno.test("id mismatch throws", () => {
	const schema = {
		a: { foo: "bar", id: "x" }, // id mismatch
		b: { baz: "bat" },
	};
	assertThrows(() => topoMerge(schema));
});

Deno.test("extends self throws", () => {
	const schema = {
		a: { foo: "bar", __extends: ["a"] }, // cannot extend self
	};
	assertThrows(() => topoMerge(schema));
});
