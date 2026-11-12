export interface DatedEntry {
	id: string;
	data: { date?: Date | string };
}

export function postDate(entry: DatedEntry): Date {
	if (entry.data.date) {
		const date = new Date(entry.data.date);
		if (Number.isNaN(date.getTime())) throw new Error(`Invalid date in post "${entry.id}"`);
		return date;
	}

	const match = entry.id.match(/^(\d{4}-\d{2}-\d{2})(?:-|$)/);
	if (!match) throw new Error(`Post "${entry.id}" needs a date or a dated filename`);
	const date = new Date(`${match[1]}T00:00:00Z`);
	if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) {
		throw new Error(`Invalid date in post filename "${entry.id}"`);
	}
	return date;
}

export function dateParts(entry: DatedEntry, timezone: string) {
	const value = entry.data.date;
	const dateOnly = !value || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));
	const date = postDate(entry);
	const timeZone = dateOnly ? 'UTC' : timezone;
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
	}).formatToParts(date);
	const get = (type: Intl.DateTimeFormatPartTypes) => {
		const part = parts.find((value) => value.type === type);
		if (!part) throw new Error(`Missing ${type} in formatted date for "${entry.id}"`);
		return part.value;
	};
	return {
		year: get('year'),
		month: get('month'),
		day: get('day'),
		monthName: new Intl.DateTimeFormat('en-US', { timeZone, month: 'short' }).format(date),
	};
}

export function postUrl(entry: DatedEntry): string {
	const match = entry.id.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
	if (!match) throw new Error(`Post "${entry.id}" needs a dated filename`);
	const { year, month, day } = dateParts(entry, 'Asia/Tokyo');
	return `/${year}${month}${day}-${match[1]}/`;
}
