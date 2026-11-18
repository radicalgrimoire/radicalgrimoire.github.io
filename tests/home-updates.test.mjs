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

test('home shows the configured number of latest posts with their update dates', () => {
	const files = execFileSync('git', ['ls-files', '-z', '--', 'src/content/posts'], {
		encoding: 'utf8',
	}).split('\0').filter((path) => path.endsWith('.md'));
	const expected = files.map((path) => {
		const timestamp = execFileSync('git', ['log', '-1', '--format=%ct', '--', path], {
			encoding: 'utf8',
		}).trim();
		assert.ok(timestamp, `Missing Git history for ${path}`);
		const id = path.replace(/^src\/content\/posts\//, '').replace(/\.md$/, '');
		return { path, url: `/${postPath(id)}/`, type: 'Posts', date: new Date(Number(timestamp) * 1000).toISOString() };
	}).sort((a, b) => b.date.localeCompare(a.date) || a.path.localeCompare(b.path));

	const html = readFileSync('dist/index.html', 'utf8');
	const { timezone, latest_notes_count: limit } = parse(readFileSync('site.config.yml', 'utf8'));
	const rendered = [...html.matchAll(/<li class="note-item"([^>]*)>([\s\S]*?)<\/li>/g)];
	const items = rendered
		.filter((match) => !/\shidden(?:\s|=|$)/.test(match[1]))
		.map((match) => match[2]);
	assert.equal(items.length, Math.min(limit, expected.length));
	assert.ok(html.includes(`記事の最新${limit}件を更新順に表示しています。`));
	assert.ok(html.includes('role="tablist" aria-label="トップページの表示"'));
	assert.ok(html.includes('aria-label="G-Cal"'));
	assert.ok(html.includes('data-calendar-mode="week"'));
	assert.ok(html.includes('src="/scripts/giants-calendar.js"'));
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
	assert.equal(rendered.length, Math.min(limit, expected.length));
	for (const [index, item] of expected.slice(0, limit).entries()) {
		assert.ok(rendered[index][2].includes(`href="${item.url}"`), item.path);
	}
});

test('home tabs switch panels and support keyboard navigation', () => {
	const html = readFileSync('dist/index.html', 'utf8');
	const buttons = ['articles', 'calendar'].map((name) => ({
		dataset: { homeTab: name },
		focused: false,
		addEventListener(type, handler) { this[type] = handler; },
		setAttribute(name, value) { this[name] = value; },
		focus() { this.focused = true; },
	}));
	const panels = ['articles', 'calendar'].map((name, index) => ({
		dataset: { homePanel: name }, hidden: index > 0,
	}));
	const tabs = { hidden: true, querySelectorAll: () => buttons };
	const document = {
		querySelector: () => tabs,
		querySelectorAll: () => panels,
	};
	runInNewContext(readFileSync('public/scripts/home-filters.js', 'utf8'), { document });
	assert.equal(tabs.hidden, false);
	buttons[1].click();
	assert.deepEqual(panels.map((panel) => panel.hidden), [true, false]);
	assert.equal(buttons[1]['aria-selected'], 'true');
	assert.equal(buttons[0]['aria-selected'], 'false');
	buttons[1].keydown({ key: 'ArrowLeft', preventDefault() { this.prevented = true; } });
	assert.deepEqual(panels.map((panel) => panel.hidden), [false, true]);
	assert.equal(buttons[0].focused, true);
	assert.equal(buttons[0].tabIndex, 0);
	assert.match(html, /data-home-tabs hidden/);
	assert.match(html, /class="note-category archive-color-(?:configured-\d+|other)"/);
});
