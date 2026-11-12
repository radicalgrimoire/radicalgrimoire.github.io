import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { videoUrls } from '../src/lib/videos.ts';

function builtPage(path) {
	return readFileSync(join('dist', path, 'index.html'), 'utf8');
}

test('video URLs use the correct player and original video page', () => {
	assert.equal(videoUrls('youtube', 'HcqF94hcjZs').embed, 'https://www.youtube-nocookie.com/embed/HcqF94hcjZs');
	assert.equal(videoUrls('youtube', 'HcqF94hcjZs').watch, 'https://www.youtube.com/watch?v=HcqF94hcjZs');
	assert.equal(videoUrls('niconico', 'sm46451410').embed, 'https://embed.nicovideo.jp/watch/sm46451410');
	assert.equal(videoUrls('niconico', 'sm46451410').watch, 'https://www.nicovideo.jp/watch/sm46451410');
});

test('invalid platform or video IDs fail explicitly', () => {
	for (const id of ['', 'bad', 'HcqF94hcjZs?x=1', '../HcqF94hcjZs']) {
		assert.throws(() => videoUrls('youtube', id), /Invalid YouTube video ID/);
	}
	for (const id of ['', 'sm', 'sm46451410/other', 'javascript:1']) {
		assert.throws(() => videoUrls('niconico', id), /Invalid Niconico video ID/);
	}
	assert.throws(() => videoUrls('other', 'abc'), /Unsupported video platform/);
});

test('all migrated videos have lazy players and external fallback links', () => {
	const cases = [
		['20221211-daihatsu-tanto-testdrive', 'youtube', ['HcqF94hcjZs', 'Xcikgm6Me0c']],
		['20241021-vs-baystars', 'youtube', ['bRWAUoWrJyw', 'ANNYgd6MGv0', 'Z2z3l_5ZDT0']],
		['test/social-embeds', 'niconico', ['sm46451410']],
	];
	for (const [path, platform, ids] of cases) {
		const html = builtPage(path);
		const frames = [...html.matchAll(/<iframe\b[^>]*><\/iframe>/g)].map((match) => match[0]);
		assert.equal(frames.length, ids.length, `Unexpected frame count in ${path}`);
		for (const id of ids) {
			const video = videoUrls(platform, id);
			const frame = frames.find((value) => value.includes(`src="${video.embed}"`));
			assert.ok(frame, `Missing player ${video.embed}`);
			assert.ok(frame.includes('loading="lazy"'), `Missing lazy loading for ${id}`);
			assert.ok(frame.includes(`title="${video.title}"`), `Missing title for ${id}`);
			assert.ok(html.includes(`href="${video.watch}"`), `Missing fallback link for ${id}`);
		}
	}
});

test('Markdown images and video embeds coexist in the mixed-content post', () => {
	const html = builtPage('20221211-daihatsu-tanto-testdrive');
	assert.match(html, /<img[^>]*src="\/assets\/2022\/12\/20221210_150914\.jpg"[^>]*alt="ダイハツ タントファンクロスの実車"/);
	assert.ok(html.includes('<em>実車</em>'));
});
