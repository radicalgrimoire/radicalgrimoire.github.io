(function () {
  "use strict";

  const source = "https://raw.githubusercontent.com/radicalgrimoire/giants-calendar/main/giants.ics";
  const tokyoParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });

  function dateParts(date) {
    return Object.fromEntries(tokyoParts.formatToParts(date).map(part => [part.type, part.value]));
  }

  function parseDate(value, parameters) {
    const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value);
    if (!match) throw new Error("Unsupported calendar date: " + value);
    const [, year, month, day, hour, minute, second, utc] = match;
    const allDay = !hour;
    if ((parameters.includes("VALUE=DATE") && !allDay) ||
        (parameters.some(p => p.startsWith("TZID=") && p !== "TZID=Asia/Tokyo")) ||
        (allDay && parameters.some(p => p.startsWith("TZID="))) ||
        (utc && parameters.some(p => p.startsWith("TZID=")))) {
      throw new Error("Unsupported calendar date parameters");
    }
    const check = new Date(Date.UTC(+year, +month - 1, +day, +(hour || 0), +(minute || 0), +(second || 0)));
    if (check.getUTCFullYear() !== +year || check.getUTCMonth() !== +month - 1 ||
        check.getUTCDate() !== +day || check.getUTCHours() !== +(hour || 0) ||
        check.getUTCMinutes() !== +(minute || 0) || check.getUTCSeconds() !== +(second || 0)) {
      throw new Error("Invalid calendar date: " + value);
    }
    if (allDay) return { date: `${year}-${month}-${day}`, time: "", allDay: true };
    const instant = new Date(check.getTime() - (utc ? 0 : 9 * 60 * 60 * 1000));
    const parts = dateParts(instant);
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, second: parts.second, allDay: false };
  }

  function unescapeText(value) {
    return value.replace(/\\([nN,;\\])/g, (_, character) =>
      character === "n" || character === "N" ? "\n" : character);
  }

  function descriptionParts(text) {
    const parts = [];
    const pattern = /https?:\/\/[^\s<>"']+/g;
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      if (match.index > last) parts.push({ text: text.slice(last, match.index) });
      parts.push({ text: match[0], href: match[0] });
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ text: text.slice(last) });
    return parts;
  }

  function parseCalendar(text) {
    const lines = text.replace(/\r\n[ \t]|\n[ \t]/g, "").split(/\r?\n/);
    if (!lines.includes("BEGIN:VCALENDAR") || !lines.includes("END:VCALENDAR")) {
      throw new Error("Invalid calendar data");
    }
    const events = [];
    let event = null;
    for (const line of lines) {
      if (line === "BEGIN:VEVENT") {
        if (event) throw new Error("Nested calendar event");
        event = {};
      } else if (line === "END:VEVENT") {
        if (!event || !event.start || !event.summary) throw new Error("Incomplete calendar event");
        if (event.end && (event.start.allDay !== event.end.allDay ||
            `${event.end.date}T${event.end.time}:${event.end.second || ""}` <= `${event.start.date}T${event.start.time}:${event.start.second || ""}`)) {
          throw new Error("Invalid calendar event end");
        }
        events.push(event);
        event = null;
      } else if (event) {
        const separator = line.indexOf(":");
        if (separator < 0) throw new Error("Invalid calendar property");
        const [name, ...parameters] = line.slice(0, separator).split(";");
        const value = line.slice(separator + 1);
        if (["RRULE", "RDATE", "EXDATE", "RECURRENCE-ID"].includes(name)) {
          throw new Error("Recurring events are not supported");
        }
        if (name === "DTSTART") event.start = parseDate(value, parameters);
        if (name === "DTEND") event.end = parseDate(value, parameters);
        if (name === "SUMMARY") event.summary = unescapeText(value);
        if (name === "DESCRIPTION") event.description = unescapeText(value);
        if (name === "LOCATION") event.location = unescapeText(value);
        if (name === "STATUS") event.status = value;
      }
    }
    if (event) throw new Error("Unterminated calendar event");
    return events.sort((a, b) => a.start.date.localeCompare(b.start.date) ||
      a.start.time.localeCompare(b.start.time) || (a.start.second || "").localeCompare(b.start.second || "") ||
      a.summary.localeCompare(b.summary, "ja"));
  }

  function occursOnDate(event, date) {
    if (event.start.date > date) return false;
    if (event.start.date === date) return true;
    return !!event.end && (event.end.date > date ||
      (event.end.date === date && !event.end.allDay && (event.end.time !== "00:00" || event.end.second !== "00")));
  }

  function isFutureEvent(event, now) {
    if (event.start.allDay) {
      const current = dateParts(now);
      return event.start.date >= `${current.year}-${current.month}-${current.day}`;
    }
    return new Date(`${event.start.date}T${event.start.time}:${event.start.second}+09:00`) > now;
  }

  function googleCalendarUrl(event) {
    function googleDate(value) {
      const date = value.date.replaceAll("-", "");
      return value.allDay ? date : `${date}T${value.time.replace(":", "")}${value.second}`;
    }
    let end = event.end;
    if (!end && event.start.allDay) {
      const nextDay = new Date(`${event.start.date}T00:00:00Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      end = { date: nextDay.toISOString().slice(0, 10), allDay: true };
    }
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: (event.status === "CANCELLED" ? "【中止】" : "") + event.summary,
      dates: `${googleDate(event.start)}/${googleDate(end || event.start)}`,
      ctz: "Asia/Tokyo"
    });
    if (event.description) params.set("details", event.description);
    if (event.location) params.set("location", event.location);
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  function formatEventDate(event) {
    function formatDate(value) {
      const [year, month, day] = value.split("-").map(Number);
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      return `${year}年${month}月${day}日（${["日", "月", "火", "水", "木", "金", "土"][weekday]}）`;
    }

    const start = formatDate(event.start.date);
    if (event.start.allDay) {
      if (!event.end) return `${start} 終日`;
      const endDate = new Date(`${event.end.date}T00:00:00Z`);
      endDate.setUTCDate(endDate.getUTCDate() - 1);
      const end = endDate.toISOString().slice(0, 10);
      return end === event.start.date ? `${start} 終日` : `${start} ～ ${formatDate(end)} 終日`;
    }
    let result = `${start} ${event.start.time}`;
    if (event.end) {
      result += event.end.date === event.start.date
        ? ` ～ ${event.end.time}`
        : ` ～ ${formatDate(event.end.date)} ${event.end.time}`;
    }
    return `${result}（日本時間）`;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseCalendar, parseDate, occursOnDate, formatEventDate, isFutureEvent, googleCalendarUrl, descriptionParts };
  }
  if (typeof document === "undefined") return;

  const root = document.getElementById("giants-calendar");
  if (!root) return;
  const heading = root.querySelector("#giants-calendar-month");
  const status = root.querySelector(".giants-calendar-status");
  const grid = root.querySelector(".giants-calendar-grid");
  const dialog = root.querySelector(".giants-calendar-dialog");
  const eventTitle = root.querySelector("#giants-event-title");
  const eventDate = root.querySelector("#giants-event-date");
  const eventLocation = root.querySelector("#giants-event-location");
  const eventDescription = root.querySelector("#giants-event-description");
  const locationRow = root.querySelector("#giants-event-location-row");
  const descriptionRow = root.querySelector("#giants-event-description-row");
  const eventAdd = root.querySelector("#giants-event-add");
  const today = dateParts(new Date());
  let year = Number(today.year);
  let month = Number(today.month) - 1;
  let events = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showEvent(event) {
    eventTitle.textContent = (event.status === "CANCELLED" ? "【中止】" : "") + event.summary;
    eventDate.textContent = formatEventDate(event);
    eventLocation.textContent = event.location || "";
    eventDescription.replaceChildren();
    for (const part of descriptionParts(event.description || "")) {
      if (!part.href) {
        eventDescription.append(document.createTextNode(part.text));
      } else {
        const link = document.createElement("a");
        link.textContent = part.text;
        link.href = part.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        eventDescription.append(link);
      }
    }
    locationRow.hidden = !event.location;
    descriptionRow.hidden = !event.description;
    eventAdd.hidden = !isFutureEvent(event, new Date());
    if (!eventAdd.hidden) eventAdd.href = googleCalendarUrl(event);
    else eventAdd.removeAttribute("href");
    dialog.showModal();
  }

  root.querySelector(".giants-calendar-dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  function render() {
    heading.textContent = `${year}年 ${month + 1}月`;
    grid.replaceChildren();
    if (!events) return;

    const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const dates = Array.from({ length: days }, (_, index) => prefix + String(index + 1).padStart(2, "0"));
    const monthEvents = events.filter(event => dates.some(date => occursOnDate(event, date)));
    status.textContent = monthEvents.length ? `${monthEvents.length}件の予定 · 時刻は日本時間` : "この月の予定はありません。";
    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    for (let i = 0; i < firstDay; i++) {
      const empty = element("div", "giants-calendar-empty");
      empty.setAttribute("aria-hidden", "true");
      grid.append(empty);
    }
    for (let day = 1; day <= days; day++) {
      const date = prefix + String(day).padStart(2, "0");
      const dayEvents = monthEvents.filter(event => occursOnDate(event, date));
      const cell = element("section", "giants-calendar-day" + (dayEvents.length ? " has-events" : ""));
      cell.setAttribute("aria-label", `${month + 1}月${day}日`);
      const dayHeading = element("div", "giants-calendar-day-number");
      const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
      dayHeading.textContent = `${day}`;
      const mobileDay = element("span", "giants-calendar-mobile-day", ` (${["日", "月", "火", "水", "木", "金", "土"][weekday]})`);
      dayHeading.append(mobileDay);
      cell.append(dayHeading);
      for (const event of dayEvents) {
        const button = element("button", "giants-calendar-event");
        button.type = "button";
        button.append(element("span", "giants-calendar-event-time",
          event.start.date !== date ? "継続" : event.start.time || "終日"));
        button.append(element("span", "giants-calendar-event-title",
          (event.status === "CANCELLED" ? "【中止】" : "") + event.summary));
        button.addEventListener("click", () => showEvent(event));
        cell.append(button);
      }
      grid.append(cell);
    }
  }

  root.querySelectorAll("[data-calendar-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.calendarAction;
      if (action === "today") {
        const current = dateParts(new Date());
        year = Number(current.year);
        month = Number(current.month) - 1;
      } else {
        const target = new Date(Date.UTC(year, month + (action === "next" ? 1 : -1), 1));
        year = target.getUTCFullYear();
        month = target.getUTCMonth();
      }
      render();
    });
  });
  render();
  fetch(source)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(text => {
      events = parseCalendar(text);
      render();
    })
    .catch(error => {
      console.error("Giants Calendar: failed to load calendar data", error);
      status.textContent = "日程を読み込めませんでした。時間をおいて再読み込みしてください。";
    });
}());
