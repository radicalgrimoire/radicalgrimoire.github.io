import type { CollectionEntry } from 'astro:content';

export type Doc = CollectionEntry<'docs'>;

export function isCategoryIndex(doc: Doc): boolean {
	return doc.data.order === 0;
}

export function sortDocs(docs: Doc[]): Doc[] {
	return [...docs].sort((a, b) =>
		(a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER)
		|| a.id.localeCompare(b.id),
	);
}

export function docUrl(doc: Doc): string {
	return `/${doc.id}/`;
}

export function categoryDocs(docs: Doc[], category: string): Doc[] {
	return sortDocs(docs.filter((doc) => !isCategoryIndex(doc) && doc.data.categories[0] === category));
}
