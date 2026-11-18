(() => {
  const tabs = document.querySelector("[data-home-tabs]");
  const buttons = [...tabs.querySelectorAll("[data-home-tab]")];
  const panels = [...document.querySelectorAll("[data-home-panel]")];

  function activate(button, moveFocus = false) {
    const selected = button.dataset.homeTab;
    for (const tab of buttons) {
      const active = tab === button;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.homePanel !== selected;
    }
    if (moveFocus) button.focus();
  }

  for (const [index, button] of buttons.entries()) {
    button.addEventListener("click", () => activate(button));
    button.addEventListener("keydown", event => {
      let nextIndex;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % buttons.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = buttons.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      activate(buttons[nextIndex], true);
    });
  }
  tabs.hidden = false;
})();
