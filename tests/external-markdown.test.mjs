import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchExternalMarkdown } from '../src/lib/external-markdown.ts';

test('fetches Markdown only from raw.githubusercontent.com without following redirects', async (t) => {
	const fetch = t.mock.method(globalThis, 'fetch', async (_url, options) => {
		assert.equal(options.redirect, 'error');
		return new Response('# External source');
	});

	assert.equal(
		await fetchExternalMarkdown('https://raw.githubusercontent.com/user/repo/main/docs/example.md'),
		'# External source',
	);
	assert.equal(fetch.mock.callCount(), 1);
	await assert.rejects(
		fetchExternalMarkdown('https://example.com/content.md'),
		/Unsupported external Markdown URL/,
	);
	assert.equal(fetch.mock.callCount(), 1);
});

test('reports HTTP errors and rejects oversized Markdown', async (t) => {
	const fetch = t.mock.method(globalThis, 'fetch', async (_url) => new Response(null, { status: 404 }));
	await assert.rejects(
		fetchExternalMarkdown('https://raw.githubusercontent.com/user/repo/main/missing.md'),
		/HTTP 404/,
	);

	fetch.mock.mockImplementation(async (_url) => new Response(new Uint8Array(2 * 1024 * 1024 + 1)));
	await assert.rejects(
		fetchExternalMarkdown('https://raw.githubusercontent.com/user/repo/main/large.md'),
		/exceeds 2097152 bytes/,
	);
});
