import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { parse } from 'yaml';
import { contentUpdateHistory } from '../src/lib/update-history.ts';
import { postPath } from './post-paths.mjs';

test('Git history records the latest content commit, including renames', (t) => {
	const cwd = mkdtempSync(join(tmpdir(), 'home-updates-'));
	t.after(() => rmSync(cwd, { recursive: true, force: true }));
	const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
	git('init', '-q');
	git('config', 'user.name', 'Test');
	git('config', 'user.email', 'test@example.test');
	mkdirSync(join(cwd, 'src', 'content', 'posts'), { recursive: true });
	mkdirSync(join(cwd, 'src', 'content', 'docs'), { recursive: true });
	const post = 'src/content/posts/old.md';
	const renamed = 'src/content/posts/new name.md';
	const doc = 'src/content/docs/資料.md';
	writeFileSync(join(cwd, post), 'post');
	writeFileSync(join(cwd, doc), 'doc');
	const commit = (date, message) => {
		git('add', '-A');
		execFileSync('git', ['commit', '-qm', message], {
			cwd, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
		});
	};
	commit('2025-01-01T00:00:00Z', 'initial');
	writeFileSync(join(cwd, doc), 'updated');
	commit('2025-01-02T00:00:00Z', 'update doc');
	git('mv', post, renamed);
	commit('2025-01-03T00:00:00Z', 'rename post');
	writeFileSync(join(cwd, 'src', 'content', 'docs', 'untracked.md'), 'new');

	const history = contentUpdateHistory(cwd);
	assert.equal(history.get(doc)?.toISOString(), '2025-01-02T00:00:00.000Z');
	assert.equal(history.get(renamed)?.toISOString(), '2025-01-03T00:00:00.000Z');
	assert.equal(history.has('src/content/docs/untracked.md'), false);

	writeFileSync(join(cwd, '.git', 'shallow'), `${git('rev-parse', 'HEAD')}\n`);
	assert.throws(() => contentUpdateHistory(cwd), /Full Git history is required/);
});

test('home shows exactly the latest ten posts and documents with their update dates', () => {
	const files = execFileSync('git', ['ls-files', '-z', '--', 'src/content/posts', 'src/content/docs'], {
		encoding: 'utf8',
	}).split('\0').filter((path) => path.endsWith('.md'));
	const expected = files.map((path) => {
		const timestamp = execFileSync('git', ['log', '-1', '--format=%ct', '--', path], {
			encoding: 'utf8',
		}).trim();
		assert.ok(timestamp, `Missing Git history for ${path}`);
		const isPost = path.startsWith('src/content/posts/');
		const id = path.replace(/^src\/content\/(?:posts|docs)\//, '').replace(/\.md$/, '');
		const url = isPost ? `/${postPath(id)}/` : `/${id.replace(/\/index$/, '')}/`;
		return { path, url, type: isPost ? 'Posts' : 'Docs', date: new Date(Number(timestamp) * 1000).toISOString() };
	}).sort((a, b) => b.date.localeCompare(a.date) || a.path.localeCompare(b.path));

	const html = readFileSync('dist/index.html', 'utf8');
	const { timezone } = parse(readFileSync('site.config.yml', 'utf8'));
	const rendered = [...html.matchAll(/<li class="note-item"([^>]*)>([\s\S]*?)<\/li>/g)];
	const items = rendered
		.filter((match) => !/\shidden(?:\s|=|$)/.test(match[1]))
		.map((match) => match[2]);
	assert.equal(items.length, 10);
	for (const [index, item] of items.entries()) {
		assert.ok(item.includes(`href="${expected[index].url}"`), expected[index].path);
		assert.ok(item.includes(`datetime="${expected[index].date}"`), expected[index].path);
		assert.ok(item.includes(`<span class="note-type">${expected[index].type}</span>`), expected[index].path);
		const date = new Date(expected[index].date);
		const parts = new Intl.DateTimeFormat('en-GB', {
			timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
		}).formatToParts(date);
		const part = (type) => parts.find((value) => value.type === type).value;
		const month = new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'short' }).format(date);
		assert.ok(item.includes(`<span>${month}</span><strong>${part('day')}</strong><span>${part('year')}</span>`));
	}
	for (const type of ['Posts', 'Docs']) {
		const actual = rendered.filter((match) => match[1].includes(`data-home-item="${type}"`));
		const recent = expected.filter((item) => item.type === type).slice(0, 10);
		assert.equal(actual.length, recent.length);
		for (const [index, item] of recent.entries()) {
			assert.ok(actual[index][2].includes(`href="${item.url}"`), item.path);
		}
	}
});

test('home filters show the latest ten of each type and preserve the initial list', () => {
	const html = readFileSync('dist/index.html', 'utf8');
	const rendered = [...html.matchAll(/<li class="note-item"([^>]*)>([\s\S]*?)<\/li>/g)];
	const items = rendered.map((match) => ({
		dataset: { homeItem: match[1].match(/data-home-item="([^"]+)"/)[1] },
		hidden: /\shidden(?:\s|=|$)/.test(match[1]),
	}));
	const initial = items.filter((item) => !item.hidden);
	const buttons = ['all', 'Posts', 'Docs'].map((type) => ({
		dataset: { homeFilter: type },
		textContent: { all: 'すべて', Posts: '記事', Docs: '資料' }[type],
		addEventListener(_type, handler) { this.click = handler; },
		setAttribute(name, value) { this[name] = value; },
	}));
	const filters = { hidden: true, querySelectorAll: () => buttons };
	const status = { textContent: '' };
	const document = {
		querySelector: (selector) => selector === '[data-home-filters]' ? filters : status,
		querySelectorAll: () => items,
	};
	runInNewContext(readFileSync('public/scripts/home-filters.js', 'utf8'), { document });
	assert.equal(filters.hidden, false);
	for (const [index, type] of ['Posts', 'Docs'].entries()) {
		buttons[index + 1].click();
		assert.deepEqual(items.filter((item) => !item.hidden), items.filter((item) => item.dataset.homeItem === type).slice(0, 10));
		assert.equal(buttons[index + 1]['aria-pressed'], 'true');
		assert.equal(buttons[0]['aria-pressed'], 'false');
	}
	buttons[0].click();
	assert.deepEqual(items.filter((item) => !item.hidden), initial);
	assert.equal(buttons[0]['aria-pressed'], 'true');
	items.splice(0, items.length);
	buttons[1].click();
	assert.equal(status.textContent, '該当する更新はありません。');
	assert.match(html, /data-home-filters hidden/);
	assert.match(html, /class="note-category archive-color-(?:configured-\d+|other)"/);
});
