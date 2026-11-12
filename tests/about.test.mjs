import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function builtPage(path) {
	return readFileSync(join('dist', path, 'index.html'), 'utf8');
}

test('About page preserves the original content and GitHub link', () => {
	const html = builtPage('about');
	for (const text of [
		'<title>About | GadgetLogs</title>',
		'radicalgrimoire',
		'This is a personal blog about game-development technology',
		'What I Do',
		'Perforce / Helix Core operations, Docker-based development environments, WSL2, and Unreal Horde',
		'What I Write',
		'Development environments, version control, and infrastructure operations',
		'Baseball game reports',
		'Thoughts on anime, movies, and games',
		'Things that happen in everyday life',
		'href="https://github.com/radicalgrimoire"',
	]) {
		assert.ok(html.includes(text), `Missing About content: ${text}`);
	}
});

test('desktop and mobile navigation show the correct current page', () => {
	for (const [path, current] of [['', '/'], ['archive', '/archive/'], ['about', '/about/'], ['documents', '/documents/'], ['giants-calendar', '/giants-calendar/']]) {
		const html = builtPage(path);
		const menus = [...html.matchAll(/<nav(?: class="sidebar-nav")? aria-label="Main navigation">([\s\S]*?)<\/nav>/g)];
		assert.equal(menus.length, 2, `Missing navigation in ${path || 'home'}`);
		for (const menu of menus) {
			const links = [...menu[1].matchAll(/<a href="([^"]+)"([^>]*)>/g)];
			assert.ok(links.some((link) => link[1] === '/about/'), `Missing About link in ${path || 'home'}`);
			assert.ok(links.some((link) => link[1] === current && link[2].includes('aria-current="page"')));
			assert.ok(!links.some((link) => link[1] !== current && link[2].includes('aria-current="page"')));
		}
	}
});
