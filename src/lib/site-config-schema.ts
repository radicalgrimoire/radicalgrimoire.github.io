import { parse } from 'yaml';
import { z } from 'zod';

const text = z.string().trim().min(1);
const icon = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const url = text.refine((value) => {
	if (value.startsWith('/') && !value.startsWith('//')) return true;
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
	} catch {
		return false;
	}
}, 'Use an absolute site path or an HTTPS URL');
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color');
const palette = z.strictObject({
	accent: color,
	label_background: color,
	label_text: color,
});
const navigationLink = z.strictObject({
	title: text,
	url,
	icon,
	mobile_icon: icon.optional(),
	description: text.optional(),
	section: z.enum(['posts', 'documents']).optional(),
});
const navigationGroup = z.strictObject({
	title: text,
	children: z.array(navigationLink).min(1),
});

export const siteConfigSchema = z.strictObject({
	title: text,
	title_accent: text.optional(),
	author: text,
	description: text,
	timezone: text,
	lang: text,
	latest_notes_count: z.number().int().positive(),
	category_colors: z.strictObject({
		fallback: palette,
		categories: z.array(z.strictObject({ name: text, ...palette.shape })),
	}),
	navigation: z.array(z.union([navigationLink, navigationGroup])),
	external: z.array(z.strictObject({ title: text, icon, url })),
}).superRefine((config, ctx) => {
	if (config.title_accent && !config.title.endsWith(config.title_accent)) {
		ctx.addIssue({ code: 'custom', path: ['title_accent'], message: 'Must be a suffix of title' });
	}
	try {
		new Intl.DateTimeFormat('en', { timeZone: config.timezone });
	} catch {
		ctx.addIssue({ code: 'custom', path: ['timezone'], message: 'Invalid IANA timezone' });
	}
	try {
		Intl.getCanonicalLocales(config.lang);
	} catch {
		ctx.addIssue({ code: 'custom', path: ['lang'], message: 'Invalid language tag' });
	}
	const names = config.category_colors.categories.map((category) => category.name);
	if (new Set(names).size !== names.length) {
		ctx.addIssue({ code: 'custom', path: ['category_colors', 'categories'], message: 'Category names must be unique' });
	}
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type NavigationLink = z.infer<typeof navigationLink>;

export function parseSiteConfig(source: string): SiteConfig {
	try {
		return siteConfigSchema.parse(parse(source));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid site.config.yml: ${message}`, { cause: error });
	}
}

export function categoryColorsCss(config: SiteConfig): string {
	const palettes = [config.category_colors.fallback, ...config.category_colors.categories];
	return palettes.map((colors, index) => {
		const name = index === 0 ? 'other' : `configured-${index - 1}`;
		return `.archive-color-${name}{--archive-accent:${colors.accent};--archive-label-background:${colors.label_background};--archive-label-color:${colors.label_text}}`;
	}).join('');
}

export function categoryColor(categories: string[], config: SiteConfig): string {
	const index = config.category_colors.categories.findIndex((category) => categories.includes(category.name));
	return index === -1 ? 'other' : `configured-${index}`;
}
