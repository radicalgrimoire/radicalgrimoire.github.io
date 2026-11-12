import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml } from 'satteri';
import { githubAlertPlugin } from '../src/lib/github-alert-blocks.ts';

function render(markdown) {
	return markdownToHtml(markdown, { hastPlugins: [githubAlertPlugin] }).html;
}

test('alert pages load the converter while ordinary blockquotes do not', () => {
	const html = render('> [!NOTE]\n> Useful context.');
	assert.match(html, /<blockquote>[\s\S]*\[!NOTE\]/);
	assert.match(html, /<script src="\/scripts\/github-alert-blocks\.js" defer><\/script>/);
	assert.doesNotMatch(render('> An ordinary quote.'), /github-alert-blocks\.js/);
});

test('all supported alert markers load the converter', () => {
	for (const type of ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']) {
		assert.match(render(`> [!${type}]\n> Content`), /github-alert-blocks\.js/);
	}
	assert.doesNotMatch(render('> [!UNKNOWN]\n> Content'), /github-alert-blocks\.js/);
});
