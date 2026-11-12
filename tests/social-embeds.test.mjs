import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const providers = {
	x: 'https://platform.twitter.com/widgets.js',
	instagram: 'https://www.instagram.com/embed.js',
	threads: 'https://www.threads.net/embed.js',
};

function builtPage(path) {
	return readFileSync(join('dist', path, 'index.html'), 'utf8');
}

function runEmbedScript(html, selectors) {
	const scripts = [...html.matchAll(/<script src="\/scripts\/social-embeds\.js" defer><\/script>/g)];
	assert.equal(scripts.length, 1, 'Expected one embed loader');
	const loaded = [];
	const errors = [];
	const document = {
		querySelector: (selector) => selectors.includes(selector) ? {} : null,
		createElement: (tag) => {
			assert.equal(tag, 'script');
			return { addEventListener(event, callback) { this[event] = callback; } };
		},
		head: { append: (script) => loaded.push(script) },
	};
	runInNewContext(readFileSync('public/scripts/social-embeds.js', 'utf8'), {
		document,
		console: { error: (message) => errors.push(message) },
	});
	return { loaded, errors };
}

test('social test page contains all three providers and fallback links', () => {
	const html = builtPage('test/social-embeds');
	assert.ok(!html.includes('<div class="markdown-embed">'), 'Markdown embed belongs on its own test page');
	assert.ok(!html.includes('文字コードの設定'), 'Markdown embed body belongs on its own test page');
	for (const expected of [
		'class="twitter-tweet"',
		'class="instagram-media"',
		'class="text-post-media"',
		'https://x.com/radicalgrimoire/status/2088191328060658120?s=20',
		'https://www.instagram.com/p/DcDtd4UEmLC/?hl=ja',
		'https://www.threads.com/@radicalgrimoire/post/DcDzpNxicCg?xmt=AQG0T6MANaG0h7c5WOLdJU9SNTOb_M-gIm9ANvJ0uNpTW1zKst72A_-swQjP6IzD-cY80TU',
	]) assert.ok(html.includes(expected), `Missing ${expected}`);

	const { loaded, errors } = runEmbedScript(html, ['.twitter-tweet', '.instagram-media', '.text-post-media']);
	assert.deepEqual(loaded.map((script) => script.src), Object.values(providers));
	assert.ok(loaded.every((script) => script.async));
	loaded[0].error();
	assert.match(errors[0], /Failed to load X embed script/);
});

test('post pages load only the provider they use', () => {
	const cases = [
		['20260809-vs-swallows', '.instagram-media', providers.instagram, 'utm_source=ig_web_copy_link&amp;igsi=MzRlODBiNWFlZA=='],
		['20260816-takemaru-deregistered', '.twitter-tweet', providers.x, 'https://x.com/hochi_giants/status/2088816002415141151?s=20'],
		['20260817-vs-dragons', '.twitter-tweet', providers.x, 'https://x.com/sanspo_giants/status/2088930132820185494?s=20'],
	];
	for (const [path, selector, src, link] of cases) {
		const html = builtPage(path);
		assert.ok(html.includes(link), `Missing original link in ${path}`);
		const { loaded } = runEmbedScript(html, [selector]);
		assert.deepEqual(loaded.map((script) => script.src), [src]);
	}
});

test('pages without SNS embeds do not load the embed loader', () => {
	for (const path of ['', 'documents', '20260827-wsl-local-create']) {
		const html = builtPage(path);
		assert.ok(!html.includes('/scripts/social-embeds.js'), `Unexpected SNS loader in ${path || 'home'}`);
	}
});

test('Instagram frames can shrink below the provider minimum width', () => {
	const html = builtPage('test/social-embeds');
	const stylesheet = html.match(/href="\/(_astro\/[^"]+\.css)"/);
	assert.ok(stylesheet, 'Missing generated stylesheet');
	const css = readFileSync(join('dist', stylesheet[1]), 'utf8');
	assert.match(css, /iframe\.instagram-media\{[^}]*min-width:min\(326px,100%\)!important;[^}]*max-width:100%!important/);
});
