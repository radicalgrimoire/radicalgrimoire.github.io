import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { postPath } from './post-paths.mjs';

const inventory = JSON.parse(readFileSync('tests/fixtures/legacy-urls.json', 'utf8'));

function page(url) {
	return readFileSync(join('dist', ...url.split('/').filter(Boolean), 'index.html'), 'utf8');
}

function assertRedirect(from, target) {
	const html = page(from);
	assert.ok(html.includes(`<link rel="canonical" href="${target}">`), from);
	assert.ok(html.includes(`<noscript><meta http-equiv="refresh" content="0; url=${target}"></noscript>`), from);
	assert.ok(html.includes(`<a href="${target}">`), from);
	const script = html.match(/<script>([\s\S]*?)<\/script>/);
	assert.ok(script, `Missing redirect script at ${from}`);
	let destination;
	const location = { search: '?filter=test', hash: '#section', replace: (value) => { destination = value; } };
	runInNewContext(script[1], { window: { location } });
	assert.equal(destination, `${target}?filter=test#section`, from);
}

test('all inventoried Jekyll post URLs are canonical and prior Astro URLs redirect', () => {
	assert.equal(inventory.posts.length, 48);
	for (const [id, legacy] of inventory.posts) {
		assert.equal(`/${postPath(id)}/`, legacy, id);
		assert.match(page(legacy), /<article\b/, legacy);
		assertRedirect(`/posts/${id}/`, legacy);
	}
	assert.equal(`/${postPath('2026-08-23-vs-carp')}/`, '/20260824-vs-carp/');
});

test('all documents use their Markdown paths and former URLs are not generated', () => {
	const root = join('src', 'content', 'docs');
	const files = readdirSync(root, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
	for (const file of files) {
		const path = join(file.parentPath, file.name);
		const id = relative(root, path).split(sep).join('/').replace(/\.md$/, '').replace(/\/index$/, '');
		assert.doesNotMatch(readFileSync(path, 'utf8'), /^permalink:/m, path);
		assert.match(page(`/${id}/`), /<article\b/, id);
	}

	assert.equal(inventory.documents.length, 36);
	for (const [id, legacy] of inventory.documents) {
		const target = `/${id}/`;
		assert.match(page(target), /<article\b/, target);
		assert.equal(existsSync(join('dist', 'documents', ...id.split('/'), 'index.html')), false, id);
		if (legacy !== target) {
			assert.equal(existsSync(join('dist', ...legacy.split('/').filter(Boolean), 'index.html')), false, legacy);
		}
	}
});

test('document listings and breadcrumbs use canonical category paths', () => {
	assert.ok(page('/documents/').includes('href="/perforce/"'));
	assert.ok(page('/perforce/').includes('href="/perforce/configure-p4v/"'));
	const html = page('/perforce/configure-p4v/');
	assert.ok(html.includes('href="/documents/"'));
	assert.ok(html.includes('href="/perforce/"'));
	assert.ok(page('/test/').includes('href="/test/github-alert-blocks/"'));
});

test('category indexes are listed alphabetically and keep their index layout', () => {
	const categories = ['/lore/', '/nsfw-ish/', '/perforce/', '/test/'];
	const html = page('/documents/');
	const directory = html.match(/<ul class="docs-directory">([\s\S]*?)<\/ul>/);
	const sidebar = html.match(/<ul class="sidebar-docs-categories"[^>]*>([\s\S]*?)<\/ul>/);
	assert.ok(directory);
	assert.ok(sidebar);
	for (const section of [directory[1], sidebar[1]]) {
		assert.deepEqual([...section.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]), categories);
	}
	for (const url of categories) {
		assert.match(page(url), /<article class="docs-index">/, url);
	}
	assert.match(page('/perforce/configure-p4v/'), /<article class="post-article docs-article">/);
});

test('second-level document categories are collapsible accordions', () => {
	const html = page('/perforce/');
	const accordions = [...html.matchAll(/<details class="docs-group" name="docs-groups">([\s\S]*?)<\/details>/g)];
	assert.equal(accordions.length, 3);
	assert.deepEqual(accordions.map((accordion) => accordion[1].match(/<h3>([^<]+)<\/h3>/)?.[1]), [
		'ユーザー操作', 'サーバー管理', 'トラブル対応',
	]);
	assert.ok(accordions.every((accordion) => /<summary class="docs-group-heading">/.test(accordion[1])));
	assert.match(accordions[1][1], /href="\/perforce\/commit-edge-server-setup\/"/);
});
