(() => {
  const filters = document.querySelector("[data-home-filters]");
  const limit = Number(filters.dataset.homeLimit);
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("Invalid home updates limit");
  const buttons = filters.querySelectorAll("[data-home-filter]");
  const items = document.querySelectorAll("[data-home-item]");
  const status = document.querySelector("[data-home-status]");

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const selected = button.dataset.homeFilter;
      let count = 0;
      for (const item of items) {
        const matches = selected === "all" || item.dataset.homeItem === selected;
        item.hidden = !matches || count >= limit;
        if (!item.hidden) count++;
      }
      for (const option of buttons) {
        option.setAttribute("aria-pressed", String(option === button));
      }
      status.textContent = count ? `${button.textContent}の更新を${count}件表示しています。` : "該当する更新はありません。";
    });
  }
  filters.hidden = false;
})();
