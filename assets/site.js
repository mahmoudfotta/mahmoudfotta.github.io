(() => {
  document.getElementById("year").textContent = new Date().getFullYear();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // "Get the apps" menu: close on outside click, Escape, or after choosing a link
  const menu = document.querySelector(".menu");
  document.addEventListener("click", e => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { menu.open = false; }));

  // Pip Clipboard screenshot tabs (arrow keys move between tabs)
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", e => {
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });

  // Reveal on scroll
  const items = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) { items.forEach(el => el.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  items.forEach(el => io.observe(el));
})();
