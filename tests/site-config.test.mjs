import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse, stringify } from 'yaml';
import { categoryColor, categoryColorsCss, parseSiteConfig } from '../src/lib/site-config-schema.ts';
import { dateParts } from '../src/lib/dates.ts';

const source = readFileSync('site.config.yml', 'utf8');

test('configured category colors support additions, ordering, and fallback', () => {
	const data = parse(source);
	const category = structuredClone(data.category_colors.categories[0]);
	category.name = 'custom';
	category.light.accent = '#123456';
	category.dark.accent = '#abcdef';
	data.category_colors.categories.unshift(category);
	const config = parseSiteConfig(stringify(data));
	assert.equal(categoryColor(['baseball', 'custom'], config), 'configured-0');
	assert.equal(categoryColor(['unknown'], config), 'other');
	const css = categoryColorsCss(config);
	assert.match(css, /\.archive-color-configured-0\{--archive-accent:#123456;/);
	assert.match(css, /@media \(prefers-color-scheme:dark\)\{.*\.archive-color-configured-0\{--archive-accent:#abcdef;/);
});

test('invalid configuration fails with a useful field name', () => {
	for (const [field, value] of [
		['timezone', 'Not/A_Timezone'],
		['lang', 'not_a_language'],
		['title_accent', 'not the title suffix'],
	]) {
		const data = parse(source);
		data[field] = value;
		assert.throws(() => parseSiteConfig(stringify(data)), new RegExp(field));
	}
	const data = parse(source);
	data.category_colors.fallback.light.accent = 'red;}</style>';
	assert.throws(() => parseSiteConfig(stringify(data)), /accent/);
	data.category_colors.fallback.light.accent = '#123456';
	data.external[0].url = 'javascript:alert(1)';
	assert.throws(() => parseSiteConfig(stringify(data)), /external/);
});

test('latest notes count must be a positive integer', () => {
	const data = parse(source);
	data.latest_notes_count = 3;
	assert.equal(parseSiteConfig(stringify(data)).latest_notes_count, 3);
	for (const value of [0, -1, 1.5, '10']) {
		data.latest_notes_count = value;
		assert.throws(() => parseSiteConfig(stringify(data)), /latest_notes_count/);
	}
});

test('date-only posts retain their date while timestamps use the configured timezone', () => {
	const entry = (date) => ({ id: '2026-01-01-example', data: { date } });
	assert.equal(dateParts(entry('2026-01-01'), 'America/Los_Angeles').day, '01');
	assert.equal(dateParts({ id: '2026-01-01-example', data: {} }, 'America/Los_Angeles').day, '01');
	assert.equal(dateParts(entry('2026-01-01T00:00:00Z'), 'America/Los_Angeles').day, '31');
	assert.equal(dateParts(entry('2026-01-01T23:30:00Z'), 'Asia/Tokyo').day, '02');
});

test('built pages apply current site settings and do not include an RSS link', () => {
	const config = parseSiteConfig(source);
	const html = readFileSync('dist/index.html', 'utf8');
	assert.ok(html.includes(`<html lang="${config.lang}">`));
	assert.ok(html.includes(`<title>${config.title}</title>`));
	assert.ok(html.includes(config.description));
	assert.ok(html.includes(config.external[0].url));
	assert.ok(html.includes(categoryColorsCss(config)));
	assert.ok(!html.includes('/feed.xml'));
	const post = readFileSync('dist/20260817-vs-dragons/index.html', 'utf8');
	assert.ok(post.includes('archive-color-configured-1'));
	assert.ok(post.includes('2026.08.17'));
});

test('site titles are not links and Home navigation remains available', () => {
	const html = readFileSync('dist/index.html', 'utf8');
	for (const className of ['sidebar-title', 'title']) {
		assert.match(html, new RegExp(`<span class="${className}">[^<]*<span class="site-title-accent">[^<]+</span></span>`));
	}
	assert.match(html, /<a href="\/"[^>]*>(?:<i[^>]*><\/i>)?Home<\/a>/);
});

test('external stylesheets use integrity checks and limit referrer disclosure', () => {
	const html = readFileSync('dist/index.html', 'utf8');
	const stylesheets = [...html.matchAll(/<link\b[^>]*href="https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap(?:-icons)?@[^"]+\.css"[^>]*>/g)];
	assert.equal(stylesheets.length, 2);
	for (const [link] of stylesheets) {
		assert.match(link, /integrity="sha384-[A-Za-z0-9+/]{64}"/);
		assert.match(link, /crossorigin="anonymous"/);
		assert.match(link, /referrerpolicy="no-referrer"/);
	}
});
