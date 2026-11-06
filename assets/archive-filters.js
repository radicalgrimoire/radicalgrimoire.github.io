(() => {
  const filterPanels = document.querySelectorAll("[data-archive-filters]");
  const status = document.querySelector("[data-filter-status]");
  const posts = Array.from(document.querySelectorAll("[data-archive-post]"), (element) => ({
    element,
    categories: JSON.parse(element.dataset.categories),
    tags: JSON.parse(element.dataset.tags),
    year: element.dataset.year
  }));
  const years = document.querySelector("[data-archive-years]");
  const pagination = document.querySelector("[data-archive-pagination]");
  const pageLabel = document.querySelector("[data-archive-page]");
  const previous = document.querySelector("[data-archive-previous]");
  const next = document.querySelector("[data-archive-next]");
  const filterTriggers = document.querySelectorAll("[data-filter-trigger]");
  const pageSize = 16;

  function render() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const tag = params.get("tag");
    const matches = posts.filter((post) =>
      (!category || post.categories.includes(category)) &&
      (!tag || post.tags.includes(tag))
    );
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    const pageParam = params.get("page");
    const requestedPage = pageParam && /^[1-9]\d*$/.test(pageParam) ? Number(pageParam) : 1;
    const page = Number.isSafeInteger(requestedPage) ? Math.min(requestedPage, totalPages) : 1;
    const visiblePosts = matches.slice((page - 1) * pageSize, page * pageSize);
    const visibleElements = new Set(visiblePosts.map((post) => post.element));

    for (const post of posts) {
      post.element.hidden = !visibleElements.has(post.element);
    }

    const visibleYears = [...new Set(visiblePosts.map((post) => post.year))];
    years.textContent = visibleYears.length > 1
      ? `${visibleYears[0]} – ${visibleYears[visibleYears.length - 1]}`
      : visibleYears[0] || "No results";
    pagination.hidden = matches.length <= pageSize;
    previous.disabled = page === 1;
    next.disabled = page === totalPages;
    pageLabel.textContent = `${page} / ${totalPages}`;

    for (const button of document.querySelectorAll("[data-filter-type]")) {
      const selected = button.dataset.filterType === "category" ? category : tag;
      button.setAttribute("aria-pressed", String(button.dataset.filterValue === selected));
    }

    const activeFilters = [category, tag].filter(Boolean);
    for (const trigger of filterTriggers) {
      const selected = trigger.dataset.filterTrigger === "category" ? category : tag;
      trigger.querySelector("[data-filter-count]").textContent = selected ? "(1)" : "";
    }
    status.hidden = activeFilters.length === 0;
    status.textContent = activeFilters.length
      ? `${activeFilters.join(" / ")}: ${matches.length}件`
      : "";
  }

  function setFilter(type, value) {
    const url = new URL(window.location.href);
    if (type === null) {
      url.searchParams.delete("category");
      url.searchParams.delete("tag");
    } else if (url.searchParams.get(type) === value) {
      url.searchParams.delete(type);
    } else {
      url.searchParams.set(type, value);
    }
    url.searchParams.delete("page");
    window.history.pushState(null, "", url);
    render();
  }

  function changePage(direction) {
    const url = new URL(window.location.href);
    const currentPage = Number(pageLabel.textContent.split(" / ")[0]);
    url.searchParams.set("page", String(currentPage + direction));
    window.history.pushState(null, "", url);
    render();
    document.querySelector(".archive-page").scrollIntoView();
  }

  const supportsPopover = "showPopover" in HTMLElement.prototype;
  for (const panel of filterPanels) {
    panel.addEventListener("click", (event) => {
      const option = event.target.closest("[data-filter-type]");
      if (option && panel.contains(option)) {
        setFilter(option.dataset.filterType, option.dataset.filterValue);
      } else if (event.target.closest("[data-filter-clear]")) {
        setFilter(null);
      }
    });
    if (!supportsPopover) panel.removeAttribute("popover");
    panel.hidden = false;
  }

  if (supportsPopover) {
    for (const trigger of filterTriggers) trigger.hidden = false;
  }
  previous.addEventListener("click", () => changePage(-1));
  next.addEventListener("click", () => changePage(1));
  window.addEventListener("popstate", render);
  render();
})();
