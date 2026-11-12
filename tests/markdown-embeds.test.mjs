import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { markdownToHtml } from 'satteri';
import { embedPlugin } from '../src/lib/markdown-embeds.ts';
import { githubAlertPlugin } from '../src/lib/github-alert-blocks.ts';

function render(markdown) {
	return markdownToHtml(markdown, { hastPlugins: [embedPlugin] }).html;
}

test('only marked standalone links become embeds', () => {
	const html = render([
		'[ordinary](https://x.com/example/status/1)',
		'',
		'[named](https://x.com/example/status/1 "another title")',
		'',
		'[embedded](https://x.com/example/status/1 "embed")',
	].join('\n'));
	assert.match(html, /<a href="https:\/\/x\.com\/example\/status\/1">ordinary<\/a>/);
	assert.match(html, /title="another title">named<\/a>/);
	assert.match(html, /<blockquote class="twitter-tweet"><a href="https:\/\/x\.com\/example\/status\/1">embedded<\/a><\/blockquote>/);
	assert.equal((html.match(/social-embeds\.js/g) ?? []).length, 1);
});

test('repeated social links use one loader and video-only pages use none', () => {
	const repeated = render('[one](https://x.com/a/status/1 "embed")\n\n[two](https://x.com/b/status/2 "embed")');
	assert.equal((repeated.match(/class="twitter-tweet"/g) ?? []).length, 2);
	assert.equal((repeated.match(/social-embeds\.js/g) ?? []).length, 1);
	const video = render('[video](https://www.youtube.com/watch?v=HcqF94hcjZs "embed")');
	assert.match(video, /https:\/\/www\.youtube-nocookie\.com\/embed\/HcqF94hcjZs/);
	assert.doesNotMatch(video, /social-embeds\.js/);
	assert.doesNotMatch(render('[plain](https://x.com/a/status/1)'), /social-embeds\.js/);
});

test('invalid marked URLs and inline embeds fail explicitly', () => {
	for (const url of [
		'https://example.com/post',
		'http://x.com/a/status/1',
		'https://x.com.example.com/a/status/1',
		'https://www.youtube.com/watch?v=bad',
		'https://www.youtube.com/watch?v=HcqF94hcjZs&v=HcqF94hcjZs',
		'https://www.nicovideo.jp/watch/sm',
	]) {
		assert.throws(() => render(`[bad](${url} "embed")`), /Invalid embed/);
	}
	assert.throws(() => render('Text [inline](https://x.com/a/status/1 "embed") text'), /paragraph of their own/);
});

test('marked raw GitHub Markdown links expand inline and resolve relative images', async (t) => {
	t.mock.method(globalThis, 'fetch', async () => new Response([
		'# Embedded document',
		'',
		'![Figure](../images/figure.png)',
	].join('\n')));

	const html = (await markdownToHtml(
		'[Document](https://raw.githubusercontent.com/user/repo/main/docs/example.md "embed")',
		{ hastPlugins: [embedPlugin] },
	)).html;
	assert.match(html, /<h1>Embedded document<\/h1>/);
	assert.match(html, /src="https:\/\/raw\.githubusercontent\.com\/user\/repo\/main\/images\/figure\.png"/);
	assert.doesNotMatch(html, /href="https:\/\/raw\.githubusercontent\.com\/user\/repo\/main\/docs\/example\.md"/);
});

test('embedded Markdown coexists with local content and activates alert handling', async (t) => {
	t.mock.method(globalThis, 'fetch', async () => new Response('> [!NOTE]\n> Embedded alert.'));
	const html = (await markdownToHtml([
		'Local introduction.',
		'',
		'[Document](https://raw.githubusercontent.com/user/repo/main/docs/example.md "embed")',
		'',
		'Local conclusion.',
	].join('\n'), { hastPlugins: [embedPlugin, githubAlertPlugin] })).html;
	assert.match(html, /Local introduction/);
	assert.match(html, /Embedded alert/);
	assert.match(html, /Local conclusion/);
	assert.match(html, /github-alert-blocks\.js/);
});

test('external documents are authored as embeds in their Markdown bodies', () => {
	for (const file of readdirSync('src/content/docs', { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))) {
		const path = join(file.parentPath, file.name);
		const source = readFileSync(path, 'utf8');
		assert.doesNotMatch(source, /^source_url:/m, path);
	}
});

test('all migrated content uses Markdown rather than MDX', () => {
	for (const directory of ['src/content/posts', 'src/content/docs']) {
		const files = readdirSync(directory, { recursive: true });
		assert.ok(files.every((file) => !file.endsWith('.mdx')), `Unexpected MDX in ${join(directory)}`);
	}
});
