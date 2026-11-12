import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { postUrl } from '../src/lib/dates.ts';

export function postPath(id) {
	const source = readFileSync(`src/content/posts/${id}.md`, 'utf8');
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!frontmatter) throw new Error(`Missing frontmatter: ${id}`);
	return postUrl({ id, data: parse(frontmatter[1]) }).slice(1, -1);
}
