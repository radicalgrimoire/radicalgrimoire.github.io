import { defineHastPlugin, markdownToHast } from 'satteri';
import type { HastContent } from 'satteri';
import type { Element, ElementContent } from 'hast';
import { fetchExternalMarkdown } from './external-markdown.ts';
import { videoUrls } from './videos.ts';

const MAX_MARKDOWN_EMBED_DEPTH = 3;

const socialHosts = {
	x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
	instagram: ['instagram.com', 'www.instagram.com'],
	threads: ['threads.net', 'www.threads.net', 'threads.com', 'www.threads.com'],
};

function element(tagName: string, properties: Element['properties'], children: ElementContent[] = []): Element {
	return { type: 'element', tagName, properties, children };
}

type EmbedResult = { node: HastContent | HastContent[]; social: boolean };

function embed(url: string, label: ElementContent[], depth: number): EmbedResult | Promise<EmbedResult> {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`Invalid embed URL: ${url}`);
	}
	if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) {
		throw new Error(`Unsupported embed URL: ${url}`);
	}

	const link = element('a', { href: url }, label);
	if (parsed.hostname === 'raw.githubusercontent.com' && parsed.pathname.endsWith('.md')) {
		if (depth >= MAX_MARKDOWN_EMBED_DEPTH) {
			throw new Error(`Markdown embed nesting exceeds ${MAX_MARKDOWN_EMBED_DEPTH} levels: ${url}`);
		}
		return fetchExternalMarkdown(url).then((markdown) => markdownToHast(markdown, {
			fileURL: parsed,
			hastPlugins: [createEmbedPlugin(depth + 1)],
		})).then((document) => {
			if (document.type !== 'root') throw new Error(`Unable to render external Markdown: ${url}`);
			const children = document.children.filter((child) => child.type !== 'doctype');
			return { node: children, social: false };
		});
	}

	if (socialHosts.x.includes(parsed.hostname)) {
		return { node: element('blockquote', { className: ['twitter-tweet'] }, [link]), social: true };
	}
	if (socialHosts.instagram.includes(parsed.hostname)) {
		return {
			node: element('blockquote', {
				className: ['instagram-media'],
				dataInstgrmPermalink: url,
				dataInstgrmVersion: '14',
			}, [link]),
			social: true,
		};
	}
	if (socialHosts.threads.includes(parsed.hostname)) {
		return {
			node: element('blockquote', {
				className: ['text-post-media'],
				cite: url,
				dataTextPostPermalink: url,
				dataTextPostVersion: '0',
			}, [link]),
			social: true,
		};
	}

	let video: ReturnType<typeof videoUrls>;
	if (['youtube.com', 'www.youtube.com'].includes(parsed.hostname) && parsed.pathname === '/watch') {
		const ids = parsed.searchParams.getAll('v');
		if (ids.length !== 1) throw new Error(`Invalid YouTube embed URL: ${url}`);
		video = videoUrls('youtube', ids[0]);
	} else if (['nicovideo.jp', 'www.nicovideo.jp'].includes(parsed.hostname) && parsed.pathname.startsWith('/watch/')) {
		video = videoUrls('niconico', parsed.pathname.slice('/watch/'.length));
	} else {
		throw new Error(`Unsupported embed URL: ${url}`);
	}

	return {
		node: element('div', { className: ['video-embed'] }, [
			element('div', { className: ['video-embed-frame'] }, [
				element('iframe', {
					src: video.embed,
					title: video.title,
					loading: 'lazy',
					referrerPolicy: 'strict-origin-when-cross-origin',
					allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
					allowFullScreen: true,
				}),
			]),
			element('p', { className: ['video-embed-link'] }, [link]),
		]),
		social: false,
	};
}

function createEmbedPlugin(depth: number) {
	let hasSocialEmbeds = false;
	return defineHastPlugin({
		name: 'markdown-embeds',
		element: {
			filter: ['a', 'img'],
			visit(node, ctx) {
				if (ctx.fileURL?.hostname === 'raw.githubusercontent.com') {
					const property = node.tagName === 'img' ? 'src' : 'href';
					const value = node.properties[property];
					if (typeof value === 'string') {
						const resolved = new URL(value, ctx.fileURL).href;
						if (resolved !== value) ctx.setProperty(node, property, resolved);
					}
				}
				if (node.tagName !== 'a' || node.properties.title !== 'embed') return;

				const parent = ctx.parent(node);
				if (parent.type !== 'element' || parent.tagName !== 'p' || parent.children.length !== 1) {
					throw new Error(`Embed links must be in a paragraph of their own: ${ctx.fileURL ?? 'Markdown'}`);
				}
				const url = node.properties.href;
				if (typeof url !== 'string') throw new Error(`Embed link has no URL: ${ctx.fileURL ?? 'Markdown'}`);
				const applyEmbed = (result: EmbedResult) => {
					if (result.social) hasSocialEmbeds = true;
					ctx.replaceNode(parent, result.node);
				};
				const wrapError = (error: unknown) => {
					const message = error instanceof Error ? error.message : String(error);
					throw new Error(`Invalid embed in ${ctx.fileURL ?? 'Markdown'}: ${message}`, { cause: error });
				};
				try {
					const result = embed(url, node.children, depth);
					return result instanceof Promise
						? result.then(applyEmbed).catch(wrapError)
						: applyEmbed(result);
				} catch (error) {
					wrapError(error);
				}
			},
		},
		after(root, ctx) {
			if (hasSocialEmbeds) {
				ctx.appendChild(root, element('script', { src: '/scripts/social-embeds.js', defer: true }));
			}
		},
	});
}

export function embedPlugin() {
	return createEmbedPlugin(0);
}
