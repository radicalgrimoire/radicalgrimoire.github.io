const MAX_MARKDOWN_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;

function sourceUrl(value: string): URL {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`Invalid external Markdown URL: ${value}`);
	}

	if (url.protocol !== 'https:' || url.hostname !== 'raw.githubusercontent.com'
		|| url.username || url.password || url.port || !url.pathname.endsWith('.md')) {
		throw new Error(`Unsupported external Markdown URL: ${value}`);
	}

	return url;
}

export async function fetchExternalMarkdown(value: string): Promise<string> {
	const url = sourceUrl(value);
	const response = await fetch(url, {
		redirect: 'error',
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});

	if (!response.ok) {
		throw new Error(`External Markdown request failed with HTTP ${response.status}: ${url}`);
	}

	const contentLength = Number(response.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > MAX_MARKDOWN_BYTES) {
		throw new Error(`External Markdown exceeds ${MAX_MARKDOWN_BYTES} bytes: ${url}`);
	}
	if (!response.body) throw new Error(`External Markdown response has no body: ${url}`);

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	while (true) {
		const { done, value: chunk } = await reader.read();
		if (done) break;
		size += chunk.byteLength;
		if (size > MAX_MARKDOWN_BYTES) {
			await reader.cancel();
			throw new Error(`External Markdown exceeds ${MAX_MARKDOWN_BYTES} bytes: ${url}`);
		}
		chunks.push(chunk);
	}

	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
	} catch (error) {
		throw new Error(`External Markdown is not valid UTF-8: ${url}`, { cause: error });
	}
}
