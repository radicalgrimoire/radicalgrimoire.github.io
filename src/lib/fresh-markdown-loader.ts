import type { Loader } from 'astro/loaders';

export function freshMarkdownLoader(loader: Loader): Loader {
	return {
		...loader,
		async load(context) {
			// Embedded external Markdown can change even when the local file has not.
			for (const entry of context.store.values()) {
				context.store.set({ ...entry, digest: undefined });
			}
			await loader.load(context);
		},
	};
}
