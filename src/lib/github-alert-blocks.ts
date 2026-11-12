import { defineHastPlugin } from 'satteri';
import type { Element, ElementContent } from 'hast';

const alertPattern = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?=\r?\n|$)/i;

function element(tagName: string, properties: Element['properties'], children: ElementContent[] = []): Element {
	return { type: 'element', tagName, properties, children };
}

export function githubAlertPlugin() {
	let hasAlerts = false;
	return defineHastPlugin({
		name: 'github-alert-blocks',
		element: {
			filter: ['blockquote'],
			visit(node, ctx) {
				let parent = ctx.parent(node);
				while (parent?.type === 'element') {
					if (parent.tagName === 'blockquote') return;
					parent = ctx.parent(parent);
				}

				const paragraph = node.children.find((child) => child.type === 'element');
				if (paragraph?.type !== 'element' || paragraph.tagName !== 'p') return;
				if (!alertPattern.test(ctx.textContent(paragraph))) return;
				hasAlerts = true;
			},
		},
		after(root, ctx) {
			if (hasAlerts) {
				ctx.appendChild(root, element('script', { src: '/scripts/github-alert-blocks.js', defer: true }));
			}
		},
	});
}
