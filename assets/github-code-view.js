function parseLineRange(hash, viewId) {
  const match = new RegExp(`^#${viewId}-L(\\d+)(?:-L(\\d+))?$`).exec(hash);
  if (!match) return null;

  const start = Number(match[1]);
  const end = Number(match[2] || match[1]);
  return start <= end ? { start, end } : { start: end, end: start };
}

function updateHighlightedLines() {
  document.querySelectorAll(".github-code-view").forEach((view) => {
    const range = parseLineRange(window.location.hash, view.id);
    view.querySelectorAll(".github-code-view-line").forEach((line) => {
      const lineNumber = Number(line.dataset.line);
      line.classList.toggle("is-highlighted", Boolean(range && lineNumber >= range.start && lineNumber <= range.end));
    });
  });
}

function linkForLineRange(viewId, start, end) {
  return `#${viewId}-L${start}${start === end ? "" : `-L${end}`}`;
}

async function loadCodeView(view) {
  const content = view.querySelector(".github-code-view-content");
  const startLine = Number(view.dataset.startLine || 1);
  const endLine = Number(view.dataset.endLine || 0);

  try {
    const response = await fetch(view.dataset.sourceUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const sourceLines = (await response.text()).replace(/\r\n/g, "\n").split("\n");
    if (sourceLines.at(-1) === "") sourceLines.pop();
    const lastLine = endLine > 0 ? Math.min(endLine, sourceLines.length) : sourceLines.length;
    const fragment = document.createDocumentFragment();
    let selectedStart = null;

    for (let lineNumber = startLine; lineNumber <= lastLine; lineNumber += 1) {
      const line = document.createElement("span");
      const lineLink = document.createElement("a");
      const code = document.createElement("span");

      line.className = "github-code-view-line";
      line.dataset.line = lineNumber;
      lineLink.className = "github-code-view-line-number";
      lineLink.href = linkForLineRange(view.id, lineNumber, lineNumber);
      lineLink.textContent = lineNumber;
      lineLink.setAttribute("aria-label", `${lineNumber}行目へのリンク`);
      code.className = "github-code-view-line-content";
      code.textContent = sourceLines[lineNumber - 1];
      line.append(lineLink, code);
      fragment.append(line);

      lineLink.addEventListener("click", (event) => {
        if (!event.shiftKey || selectedStart === null) {
          selectedStart = lineNumber;
          return;
        }

        event.preventDefault();
        window.location.hash = linkForLineRange(view.id, selectedStart, lineNumber);
        selectedStart = null;
      });
    }

    content.replaceChildren(fragment);
    updateHighlightedLines();
  } catch (error) {
    content.textContent = `Unable to load source (${error.message}).`;
  }
}

document.querySelectorAll(".github-code-view").forEach(loadCodeView);
window.addEventListener("hashchange", updateHighlightedLines);