---
title: "Giants Calendar"
permalink: "/giants-calendar/"
layout: page
lang: ja
---

<link rel="stylesheet" href="{{ '/assets/css/giants-calendar.css' | relative_url }}">

<div class="giants-calendar" id="giants-calendar">
  <div class="giants-calendar-intro">
    <span class="giants-calendar-eyebrow">GIANTS SCHEDULE</span>
    <p>読売ジャイアンツの試合日程。予定は ICS データから読み込んでいます。</p>
    <a href="https://raw.githubusercontent.com/radicalgrimoire/giants-calendar/main/giants.ics">ICS データを見る</a>
  </div>

  <div class="giants-calendar-toolbar">
    <div>
      <span class="giants-calendar-label">SCHEDULE</span>
      <h2 id="giants-calendar-month"></h2>
    </div>
    <div class="giants-calendar-controls" aria-label="月の移動">
      <button type="button" data-calendar-action="previous" aria-label="前の月">‹</button>
      <button type="button" data-calendar-action="today">今月</button>
      <button type="button" data-calendar-action="next" aria-label="次の月">›</button>
    </div>
  </div>

  <p class="giants-calendar-status" role="status" aria-live="polite">日程を読み込んでいます…</p>
  <div class="giants-calendar-weekdays" aria-hidden="true">
    <span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span>
  </div>
  <div class="giants-calendar-grid"></div>
  <dialog class="giants-calendar-dialog" aria-labelledby="giants-event-title">
    <div class="giants-calendar-dialog-header">
      <span class="giants-calendar-dialog-label">GAME DETAILS</span>
      <button type="button" class="giants-calendar-dialog-close" aria-label="閉じる" autofocus>×</button>
    </div>
    <h2 id="giants-event-title"></h2>
    <dl class="giants-calendar-dialog-details">
      <div>
        <dt>日時</dt>
        <dd id="giants-event-date"></dd>
      </div>
      <div id="giants-event-location-row">
        <dt>場所</dt>
        <dd id="giants-event-location"></dd>
      </div>
      <div id="giants-event-description-row">
        <dt>詳細</dt>
        <dd id="giants-event-description"></dd>
      </div>
    </dl>
    <a class="giants-calendar-add" id="giants-event-add" href="https://calendar.google.com/calendar/render" target="_blank" rel="noopener noreferrer" aria-label="Google カレンダーに追加（新しいタブで開く）" hidden>
      <i class="bi bi-calendar-plus" aria-hidden="true"></i> Google カレンダーに追加
    </a>
  </dialog>
  <noscript><p>日程の表示には JavaScript が必要です。上のリンクから ICS データを確認できます。</p></noscript>
</div>
<script defer src="{{ '/assets/giants-calendar.js' | relative_url }}"></script>
