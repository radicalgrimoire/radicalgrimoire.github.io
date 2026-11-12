export type VideoPlatform = 'youtube' | 'niconico';

export function videoUrls(platform: VideoPlatform, id: string) {
	if (platform === 'youtube') {
		if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error(`Invalid YouTube video ID: ${id}`);
		return {
			embed: `https://www.youtube-nocookie.com/embed/${id}`,
			watch: `https://www.youtube.com/watch?v=${id}`,
			title: `YouTube動画：${id}`,
			linkText: 'YouTubeで動画を見る',
		};
	}

	if (platform === 'niconico') {
		if (!/^(?:(?:sm|nm|so)\d+|\d{10})$/.test(id)) throw new Error(`Invalid Niconico video ID: ${id}`);
		return {
			embed: `https://embed.nicovideo.jp/watch/${id}`,
			watch: `https://www.nicovideo.jp/watch/${id}`,
			title: `ニコニコ動画：${id}`,
			linkText: 'ニコニコ動画で動画を見る',
		};
	}

	throw new Error(`Unsupported video platform: ${platform}`);
}
