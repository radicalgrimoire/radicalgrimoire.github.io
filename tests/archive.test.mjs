import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { postPath } from './post-paths.mjs';

test('archive renders all posts, filters, navigation, and preview hooks', () => {
	const html = readFileSync('dist/archive/index.html', 'utf8');
	const posts = readdirSync('src/content/posts').filter((name) => name.endsWith('.md'));
	assert.equal([...html.matchAll(/data-archive-post\b/g)].length, posts.length);
	for (const post of posts) {
		assert.ok(html.includes(`href="/${postPath(post.slice(0, -3))}/"`), `Missing ${post}`);
	}
	for (const text of [
		'<title>DailyLogs | GadgetLogs</title>',
		'data-filter-status',
		'sidebar-archive-filters-category',
		'mobile-archive-filters-tag',
		'data-archive-pagination',
		'data-archive-reader',
		'/scripts/archive-filters.js',
		'/scripts/archive-reader.js',
		'<noscript>',
	]) assert.ok(html.includes(text), `Missing ${text}`);
	const post = readFileSync('dist/20260817-vs-dragons/index.html', 'utf8');
	assert.ok(post.includes('href="/archive/"'));
	assert.ok(post.includes('/scripts/archive-post-preview.js'));
});

function filterHarness(initialUrl = 'https://example.test/archive/') {
	const element = (dataset = {}) => ({
		dataset, hidden: false, disabled: false, textContent: '', handlers: {},
		addEventListener(type, handler) { this.handlers[type] = handler; },
		setAttribute(name, value) { this[name] = value; },
		removeAttribute() {},
		contains() { return true; },
	});
	const posts = Array.from({ length: 25 }, (_, index) => element({
		categories: JSON.stringify([index < 10 ? 'baseball' : 'tech']),
		tags: JSON.stringify([index % 2 ? 'odd' : 'even']),
		year: index < 16 ? '2026' : '2025',
	}));
	const panel = element();
	const clear = element();
	const previous = element();
	const next = element();
	const status = element();
	const years = element();
	const pagination = element();
	const label = element();
	const option = element({ filterType: 'category', filterValue: 'baseball' });
	const tag = element({ filterType: 'tag', filterValue: 'even' });
	const trigger = element({ filterTrigger: 'category' });
	trigger.querySelector = () => element();
	const document = {
		querySelectorAll(selector) {
			return ({
				'[data-archive-filters]': [panel],
				'[data-filter-clear]': [clear],
				'[data-archive-post]': posts,
				'[data-filter-trigger]': [trigger],
				'[data-filter-type]': [option, tag],
			})[selector];
		},
		querySelector(selector) {
			return ({
				'[data-filter-status]': status, '[data-archive-years]': years,
				'[data-archive-pagination]': pagination, '[data-archive-page]': label,
				'[data-archive-previous]': previous, '[data-archive-next]': next,
				'.archive-page': { scrollIntoView() {} },
			})[selector];
		},
	};
	const window = {
		location: { href: initialUrl, search: new URL(initialUrl).search },
		addEventListener(type, handler) { this[type] = handler; },
		history: {
			pushState(_state, _title, url) {
				window.location.href = String(url);
				window.location.search = url.search;
			},
		},
	};
	class HTMLElement {
		showPopover() {}
	}
	runInNewContext(readFileSync('public/scripts/archive-filters.js', 'utf8'), {
		document, window, HTMLElement, URL, URLSearchParams,
	});
	const click = (button) => panel.handlers.click({ target: { closest: () => button } });
	return { posts, previous, next, status, label, clear, option, tag, window, click };
}

test('archive filtering, pagination, and URL history remain in sync', () => {
	const archive = filterHarness();
	const visible = () => archive.posts.filter((post) => !post.hidden).length;
	assert.equal(visible(), 16);
	assert.equal(archive.label.textContent, '1 / 2');
	archive.next.handlers.click();
	assert.equal(visible(), 9);
	assert.equal(archive.label.textContent, '2 / 2');
	assert.equal(new URL(archive.window.location.href).searchParams.get('page'), '2');
	archive.click(archive.option);
	assert.equal(visible(), 10);
	assert.equal(archive.label.textContent, '1 / 1');
	assert.equal(archive.option['aria-pressed'], 'true');
	assert.equal(new URL(archive.window.location.href).searchParams.has('page'), false);
	archive.click(archive.tag);
	assert.equal(visible(), 5);
	assert.equal(archive.status.textContent, 'baseball / even: 5件');
	archive.clear.handlers.click();
	assert.equal(visible(), 16);
	assert.equal(archive.status.hidden, true);
	archive.window.location.search = '?category=unknown&page=999';
	archive.window.popstate();
	assert.equal(visible(), 0);
	assert.equal(archive.label.textContent, '1 / 1');
});
