import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const script = readFileSync('public/scripts/giants-calendar.js', 'utf8');
const context = { module: { exports: {} }, Intl, Date, URLSearchParams };
runInNewContext(script, context);
const { parseCalendar, parseDate, occursOnDate, isFutureEvent, googleCalendarUrl, descriptionParts } = context.module.exports;

const calendar = [
	'BEGIN:VCALENDAR',
	'BEGIN:VEVENT',
	'DTSTART;TZID=Asia/Tokyo:20270402T180000',
	'DTEND;TZID=Asia/Tokyo:20270402T210000',
	'SUMMARY:Giants vs Tigers',
	'LOCATION:Tokyo Dome',
	'DESCRIPTION:Details\\nhttps://example.com/game',
	'STATUS:CANCELLED',
	'END:VEVENT',
	'BEGIN:VEVENT',
	'DTSTART;VALUE=DATE:20270403',
	'DTEND;VALUE=DATE:20270405',
	'SUMMARY:All-day',
	'END:VEVENT',
	'END:VCALENDAR',
].join('\r\n');

test('calendar parses timed and all-day events and their dates', () => {
	const events = parseCalendar(calendar);
	assert.equal(events.length, 2);
	assert.equal(events[0].summary, 'Giants vs Tigers');
	assert.equal(events[0].start.date, '2027-04-02');
	assert.equal(events[0].start.time, '18:00');
	assert.equal(events[0].description, 'Details\nhttps://example.com/game');
	assert.equal(events[1].start.allDay, true);
	assert.equal(occursOnDate(events[1], '2027-04-04'), true);
	assert.equal(occursOnDate(events[1], '2027-04-05'), false);
	assert.equal(parseDate('20270402T090000Z', []).time, '18:00');
});

test('future events generate Google Calendar links and descriptions retain safe links', () => {
	const [event] = parseCalendar(calendar);
	assert.equal(isFutureEvent(event, new Date('2027-04-01T00:00:00Z')), true);
	assert.equal(isFutureEvent(event, new Date('2027-04-03T00:00:00Z')), false);
	const url = new URL(googleCalendarUrl(event));
	assert.equal(url.origin, 'https://calendar.google.com');
	assert.equal(url.searchParams.get('text'), '【中止】Giants vs Tigers');
	assert.equal(url.searchParams.get('dates'), '20270402T180000/20270402T210000');
	assert.equal(url.searchParams.get('location'), 'Tokyo Dome');
	assert.equal(descriptionParts('Open https://example.com/game')[1].href, 'https://example.com/game');
	assert.equal(descriptionParts('javascript:alert(1)')[0].href, undefined);
});

test('unsupported or invalid calendar data fails explicitly', () => {
	assert.throws(() => parseCalendar('not a calendar'), /Invalid calendar data/);
	assert.throws(() => parseDate('20270230', []), /Invalid calendar date/);
	assert.throws(() => parseDate('20270402T180000', ['TZID=America/New_York']), /Unsupported/);
	assert.throws(() => parseCalendar(calendar.replace('STATUS:CANCELLED', 'RRULE:FREQ=DAILY')), /Recurring events/);
	assert.throws(() => parseCalendar(calendar.replace('DTEND;TZID=Asia/Tokyo:20270402T210000', 'DTEND;TZID=Asia/Tokyo:20270402T170000')), /Invalid calendar event end/);
});

test('built calendar page includes controls, fallback and client script', () => {
	const html = readFileSync('dist/giants-calendar/index.html', 'utf8');
	for (const expected of [
		'<title>Giants Calendar | GadgetLogs</title>',
		'id="giants-calendar"',
		'data-calendar-action="previous"',
		'data-calendar-action="today"',
		'data-calendar-action="next"',
		'class="giants-calendar-dialog"',
		'id="giants-event-add"',
		'日程の表示には JavaScript が必要です。',
		'src="/scripts/giants-calendar.js"',
	]) assert.ok(html.includes(expected), `Missing calendar element: ${expected}`);
});
