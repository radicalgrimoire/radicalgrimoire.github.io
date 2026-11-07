const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCalendar, parseDate, occursOnDate, formatEventDate, isFutureEvent, googleCalendarUrl, descriptionParts } = require("../assets/giants-calendar.js");

test("extracts web links without interpreting description text as HTML", () => {
  assert.deepEqual(descriptionParts('詳細： https://www.giants.jp/game/123/\n<script>alert(1)</script>'), [
    { text: '詳細： ' },
    { text: 'https://www.giants.jp/game/123/', href: 'https://www.giants.jp/game/123/' },
    { text: '\n<script>alert(1)</script>' }
  ]);
  assert.deepEqual(descriptionParts('javascript:alert(1)'), [{ text: 'javascript:alert(1)' }]);
});

function calendar(event) {
  return `BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\n${event}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
}

test("parses folded and escaped text and Tokyo local time", () => {
  const [event] = parseCalendar(calendar([
    "SUMMARY:読売ジャイアンツ vs 阪神タイガース",
    " 1回戦",
    "DTSTART;TZID=Asia/Tokyo:20240329T181500",
    "DTEND;TZID=Asia/Tokyo:20240329T211500",
    "LOCATION:東京ドーム\\, 日本",
    "DESCRIPTION:試合結果\\n勝利"
  ].join("\r\n")));
  assert.equal(event.summary, "読売ジャイアンツ vs 阪神タイガース1回戦");
  assert.deepEqual(event.start, { date: "2024-03-29", time: "18:15", second: "00", allDay: false });
  assert.equal(event.location, "東京ドーム, 日本");
  assert.equal(event.description, "試合結果\n勝利");
});

test("converts UTC dates to Tokyo, including crossing midnight", () => {
  assert.deepEqual(parseDate("20260526T090000Z", []), { date: "2026-05-26", time: "18:00", second: "00", allDay: false });
  assert.deepEqual(parseDate("20261231T160000Z", []), { date: "2027-01-01", time: "01:00", second: "00", allDay: false });
});

test("renders all-day and multi-day events with exclusive end dates", () => {
  const [event] = parseCalendar(calendar([
    "SUMMARY:試合",
    "DTSTART;VALUE=DATE:20270326",
    "DTEND;VALUE=DATE:20270328"
  ].join("\r\n")));
  assert.equal(event.start.time, "");
  assert.equal(occursOnDate(event, "2027-03-25"), false);
  assert.equal(occursOnDate(event, "2027-03-26"), true);
  assert.equal(occursOnDate(event, "2027-03-27"), true);
  assert.equal(occursOnDate(event, "2027-03-28"), false);
});

test("excludes midnight end of timed multi-day events", () => {
  const [event] = parseCalendar(calendar([
    "SUMMARY:試合",
    "DTSTART;TZID=Asia/Tokyo:20270326T180000",
    "DTEND;TZID=Asia/Tokyo:20270328T000000"
  ].join("\r\n")));
  assert.equal(occursOnDate(event, "2027-03-27"), true);
  assert.equal(occursOnDate(event, "2027-03-28"), false);
});

test("formats timed and all-day event details", () => {
  const timed = parseCalendar(calendar("SUMMARY:試合\r\nDTSTART:20260526T090000Z\r\nDTEND:20260526T120000Z"))[0];
  assert.equal(formatEventDate(timed), "2026年5月26日（火） 18:00 ～ 21:00（日本時間）");
  const allDay = parseCalendar(calendar("SUMMARY:試合\r\nDTSTART;VALUE=DATE:20270326\r\nDTEND;VALUE=DATE:20270327"))[0];
  assert.equal(formatEventDate(allDay), "2027年3月26日（金） 終日");
  const multipleDays = parseCalendar(calendar("SUMMARY:試合\r\nDTSTART;VALUE=DATE:20270326\r\nDTEND;VALUE=DATE:20270328"))[0];
  assert.equal(formatEventDate(multipleDays), "2027年3月26日（金） ～ 2027年3月27日（土） 終日");
});

test("shows add link only before timed events or on and before all-day dates in Tokyo", () => {
  const timed = parseCalendar(calendar("SUMMARY:試合\r\nDTSTART:20260526T090030Z\r\nDTEND:20260526T120000Z"))[0];
  assert.equal(isFutureEvent(timed, new Date("2026-05-26T09:00:29Z")), true);
  assert.equal(isFutureEvent(timed, new Date("2026-05-26T09:00:30Z")), false);
  const allDay = parseCalendar(calendar("SUMMARY:試合\r\nDTSTART;VALUE=DATE:20270326"))[0];
  assert.equal(isFutureEvent(allDay, new Date("2027-03-26T14:59:59Z")), true);
  assert.equal(isFutureEvent(allDay, new Date("2027-03-26T15:00:00Z")), false);
});

test("builds Google Calendar URLs with dates and escaped event details", () => {
  const timed = parseCalendar(calendar("SUMMARY:試合 & 対戦\r\nDTSTART:20260526T090030Z\r\nDTEND:20260526T120000Z\r\nLOCATION:東京ドーム\\, 日本\r\nDESCRIPTION:詳細\\n2行目"))[0];
  const url = new URL(googleCalendarUrl(timed));
  assert.equal(url.origin + url.pathname, "https://calendar.google.com/calendar/render");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), "試合 & 対戦");
  assert.equal(url.searchParams.get("dates"), "20260526T180030/20260526T210000");
  assert.equal(url.searchParams.get("ctz"), "Asia/Tokyo");
  assert.equal(url.searchParams.get("location"), "東京ドーム, 日本");
  assert.equal(url.searchParams.get("details"), "詳細\n2行目");
  const allDay = parseCalendar(calendar("SUMMARY:試合\r\nDTSTART;VALUE=DATE:20270326\r\nDTEND;VALUE=DATE:20270328"))[0];
  assert.equal(new URL(googleCalendarUrl(allDay)).searchParams.get("dates"), "20270326/20270328");
  const noEnd = parseCalendar(calendar("SUMMARY:試合\r\nDTSTART;VALUE=DATE:20271231"))[0];
  assert.equal(new URL(googleCalendarUrl(noEnd)).searchParams.get("dates"), "20271231/20280101");
});

test("rejects malformed, unsupported and recurring events rather than hiding them", () => {
  assert.throws(() => parseCalendar("not a calendar"), /Invalid calendar/);
  assert.throws(() => parseDate("20260230T180000", []), /Invalid calendar date/);
  assert.throws(() => parseDate("20260526T180000", ["TZID=America/New_York"]), /Unsupported/);
  assert.throws(() => parseCalendar(calendar("SUMMARY:試合\r\nDTSTART;VALUE=DATE:20270326\r\nRRULE:FREQ=DAILY")), /Recurring/);
  assert.throws(() => parseCalendar(calendar("SUMMARY:試合\r\nDTSTART;VALUE=DATE:20270326\r\nDTEND;VALUE=DATE:20270326")), /Invalid calendar event end/);
});
