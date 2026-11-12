const embeds = [
	{ selector: '.twitter-tweet', src: 'https://platform.twitter.com/widgets.js', name: 'X' },
	{ selector: '.instagram-media', src: 'https://www.instagram.com/embed.js', name: 'Instagram' },
	{ selector: '.text-post-media', src: 'https://www.threads.net/embed.js', name: 'Threads' },
];

for (const { selector, src, name } of embeds) {
	if (!document.querySelector(selector)) continue;
	const script = document.createElement('script');
	script.src = src;
	script.async = true;
	script.addEventListener('error', () => console.error(`Failed to load ${name} embed script: ${src}`));
	document.head.append(script);
}
