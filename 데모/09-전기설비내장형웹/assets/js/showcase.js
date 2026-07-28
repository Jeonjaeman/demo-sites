(() => {
  "use strict";

  const segmentGroups = document.querySelectorAll(".segmented");
  segmentGroups.forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button:not(:disabled)");
      if (!button) return;

      group.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
    });
  });

  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest(".toast button");
    if (!closeButton) return;
    closeButton.closest(".toast")?.remove();
  });
})();

