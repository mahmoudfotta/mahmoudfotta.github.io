(() => {
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const systemAppearance = matchMedia("(prefers-color-scheme: light)");
  root.classList.add("js");
  root.dataset.input = "pointer";

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Keep the browser chrome in sync with the selected appearance.
  const syncThemeColor = () => {
    const color = getComputedStyle(root).backgroundColor;
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = color;
    });
  };
  const choices = document.querySelectorAll('.appearance input[name="appearance"]');
  const saved = root.dataset.theme || "auto";
  choices.forEach(input => {
    input.checked = input.value === saved;
    input.addEventListener("change", () => {
      const mode = input.value;
      if (mode === "auto") {
        delete root.dataset.theme;
        try { localStorage.removeItem("theme"); } catch (error) {}
      } else {
        root.dataset.theme = mode;
        try { localStorage.setItem("theme", mode); } catch (error) {}
      }
      syncThemeColor();
    });
  });
  systemAppearance.addEventListener("change", syncThemeColor);
  syncThemeColor();

  // Content stays visible unless its observer has been set up successfully.
  const revealItems = [...document.querySelectorAll("[data-reveal]")]
    .filter(item => !item.closest(".hero"));
  let revealObserver;
  const revealAll = () => {
    revealObserver?.disconnect();
    revealItems.forEach(item => {
      item.classList.add("in");
      item.classList.remove("reveal-ready");
    });
  };

  document.addEventListener("pointerdown", () => {
    root.dataset.input = "pointer";
  }, true);
  document.addEventListener("keydown", event => {
    if (event.metaKey || event.ctrlKey || event.altKey ||
        ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)) return;
    root.dataset.input = "keyboard";
    revealAll();
  }, true);

  // Native details remains the fallback; enhancement adds a short pointer transition.
  const dl = document.querySelector(".dl");
  let settleMenu = () => {};
  if (dl) {
    const summary = dl.querySelector("summary");
    const panel = dl.querySelector(".dl-panel");
    let wantsOpen = dl.open;
    let menuFrame = 0;
    let menuTimer = 0;
    let afterClose = null;

    const setMenuOpen = (open, onClosed = null, immediate = false) => {
      cancelAnimationFrame(menuFrame);
      clearTimeout(menuTimer);
      menuFrame = 0;
      menuTimer = 0;
      wantsOpen = open;
      afterClose = onClosed;
      const instant = immediate || motion.matches || root.dataset.input === "keyboard";

      if (open) {
        afterClose = null;
        dl.open = true;
        panel.inert = false;
        if (instant) dl.classList.add("is-open");
        else {
          // Establish the initial style before changing the transition target.
          panel.getBoundingClientRect();
          menuFrame = requestAnimationFrame(() => {
            dl.classList.add("is-open");
            menuFrame = 0;
          });
        }
      } else {
        panel.inert = true;
        dl.classList.remove("is-open");
        const finish = () => {
          dl.open = false;
          menuTimer = 0;
          const callback = afterClose;
          afterClose = null;
          callback?.();
        };
        if (instant || !dl.open) finish();
        else menuTimer = setTimeout(finish, 120);
      }
    };

    dl.dataset.enhanced = "true";
    dl.classList.toggle("is-open", wantsOpen);
    panel.inert = !wantsOpen;
    settleMenu = () => setMenuOpen(wantsOpen, afterClose, true);
    summary.addEventListener("click", event => {
      event.preventDefault();
      if (event.detail === 0) {
        root.dataset.input = "keyboard";
        revealAll();
      }
      setMenuOpen(!wantsOpen);
    });
    document.addEventListener("click", event => {
      if (wantsOpen && !dl.contains(event.target)) setMenuOpen(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && dl.open) {
        event.preventDefault();
        setMenuOpen(false, null, true);
        summary.focus();
      }
    });
    dl.addEventListener("focusout", event => {
      // Pointer navigation can temporarily focus the body before an anchor's click.
      // Keep the panel interactive until that click reaches its destination.
      if (root.dataset.input !== "keyboard" || dl.contains(event.relatedTarget)) return;
      queueMicrotask(() => {
        if (root.dataset.input === "keyboard" && wantsOpen && !dl.contains(document.activeElement)) setMenuOpen(false);
      });
    });
    dl.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.detail === 0) {
          root.dataset.input = "keyboard";
          revealAll();
        }
        const url = new URL(link.href);
        let target;
        if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
          try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (error) {}
        }
        setMenuOpen(false, target ? () => {
          if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
          target.focus({ preventScroll: true });
        } : null);
      });
    });
  }

  motion.addEventListener("change", () => {
    if (motion.matches) {
      revealAll();
      settleMenu();
    }
  });

  // Header progress and section position update without moving navigation labels.
  const nav = document.querySelector(".nav");
  const progress = nav?.querySelector(".progress");
  const spyLinks = [...document.querySelectorAll(".nav-links [data-spy]")];
  let navTick = false;
  const updateNav = () => {
    navTick = false;
    nav?.classList.toggle("scrolled", scrollY > 40);
    const max = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
  };
  const scheduleNav = () => {
    if (!navTick) {
      navTick = true;
      requestAnimationFrame(updateNav);
    }
  };
  addEventListener("scroll", scheduleNav, { passive: true });
  addEventListener("resize", scheduleNav);
  updateNav();

  if ("IntersectionObserver" in window) {
    const visible = new Map();
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
      const current = spyLinks.map(link => link.dataset.spy).filter(id => visible.get(id)).pop();
      spyLinks.forEach(link => {
        if (link.dataset.spy === current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-30% 0px -35% 0px" });
    spyLinks.forEach(link => {
      const section = document.getElementById(link.dataset.spy);
      if (section) spy.observe(section);
    });
  }

  // Copy feedback stays stable, including after repeated clicks or a denied copy.
  const copy = document.querySelector(".copy");
  const copyStatus = document.getElementById("copy-status");
  if (copy) {
    const label = copy.querySelector("span") || copy;
    let resetTimer;
    let copyRequest = 0;
    copy.addEventListener("click", async () => {
      const request = ++copyRequest;
      clearTimeout(resetTimer);
      copy.classList.remove("done");
      label.textContent = "Copy address";
      if (copyStatus) copyStatus.textContent = "";
      try {
        await navigator.clipboard.writeText(copy.dataset.copy);
        if (request !== copyRequest) return;
        copy.classList.add("done");
        label.textContent = "Copied";
        if (copyStatus) copyStatus.textContent = "Email address copied to clipboard.";
        resetTimer = setTimeout(() => {
          copy.classList.remove("done");
          label.textContent = "Copy address";
          if (copyStatus) copyStatus.textContent = "";
        }, 2400);
      } catch (error) {
        if (request !== copyRequest) return;
        if (copyStatus) copyStatus.textContent = "Couldn’t copy. Select the email address above to copy it.";
      }
    });
  }

  if (motion.matches || !("IntersectionObserver" in window)) revealAll();
  else {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -24px 0px", threshold: 0.05 });
    revealItems.forEach(item => {
      revealObserver.observe(item);
      item.classList.add("reveal-ready");
    });
  }
})();
