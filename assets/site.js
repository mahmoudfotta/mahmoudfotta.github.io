(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---- Appearance: Auto follows the system; Light and Dark are remembered ----
  const choices = document.querySelectorAll('.appearance input[name="appearance"]');
  const saved = root.dataset.theme || "auto";
  choices.forEach(input => { input.checked = input.value === saved; });
  choices.forEach(input => input.addEventListener("change", () => {
    const mode = input.value;
    const apply = () => {
      if (mode === "auto") { delete root.dataset.theme; try { localStorage.removeItem("theme"); } catch (e) {} }
      else { root.dataset.theme = mode; try { localStorage.setItem("theme", mode); } catch (e) {} }
    };
    const r = input.parentElement.getBoundingClientRect();
    root.style.setProperty("--tx", (r.left + r.width / 2) + "px");
    root.style.setProperty("--ty", (r.top + r.height / 2) + "px");
    if (document.startViewTransition && !reduce) document.startViewTransition(apply);
    else apply();
  }));

  // ---- Download menu: close on outside click, Escape, or after choosing a link ----
  const dl = document.querySelector(".dl");
  document.addEventListener("click", e => { if (dl.open && !dl.contains(e.target)) dl.open = false; });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && dl.open) { dl.open = false; dl.querySelector("summary").focus(); } });
  dl.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { dl.open = false; }));

  // ---- Header: scrolled state, scroll progress and current section ----
  const nav = document.querySelector(".nav");
  const links = nav.querySelector(".nav-links");
  const spyLinks = [...links.querySelectorAll("[data-spy]")];
  let navTick = false;
  const onScroll = () => {
    navTick = false;
    nav.classList.toggle("scrolled", scrollY > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.style.setProperty("--progress", max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
  };
  addEventListener("scroll", () => { if (!navTick) { navTick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const movePill = link => {
    spyLinks.forEach(a => a === link ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
    links.classList.toggle("has-active", !!link);
    if (!link) return;
    links.style.setProperty("--px", link.offsetLeft + "px");
    links.style.setProperty("--pw", link.offsetWidth + "px");
  };
  if ("IntersectionObserver" in window) {
    const visible = new Map();
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => visible.set(e.target.id, e.isIntersecting));
      const id = spyLinks.map(a => a.dataset.spy).filter(i => visible.get(i)).pop();
      movePill(spyLinks.find(a => a.dataset.spy === id));
    }, { rootMargin: "-30% 0px -35% 0px" });
    spyLinks.forEach(a => { const sec = document.getElementById(a.dataset.spy); if (sec) spy.observe(sec); });
    addEventListener("resize", () => movePill(spyLinks.find(a => a.hasAttribute("aria-current"))));
  }

  // ---- Pause / play the scrolling list ----
  const ticker = document.querySelector(".ticker");
  const tickerBtn = ticker.querySelector(".ticker-toggle");
  tickerBtn.addEventListener("click", () => {
    const paused = tickerBtn.getAttribute("aria-pressed") !== "true";
    tickerBtn.setAttribute("aria-pressed", paused);
    ticker.classList.toggle("paused", paused);
  });

  // ---- Copy the email address ----
  const copy = document.querySelector(".copy");
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(copy.dataset.copy); } catch (e) { location.href = "mailto:" + copy.dataset.copy; return; }
    copy.classList.add("done"); copy.firstElementChild.textContent = "Copied to clipboard";
    setTimeout(() => { copy.classList.remove("done"); copy.firstElementChild.textContent = "Copy address"; }, 2000);
  });

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

  if (!fine) return;

  // ---- Launch cards tilt toward the cursor, and their border lights up under it ----
  document.querySelectorAll(".pad").forEach(pad => {
    pad.addEventListener("pointermove", e => {
      const r = pad.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      pad.style.setProperty("--ry", ((x - .5) * 6).toFixed(2) + "deg");
      pad.style.setProperty("--rx", ((.5 - y) * 6).toFixed(2) + "deg");
      pad.style.setProperty("--sx", (x * 100).toFixed(1) + "%");
      pad.style.setProperty("--sy", (y * 100).toFixed(1) + "%");
    });
    pad.addEventListener("pointerleave", () => { pad.style.setProperty("--rx", "0deg"); pad.style.setProperty("--ry", "0deg"); });
  });

  // ---- Hero spotlight follows the cursor ----
  const hero = document.getElementById("top");
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
    hero.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
})();
