import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { postPath } from './post-paths.mjs';
import { lightboxImageMaxWidth } from '../src/components/lightbox-image-fit.ts';

const markdownImage = /!\[[^\]]*\]\(/;

function builtPage(path) {
	return readFileSync(join('dist', path, 'index.html'), 'utf8');
}

function hasLightbox(html) {
	return html.includes('ImageLightbox');
}

test('only constrains overlapping images and leaves room inside both controls', () => {
	const stage = { left: 0, right: 1000, top: 0, bottom: 600, width: 1000, height: 600 };
	const controls = [
		{ left: 16, right: 64, top: 276, bottom: 324, width: 48, height: 48 },
		{ left: 936, right: 984, top: 276, bottom: 324, width: 48, height: 48 },
	];
	assert.equal(lightboxImageMaxWidth(stage, 500, 300, 300, controls), null);
	assert.equal(lightboxImageMaxWidth(stage, 500, 2000, 1000, controls), 800);
	assert.equal(lightboxImageMaxWidth(stage, 500, 2000, 1000, [
		{ ...controls[0], right: 150 },
		{ ...controls[1], left: 850 },
	]), 684);
	assert.equal(lightboxImageMaxWidth(stage, 500, 0, 0, controls), null);
});

test('does not constrain images that are horizontally but not vertically overlapping', () => {
	const stage = { left: 0, right: 1000, top: 0, bottom: 100, width: 1000, height: 100 };
	const controls = [
		{ left: 16, right: 64, top: 276, bottom: 324, width: 48, height: 48 },
		{ left: 936, right: 984, top: 276, bottom: 324, width: 48, height: 48 },
	];
	assert.equal(lightboxImageMaxWidth(stage, 500, 2000, 100, controls), null);
});

test('posts with images load the lightbox island and posts without do not', () => {
	const root = join('src', 'content', 'posts');
	let withImages = 0;
	let withoutImages = 0;
	for (const filename of readdirSync(root).filter((name) => name.endsWith('.md'))) {
		const source = readFileSync(join(root, filename), 'utf8');
		const page = builtPage(postPath(filename.slice(0, -3)));
		if (markdownImage.test(source)) {
			assert.ok(hasLightbox(page), `Missing lightbox island: ${filename}`);
			withImages++;
		} else {
			assert.ok(!hasLightbox(page), `Unexpected lightbox island: ${filename}`);
			withoutImages++;
		}
	}
	assert.ok(withImages > 0, 'No posts with images found');
	assert.ok(withoutImages > 0, 'No posts without images found');
});

test('documents with images load the lightbox island and image-free pages do not', () => {
	assert.ok(hasLightbox(builtPage(join('perforce', 'install-p4v'))), 'Missing lightbox island on image document');
	assert.ok(!hasLightbox(builtPage('about')), 'Unexpected lightbox island on about page');
	assert.ok(!hasLightbox(builtPage('archive')), 'Unexpected lightbox island on archive page');
});
