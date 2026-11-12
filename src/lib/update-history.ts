import { execFileSync } from 'node:child_process';

export function contentUpdateHistory(cwd = process.cwd()): Map<string, Date> {
	const git = (...args: string[]) => execFileSync('git', args, {
		cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
	});

	if (git('rev-parse', '--is-shallow-repository').trim() !== 'false') {
		throw new Error('Full Git history is required to determine content updates');
	}

	const history = git(
		'log', '--format=format:%x00%ct%x00', '--name-only', '-z', '--no-renames',
		'--diff-filter=AMT', '--', 'src/content/posts', 'src/content/docs',
	);
	const updates = new Map<string, Date>();
	let date: Date | undefined;
	for (const token of history.split('\0')) {
		if (!token) continue;
		if (/^\d+$/.test(token)) {
			date = new Date(Number(token) * 1000);
			if (Number.isNaN(date.getTime())) throw new Error(`Invalid Git commit timestamp: ${token}`);
			continue;
		}
		const path = token.startsWith('\n') ? token.slice(1) : token;
		if (!date) throw new Error(`Missing Git commit timestamp for ${path}`);
		if (!updates.has(path)) updates.set(path, date);
	}
	return updates;
}
