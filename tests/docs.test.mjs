import assert from 'node:assert/strict';
import test from 'node:test';
import { categoryDocs, isCategoryIndex, sortDocs } from '../src/lib/docs.ts';

function doc(id, category, order) {
	return { id, data: { categories: [category], order } };
}

test('only order zero marks a category index', () => {
	assert.equal(isCategoryIndex(doc('category', 'category', 0)), true);
	for (const order of [undefined, 1, -1]) {
		assert.equal(isCategoryIndex(doc('article', 'category', order)), false);
	}
});

test('category indexes sort by path and are excluded from category documents', () => {
	const indexes = [doc('zeta', 'zeta', 0), doc('alpha', 'alpha', 0)];
	const articles = [
		doc('alpha/later', 'alpha', 2),
		doc('alpha/first', 'alpha', 1),
		doc('alpha/unordered', 'alpha'),
		doc('zeta/other', 'zeta', 1),
	];
	const docs = [...indexes, ...articles];
	assert.deepEqual(sortDocs(docs.filter(isCategoryIndex)).map((item) => item.id), ['alpha', 'zeta']);
	assert.deepEqual(categoryDocs(docs, 'alpha').map((item) => item.id), [
		'alpha/first', 'alpha/later', 'alpha/unordered',
	]);
});
