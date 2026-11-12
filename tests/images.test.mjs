import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { postPath } from './post-paths.mjs';

test('post images use Markdown and appear in their generated pages', () => {
	const root = join('src', 'content', 'posts');
	let imageCount = 0;
	for (const filename of readdirSync(root).filter((name) => name.endsWith('.md'))) {
		const source = readFileSync(join(root, filename), 'utf8');
		assert.doesNotMatch(source, /\{%\s*include\s+image\.html\b/, filename);
		const images = [...source.matchAll(/!\[([^\]]*)\]\((\/assets\/[^)\s]+)\)/g)];
		if (!images.length) continue;
		const page = readFileSync(join('dist', postPath(filename.slice(0, -3)), 'index.html'), 'utf8');
		for (const [, alt, src] of images) {
			assert.ok(existsSync(join('public', src.slice(1))), `Missing image ${src}`);
			assert.ok(page.includes(`src="${src}" alt="${alt}"`), `Missing rendered image ${src}`);
			imageCount++;
		}
	}
	assert.ok(imageCount > 0, 'No Markdown images found');
});
