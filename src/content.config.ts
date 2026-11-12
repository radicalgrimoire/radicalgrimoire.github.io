import { glob } from 'astro/loaders';
import type { LoaderContext } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { extractFrontmatter } from 'astro/markdown';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { freshMarkdownLoader } from './lib/fresh-markdown-loader.ts';

const postFiles = glob({ base: './src/content/posts', pattern: '**/*.md' });
const postsLoader = {
	...postFiles,
	async load(context: LoaderContext) {
		const parseData: LoaderContext['parseData'] = async (props) => {
			if (props.data.date !== undefined && props.filePath) {
				const source = await readFile(props.filePath, 'utf8');
				if (source.replace(/^\uFEFF/, '').trimStart().startsWith('---')) {
					const raw = extractFrontmatter(source);
					if (raw === undefined) throw new Error(`Missing frontmatter in ${props.filePath}`);
					// Preserve YAML date-only strings separately from timestamps.
					const frontmatter = z.record(z.string(), z.unknown()).parse(parse(raw, { merge: true }));
					return context.parseData({ ...props, data: { ...props.data, date: frontmatter.date } });
				}
			}
			return context.parseData(props);
		};
		await postFiles.load({ ...context, parseData });
	},
};

const posts = defineCollection({
	loader: freshMarkdownLoader(postsLoader),
	schema: z.object({
		title: z.string(),
		date: z.union([
			z.date(),
			z.string().refine((value) => {
				if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
					const date = new Date(`${value}T00:00:00Z`);
					return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
				}
				return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
					&& !Number.isNaN(new Date(value).getTime());
			}, 'Use a calendar date or an ISO timestamp with an explicit timezone'),
		]).optional(),
		categories: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
	}),
});

const docs = defineCollection({
	loader: freshMarkdownLoader(glob({ base: './src/content/docs', pattern: '**/*.md' })),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		order: z.number().optional(),
		categories: z.array(z.string()).min(1),
		sections: z.array(z.object({ id: z.string(), title: z.string() })).default([]),
	}),
});

export const collections = { posts, docs };
