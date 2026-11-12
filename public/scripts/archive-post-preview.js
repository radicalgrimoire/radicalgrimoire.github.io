(() => {
  if (!document.documentElement.classList.contains("archive-preview")) return;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      window.parent.postMessage("archive-preview-close", window.location.origin);
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || link.hasAttribute("target") || link.hasAttribute("download") || link.hasAttribute("data-lightbox")) return;
    const destination = new URL(link.href, window.location.href);
    const current = new URL(window.location.href);
    current.searchParams.delete("archive_preview");
    destination.searchParams.delete("archive_preview");
    if (destination.origin === current.origin && destination.pathname === current.pathname && destination.search === current.search && destination.hash) return;
    link.target = "_top";
  });
})();
