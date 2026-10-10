(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const systemLight = matchMedia("(prefers-color-scheme: light)");
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---- Theme: follows the system until the visitor picks one ----
  const toggle = document.querySelector(".theme");
  const current = () => root.dataset.theme || (systemLight.matches ? "light" : "dark");
  const label = () => toggle.setAttribute("aria-label", current() === "dark" ? "Switch to light mode" : "Switch to dark mode");
  const apply = next => {
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  };
  toggle.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    const r = toggle.getBoundingClientRect();
    root.style.setProperty("--tx", (r.left + r.width / 2) + "px");
    root.style.setProperty("--ty", (r.top + r.height / 2) + "px");
    if (document.startViewTransition && !reduce) document.startViewTransition(() => apply(next));
    else apply(next);
  });
  systemLight.addEventListener("change", label);
  label();

  // ---- Download menu: close on outside click, Escape, or after choosing a link ----
  const dl = document.querySelector(".dl");
  document.addEventListener("click", e => { if (dl.open && !dl.contains(e.target)) dl.open = false; });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && dl.open) { dl.open = false; dl.querySelector("summary").focus(); } });
  dl.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { dl.open = false; }));

  // ---- SpendCue's daily number counts up when it scrolls into view ----
  const counter = document.getElementById("count");
  const countUp = () => {
    if (reduce || counter.dataset.done) return;
    counter.dataset.done = "1";
    const target = 118.48, t0 = performance.now(), dur = 1800;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      counter.textContent = (target * (1 - Math.pow(1 - k, 4))).toFixed(2);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ---- Reveal on scroll ----
  const items = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) items.forEach(el => el.classList.add("in"));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.classList.contains("money")) countUp();
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -10% 0px", threshold: .1 });
    items.forEach(el => io.observe(el));
  }
  if (reduce) return;

  // ---- The Mac window flattens and the phones rise as the stage scrolls in ----
  const stages = [...document.querySelectorAll("[data-scroll]")];
  let ticking = false;
  const update = () => {
    ticking = false;
    stages.forEach(el => {
      const top = el.getBoundingClientRect().top;
      el.style.setProperty("--p", Math.min(1, Math.max(0, (innerHeight - top) / (innerHeight * .75))).toFixed(3));
    });
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();

  // ---- Hero spotlight follows the cursor ----
  if (!fine) return;
  const hero = document.getElementById("top");
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
    hero.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
})();
