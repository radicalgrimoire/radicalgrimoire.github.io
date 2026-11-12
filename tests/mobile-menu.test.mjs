import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function navigation(path) {
	const html = readFileSync(join('dist', path, 'index.html'), 'utf8');
	const desktop = html.match(/<nav class="sidebar-nav" aria-label="Main navigation">([\s\S]*?)<\/nav>/);
	const mobile = html.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/);
	assert.ok(desktop && mobile, `Missing navigation in ${path || 'home'}`);
	return { desktop: desktop[1], mobile: mobile[1] };
}

test('mobile navigation retains the configured dropdown and external icon', () => {
	const { desktop, mobile } = navigation('');
	assert.match(mobile, /<details class="menu-dropdown" name="mobile-navigation"><summary class="dropdown-toggle">Logs<\/summary>/);
	for (const [url, title, icon, description] of [
		['/archive/', 'DailyLogs', 'chat-left-text', '日記・ブログ記事'],
		['/documents/', 'Documents', 'folder2', '資料・読み物'],
		['/giants-calendar/', 'Giants Calendar', 'calendar3', 'ジャイアンツの試合日程'],
	]) {
		const item = [...mobile.matchAll(/<a href="([^"]+)"[^>]*class="dropdown-item[^"]*"[^>]*>([\s\S]*?)<\/a>/g)]
			.find((match) => match[1] === url && match[2].includes(title));
		assert.ok(item, `Missing dropdown item: ${title}`);
		assert.ok(item[2].includes(`bi-${icon}`));
		assert.ok(item[2].includes(description));
		assert.ok(desktop.includes(`>${title}</a>`), `Missing desktop link: ${title}`);
	}
	assert.match(mobile, /<a href="\/about\/"[^>]*>About<\/a>/);
	assert.match(mobile, /<a href="https:\/\/github\.com\/radicalgrimoire" aria-label="GitHub" title="GitHub"><i class="bi bi-github" aria-hidden="true"><\/i><\/a>/);
});

test('mobile dropdown distinguishes the selected section from the current page', () => {
	for (const [path, url, current] of [
		['20260817-vs-dragons', '/archive/', false],
		['archive', '/archive/', true],
		['documents', '/documents/', true],
		['perforce', '/documents/', false],
		['giants-calendar', '/giants-calendar/', true],
	]) {
		const { mobile } = navigation(path);
		const link = [...mobile.matchAll(/<a href="([^"]+)"([^>]*)>/g)]
			.find((match) => match[1] === url && match[2].includes('dropdown-item'));
		assert.ok(link, `Missing dropdown link for ${path}`);
		assert.match(link[2], /\bselected\b/);
		assert.equal(link[2].includes('aria-current="page"'), current, `Wrong current state for ${path}`);
	}
	const { mobile } = navigation('about');
	assert.match(mobile, /<a href="\/about\/" aria-current="page">About<\/a>/);
	assert.doesNotMatch(mobile, /class="dropdown-item selected"/);
});
