import type { CollectionEntry } from 'astro:content';
import { dateParts as getDateParts } from './dates';
import { siteConfig } from './site-config';
import { categoryColor as getCategoryColor } from './site-config-schema';

type Post = CollectionEntry<'posts'>;

export { postDate, postUrl } from './dates';

export function categoryColor(categories: string[]): string {
	return getCategoryColor(categories, siteConfig);
}

export function dateParts(post: Post) {
	return getDateParts(post, siteConfig.timezone);
}

export function formattedDate(post: Post): string {
	const { year, month, day } = dateParts(post);
	return `${year}.${month}.${day}`;
}
