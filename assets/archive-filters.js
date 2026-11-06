(() => {
  const filterPanels = document.querySelectorAll("[data-archive-filters]");
  const status = document.querySelector("[data-filter-status]");
  const posts = Array.from(document.querySelectorAll("[data-archive-post]"), (element) => ({
    element,
    categories: JSON.parse(element.dataset.categories),
    tags: JSON.parse(element.dataset.tags)
  }));
  const groups = document.querySelectorAll(".archive-year-group");

  function render() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const tag = params.get("tag");
    let visibleCount = 0;

    for (const post of posts) {
      const visible = (!category || post.categories.includes(category)) &&
        (!tag || post.tags.includes(tag));
      post.element.hidden = !visible;
      if (visible) visibleCount++;
    }

    for (const group of groups) {
      group.hidden = !group.querySelector("[data-archive-post]:not([hidden])");
    }

    for (const button of document.querySelectorAll("[data-filter-type]")) {
      const selected = button.dataset.filterType === "category" ? category : tag;
      button.setAttribute("aria-pressed", String(button.dataset.filterValue === selected));
    }

    const activeFilters = [category, tag].filter(Boolean);
    status.hidden = activeFilters.length === 0;
    status.textContent = activeFilters.length
      ? `${activeFilters.join(" / ")}: ${visibleCount}件`
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
    window.history.pushState(null, "", url);
    render();
  }

  for (const panel of filterPanels) {
    panel.addEventListener("click", (event) => {
      const option = event.target.closest("[data-filter-type]");
      if (option && panel.contains(option)) {
        setFilter(option.dataset.filterType, option.dataset.filterValue);
      } else if (event.target.closest("[data-filter-clear]")) {
        setFilter(null);
      }
    });
    panel.hidden = false;
  }

  window.addEventListener("popstate", render);
  render();
})();
