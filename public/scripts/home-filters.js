(() => {
  const tabs = document.querySelector("[data-home-tabs]");
  const buttons = [...tabs.querySelectorAll("[data-home-tab]")];
  const panels = [...document.querySelectorAll("[data-home-panel]")];
  let touchStart = null;

  function activate(button, moveFocus = false) {
    const selected = button.dataset.homeTab;
    const activeIndex = buttons.findIndex(tab => tab.getAttribute("aria-selected") === "true");
    const nextIndex = buttons.indexOf(button);
    const update = () => {
      for (const tab of buttons) {
        const active = tab === button;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      }
      for (const panel of panels) {
        panel.hidden = panel.dataset.homePanel !== selected;
      }
    };

    if (activeIndex !== nextIndex && typeof document.startViewTransition === "function") {
      document.documentElement.dataset.homeSlideDirection = nextIndex > activeIndex ? "next" : "previous";
      document.startViewTransition(update);
    } else {
      update();
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

  for (const panel of panels) {
    panel.addEventListener("touchstart", event => {
      if (event.touches.length !== 1 || event.target.closest("button, input, select, textarea, dialog, [contenteditable='true']")) {
        touchStart = null;
        return;
      }
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    panel.addEventListener("touchmove", event => {
      if (!touchStart || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;

      const selectedIndex = buttons.findIndex(button => button.getAttribute("aria-selected") === "true");
      const nextIndex = selectedIndex + (deltaX < 0 ? 1 : -1);
      if (nextIndex < 0 || nextIndex >= buttons.length) return;
      if (event.cancelable) event.preventDefault();
      touchStart = null;
      activate(buttons[nextIndex], true);
    }, { passive: false });
    panel.addEventListener("touchend", () => { touchStart = null; }, { passive: true });
    panel.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
  }
  tabs.hidden = false;
})();
