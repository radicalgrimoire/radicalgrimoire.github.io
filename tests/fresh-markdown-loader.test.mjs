import assert from 'node:assert/strict';
import test from 'node:test';
import { freshMarkdownLoader } from '../src/lib/fresh-markdown-loader.ts';

test('cached Markdown entries are rendered again when external embeds may have changed', async () => {
	const entry = { id: 'document', data: {}, body: '[doc](https://example.com "embed")', digest: 'old' };
	const entries = new Map([[entry.id, entry]]);
	let called = false;
	const loader = freshMarkdownLoader({
		name: 'test',
		async load(context) {
			called = true;
			assert.equal(context.store.values()[0].digest, undefined);
			assert.equal(context.store.values()[0].body, entry.body);
		},
	});
	await loader.load({
		store: {
			values: () => [...entries.values()],
			set: (value) => entries.set(value.id, value),
		},
	});
	assert.equal(called, true);
});
