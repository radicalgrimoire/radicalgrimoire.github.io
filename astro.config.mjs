// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';
import { githubAlertPlugin } from './src/lib/github-alert-blocks.ts';
import { embedPlugin } from './src/lib/markdown-embeds.ts';

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	markdown: {
		processor: satteri({ hastPlugins: [embedPlugin, githubAlertPlugin] }),
	},
});
