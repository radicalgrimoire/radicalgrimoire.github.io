(() => {
  const reader = document.querySelector("[data-archive-reader]");
  const content = document.querySelector("[data-archive-reader-content]");
  const directLink = document.querySelector("[data-archive-reader-link]");
  const closeButton = document.querySelector("[data-archive-reader-close]");
  const heading = document.querySelector(".archive-page h1");
  const links = document.querySelectorAll(".archive-card-link");
  let selectedLink = null;
  let frame = null;

  for (const link of links) {
    link.setAttribute("aria-controls", reader.id);
    link.setAttribute("aria-expanded", "false");
  }

  function clearSelection() {
    if (!selectedLink) return;
    selectedLink.classList.remove("is-previewing");
    selectedLink.setAttribute("aria-expanded", "false");
  }

  function closeReader() {
    if (reader.hidden) return;
    reader.hidden = true;
    content.replaceChildren();
    frame = null;
    const focusTarget = selectedLink && selectedLink.getClientRects().length ? selectedLink : heading;
    clearSelection();
    focusTarget.focus();
    selectedLink = null;
  }

  document.querySelector(".archive-grid").addEventListener("click", (event) => {
    const link = event.target.closest(".archive-card-link");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    clearSelection();
    selectedLink = link;
    link.classList.add("is-previewing");
    link.setAttribute("aria-expanded", "true");
    directLink.href = url.href;
    url.searchParams.set("archive_preview", "1");
    frame = document.createElement("iframe");
    frame.title = `${link.querySelector(".archive-card-title").textContent} - 記事プレビュー`;
    frame.src = url.href;
    content.replaceChildren(frame);
    reader.hidden = false;
    closeButton.focus();
  });

  closeButton.addEventListener("click", closeReader);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if ("showPopover" in HTMLElement.prototype && document.querySelector("[data-archive-filters]:popover-open")) return;
    closeReader();
  });
  window.addEventListener("message", (event) => {
    if (frame && event.origin === window.location.origin && event.source === frame.contentWindow && event.data === "archive-preview-close") closeReader();
  });
})();
