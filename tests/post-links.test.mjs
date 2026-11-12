import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { postPath } from './post-paths.mjs';

test('migrated post links point to generated articles', () => {
	const root = 'dist';
	const cases = [
		['2026-11-05-2026-giants-season-review', [
			'2026-04-30-20260304-giants-watch',
			'2026-05-31-202605-giants-watch',
			'2026-06-30-202606-giants-watch',
			'2026-07-31-202607-giants-watch',
			'2026-08-31-202608-giants-watch',
			'2026-09-30-202609-giants-watch',
			'2026-10-25-202610-giants-watch',
		]],
		['2026-08-31-202608-giants-watch', ['2026-08-23-vs-carp']],
	];
	for (const [source, destinations] of cases) {
		const html = readFileSync(join(root, postPath(source), 'index.html'), 'utf8');
		for (const destination of destinations) {
			const path = postPath(destination);
			assert.ok(html.includes(`href="/${path}/"`), `Missing link to ${destination} in ${source}`);
			assert.ok(existsSync(join(root, path, 'index.html')), `Missing destination ${destination}`);
		}
	}
});

test('published post sources do not contain Jekyll post_url tags', () => {
	const root = join('src', 'content', 'posts');
	for (const filename of readdirSync(root).filter((name) => name.endsWith('.md'))) {
		assert.doesNotMatch(readFileSync(join(root, filename), 'utf8'), /\{%\s*post_url\b/, filename);
	}
});
