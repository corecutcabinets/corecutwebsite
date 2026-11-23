const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const navDropdowns = document.querySelectorAll(".nav-dropdown");
const mobileNavToggles = document.querySelectorAll(".mobile-nav-toggle");
const leadForms = document.querySelectorAll(".lead-form");
const aiChatButtons = document.querySelectorAll("[data-open-ai-chat]");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const localAssetImages = document.querySelectorAll(
  'img[src^="./assets/"], img[src^="assets/"]',
);
const localPageLinks = {
  "/": "index.html",
  "/residential": "residential.html",
  "/commercial": "commercial.html",
  "/diy": "shop.html",
  "/shop": "shop.html",
  "/shop-base-cabinets": "shop-base-cabinets.html",
  "/shop-wall-cabinets": "shop-wall-cabinets.html",
  "/shop-tall-cabinets": "shop-tall-cabinets.html",
  "/shop-vanities": "shop-vanities.html",
  "/shop-panels-fillers": "shop-panels-fillers.html",
  "/shop-doors-drawer-fronts": "shop-doors-drawer-fronts.html",
  "/shop-hardware": "shop-hardware.html",
  "/shop-shaker-base-cabinet-18-inch-unassembled":
    "shop-shaker-base-cabinet-18-inch-unassembled.html",
  "/gallery": "gallery.html",
  "/before-after": "before-after.html",
  "/book-design-call": "contact.html",
  "/design-consultation": "design-consultation.html",
  "/design-to-your-budget": "design-to-your-budget.html",
  "/our-process": "our-process.html",
  "/installation-service": "installation-service.html",
  "/showroom": "showroom.html",
  "/showrooms": "showroom.html",
  "/about": "about.html",
  "/contact": "contact.html",
  "/financing": "financing.html",
  "/financing/homeowners": "financing/homeowners.html",
  "/financing/businesses": "financing/businesses.html",
};
const phonePattern = /^1?\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const calendlyBaseUrl = "https://calendly.com/corecutcabinets/30min";
const pageTransitionDuration = 160;
const aiChatButtonLabel = "Need Help?";
const aiChatLabelRefreshDelays = [0, 60, 180, 420, 900, 1600];
const aiChatObservedShadowRoots = new WeakSet();
const financingAnalyticsEvents = new Set([
  "financing_hub_view",
  "homeowner_financing_view",
  "business_financing_view",
  "financing_calculator_started",
  "financing_estimate_viewed",
  "homeowner_financing_inquiry",
  "business_financing_inquiry",
  "financing_quote_cta_clicked",
]);

window.dataLayer = Array.isArray(window.dataLayer) ? window.dataLayer : [];
window.corecutTrack = (eventName, properties = {}) => {
  if (!financingAnalyticsEvents.has(eventName)) return;

  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        (key === "mode" && ["homeowner", "business"].includes(String(value))) ||
        (key === "plan" &&
          ["weeks-4", "weeks-8", "weeks-12", "weeks-26", "weeks-52"].includes(
            String(value),
          )),
    ),
  );

  if (typeof window.va === "function") {
    window.va("event", { name: eventName, data: safeProperties });
  } else if (typeof window.gtag === "function") {
    window.gtag("event", eventName, safeProperties);
  } else {
    window.dataLayer.push({ event: eventName, ...safeProperties });
  }

  window.dispatchEvent(
    new CustomEvent("corecut:analytics", {
      detail: { eventName, properties: safeProperties },
    }),
  );
};

document.addEventListener("click", (event) => {
  const target =
    event.target instanceof Element
      ? event.target.closest("[data-analytics-event]")
      : null;
  const eventName = target?.getAttribute("data-analytics-event");
  if (eventName) window.corecutTrack(eventName);
});

const replaceWidgetLabelText = (root, label = aiChatButtonLabel) => {
  if (!root) return false;

  let didReplace = false;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((textNode) => {
    if (!/\bmessage\b/i.test(textNode.nodeValue || "")) return;

    textNode.nodeValue = (textNode.nodeValue || "").replace(
      /\bmessage\b/gi,
      label,
    );
    didReplace = true;
  });

  return didReplace;
};

const scheduleAiChatWidgetLabelUpdate = () => {
  aiChatLabelRefreshDelays.forEach((delay) => {
    window.setTimeout(() => updateAiChatWidgetLabel(18), delay);
  });
};

const addAiChatWidgetGuards = (widget) => {
  if (!(widget instanceof HTMLElement)) return;

  if (widget.dataset.aiLabelObserver !== "true") {
    widget.dataset.aiLabelObserver = "true";
    const observer = new MutationObserver(scheduleAiChatWidgetLabelUpdate);
    observer.observe(widget, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    ["click", "pointerdown", "pointerup", "touchend", "focusin"].forEach(
      (eventName) => {
        widget.addEventListener(
          eventName,
          scheduleAiChatWidgetLabelUpdate,
          true,
        );
      },
    );
  }

  if (widget.shadowRoot && !aiChatObservedShadowRoots.has(widget.shadowRoot)) {
    aiChatObservedShadowRoots.add(widget.shadowRoot);
    const shadowObserver = new MutationObserver(
      scheduleAiChatWidgetLabelUpdate,
    );
    shadowObserver.observe(widget.shadowRoot, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    ["click", "pointerdown", "pointerup", "touchend", "focusin"].forEach(
      (eventName) => {
        widget.shadowRoot.addEventListener(
          eventName,
          scheduleAiChatWidgetLabelUpdate,
          true,
        );
      },
    );
  }
};

const observeAiChatWidgetMount = () => {
  if (!document.body || document.body.dataset.aiWidgetMountObserver === "true")
    return;

  document.body.dataset.aiWidgetMountObserver = "true";
  const observer = new MutationObserver((mutations) => {
    const changedAiWidget = mutations.some((mutation) =>
      [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
        if (!(node instanceof Element)) return false;
        return (
          node.matches("elevenlabs-convai") ||
          Boolean(node.querySelector("elevenlabs-convai"))
        );
      }),
    );

    if (changedAiWidget) scheduleAiChatWidgetLabelUpdate();
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

const updateAiChatWidgetLabel = (attempt = 0) => {
  const widget = document.querySelector("elevenlabs-convai");
  if (!(widget instanceof HTMLElement)) {
    if (attempt < 18)
      window.setTimeout(() => updateAiChatWidgetLabel(attempt + 1), 250);
    return;
  }

  widget.setAttribute("button-label", aiChatButtonLabel);
  widget.setAttribute("aria-label", aiChatButtonLabel);
  addAiChatWidgetGuards(widget);

  const roots = [widget, widget.shadowRoot].filter(Boolean);
  let didReplace = false;

  roots.forEach((root) => {
    didReplace = replaceWidgetLabelText(root) || didReplace;
    root
      .querySelectorAll?.("button, [role='button'], [part~='button']")
      .forEach((button) => {
        if (!(button instanceof HTMLElement)) return;

        const ariaLabel = button.getAttribute("aria-label") || "";
        const title = button.getAttribute("title") || "";
        if (/\bmessage\b/i.test(ariaLabel))
          button.setAttribute(
            "aria-label",
            ariaLabel.replace(/\bmessage\b/gi, aiChatButtonLabel),
          );
        if (/\bmessage\b/i.test(title))
          button.setAttribute(
            "title",
            title.replace(/\bmessage\b/gi, aiChatButtonLabel),
          );
      });
  });

  if (!didReplace && attempt < 18) {
    window.setTimeout(() => updateAiChatWidgetLabel(attempt + 1), 250);
  }
};

const triggerAiChatWidget = (attempt = 0) => {
  const widget = document.querySelector("elevenlabs-convai");
  if (!(widget instanceof HTMLElement)) return false;

  const openMethods = ["open", "show", "expand"];
  for (const method of openMethods) {
    if (typeof widget[method] === "function") {
      widget[method]();
      scheduleAiChatWidgetLabelUpdate();
      return true;
    }
  }

  const widgetRoot = widget.shadowRoot;
  const widgetButton =
    widgetRoot?.querySelector('[part="button"], button, [role="button"]') ||
    widget.querySelector('[part="button"], button, [role="button"]');

  if (widgetButton instanceof HTMLElement) {
    widgetButton.click();
    scheduleAiChatWidgetLabelUpdate();
    return true;
  }

  widget.classList.add("chat-widget-pulse");
  window.setTimeout(() => widget.classList.remove("chat-widget-pulse"), 1200);

  if (attempt < 12) {
    window.setTimeout(() => triggerAiChatWidget(attempt + 1), 250);
    return false;
  }

  widget.click();
  widget.dispatchEvent(
    new MouseEvent("click", { bubbles: true, composed: true }),
  );
  widget.scrollIntoView({
    behavior: reduceMotionQuery.matches ? "auto" : "smooth",
    block: "center",
  });

  return false;
};

updateAiChatWidgetLabel();
window.addEventListener("load", () => updateAiChatWidgetLabel());
observeAiChatWidgetMount();
document.addEventListener("DOMContentLoaded", observeAiChatWidgetMount);
document.addEventListener(
  "click",
  (event) => {
    const widget = document.querySelector("elevenlabs-convai");
    if (!(widget instanceof HTMLElement)) return;

    const path =
      typeof event.composedPath === "function" ? event.composedPath() : [];
    if (event.target === widget || path.includes(widget)) {
      scheduleAiChatWidgetLabelUpdate();
    }
  },
  true,
);

if (!reduceMotionQuery.matches) {
  document.body.classList.add("page-transition-ready");
  window.requestAnimationFrame(() =>
    document.body.classList.add("page-transition-in"),
  );
}

const getFormValue = (formData, name) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

const buildCalendlyUrl = (formData) => {
  const url = new URL(calendlyBaseUrl);
  const customAnswers = [
    getFormValue(formData, "phone"),
    getFormValue(formData, "project_type"),
    getFormValue(formData, "how_heard"),
    "Meeting type selected in Calendly",
    "City / area not collected in website booking form",
  ];

  url.searchParams.set("hide_event_type_details", "1");
  url.searchParams.set("hide_gdpr_banner", "1");
  url.searchParams.set("primary_color", "8a5a2c");

  const fullName = getFormValue(formData, "full_name");
  const email = getFormValue(formData, "email");

  if (fullName) url.searchParams.set("name", fullName);
  if (email) url.searchParams.set("email", email);

  customAnswers.forEach((answer, index) => {
    if (answer) url.searchParams.set(`a${index + 1}`, answer);
  });

  return url.toString();
};

const renderCalendlyWidget = (widget, url, attempts = 0) => {
  if (!(widget instanceof HTMLElement)) return;

  widget.dataset.url = url;
  widget.setAttribute("data-url", url);
  widget.innerHTML = "";

  if (
    window.Calendly &&
    typeof window.Calendly.initInlineWidget === "function"
  ) {
    window.Calendly.initInlineWidget({
      url,
      parentElement: widget,
    });
    return;
  }

  if (attempts < 12) {
    window.setTimeout(
      () => renderCalendlyWidget(widget, url, attempts + 1),
      250,
    );
  }
};

const closeMobileSubmenus = (activeGroup) => {
  document.querySelectorAll(".mobile-nav-group").forEach((group) => {
    if (group === activeGroup) return;

    group.classList.remove("is-open");
    group
      .querySelector(".mobile-nav-toggle")
      ?.setAttribute("aria-expanded", "false");
  });
};

let lastFocusedBeforeMobileMenu = null;

const closeMobileMenu = () => {
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Open menu");
  mobileMenu?.classList.remove("is-open");
  mobileMenu?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("nav-open");
  closeMobileSubmenus();
};

const getMobileFocusableItems = () =>
  Array.from(
    mobileMenu?.querySelectorAll("a[href], button:not([disabled])") || [],
  ).filter((item) => {
    if (!(item instanceof HTMLElement) || item.offsetParent === null)
      return false;

    const submenu = item.closest(".mobile-submenu");
    if (!submenu) return true;

    return Boolean(
      submenu.closest(".mobile-nav-group")?.classList.contains("is-open"),
    );
  });

const openMobileMenu = () => {
  lastFocusedBeforeMobileMenu =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  menuButton?.setAttribute("aria-expanded", "true");
  menuButton?.setAttribute("aria-label", "Close menu");
  mobileMenu?.classList.add("is-open");
  mobileMenu?.setAttribute("aria-hidden", "false");
  document.body.classList.add("nav-open");

  window.requestAnimationFrame(() => {
    getMobileFocusableItems()[0]?.focus({ preventScroll: true });
  });
};

const closeNavDropdowns = (activeDropdown) => {
  navDropdowns.forEach((dropdown) => {
    if (dropdown === activeDropdown) return;

    dropdown.classList.remove("is-open");
    dropdown
      .querySelector(".nav-dropdown-toggle")
      ?.setAttribute("aria-expanded", "false");
  });
};

navDropdowns.forEach((dropdown) => {
  const toggle = dropdown.querySelector(".nav-dropdown-toggle");

  toggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = dropdown.classList.contains("is-open");

    closeNavDropdowns(dropdown);
    dropdown.classList.toggle("is-open", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });
});

aiChatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    triggerAiChatWidget();
    scheduleAiChatWidgetLabelUpdate();
  });
});

mobileNavToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const group = toggle.closest(".mobile-nav-group");
    if (!(group instanceof HTMLElement)) return;

    const isOpen = group.classList.contains("is-open");
    closeMobileSubmenus(group);
    group.classList.toggle("is-open", !isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });
});

const retryFromSiteRoot = (image) => {
  if (
    !(image instanceof HTMLImageElement) ||
    image.dataset.assetRetry === "true"
  )
    return;
  if (window.location.protocol === "file:") return;

  const assetPath = image.getAttribute("src")?.replace(/^\.\//, "");
  if (!assetPath?.startsWith("assets/")) return;

  image.dataset.assetRetry = "true";
  image.src = `/${assetPath}`;
};

localAssetImages.forEach((image) => {
  image.addEventListener("error", () => retryFromSiteRoot(image));

  if (
    image instanceof HTMLImageElement &&
    image.complete &&
    image.naturalWidth === 0
  ) {
    retryFromSiteRoot(image);
  }
});

document.addEventListener(
  "click",
  (event) => {
    const link =
      event.target instanceof Element ? event.target.closest("a") : null;

    if (
      link instanceof HTMLAnchorElement &&
      (link.closest(".mobile-nav") || link.getAttribute("href") === "/contact")
    ) {
      closeMobileMenu();
    }

    if (
      !(event.target instanceof Element) ||
      !event.target.closest(".nav-dropdown")
    ) {
      closeNavDropdowns();
    }
  },
  true,
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
    closeMobileSubmenus();
    closeNavDropdowns();
    lastFocusedBeforeMobileMenu?.focus({ preventScroll: true });
    lastFocusedBeforeMobileMenu = null;
  }

  if (event.key === "Tab" && document.body.classList.contains("nav-open")) {
    const focusableItems = getMobileFocusableItems();
    if (focusableItems.length === 0) return;

    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];

    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  }
});

const getInternalNavigationTarget = (link) => {
  if (!(link instanceof HTMLAnchorElement)) return "";
  if (link.target || link.hasAttribute("download")) return "";

  const href = link.getAttribute("href") || "";
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  )
    return "";

  if (
    window.location.protocol === "file:" &&
    href.startsWith("/") &&
    !href.startsWith("//")
  ) {
    const [cleanPath, hash] = href.split("#");
    const localTarget = localPageLinks[cleanPath];
    const scriptSource =
      document.currentScript?.src ||
      document.querySelector('script[src*="script.js"]')?.src;
    const localRoot = scriptSource
      ? new URL(".", scriptSource)
      : new URL(".", window.location.href);
    return localTarget
      ? new URL(hash ? `${localTarget}#${hash}` : localTarget, localRoot).href
      : "";
  }

  try {
    const targetUrl = new URL(link.href);
    if (targetUrl.origin !== window.location.origin) return "";

    const currentUrl = new URL(window.location.href);
    if (targetUrl.pathname === currentUrl.pathname && targetUrl.hash) return "";

    return targetUrl.href;
  } catch {
    return "";
  }
};

document.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;

    const target = getInternalNavigationTarget(link);
    if (!target) return;

    closeMobileMenu();
    event.preventDefault();

    if (reduceMotionQuery.matches) {
      window.location.href = target;
      return;
    }

    document.body.classList.add("page-transition-out");
    window.setTimeout(() => {
      window.location.href = target;
    }, pageTransitionDuration);
  });
});

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    closeMobileMenu();
    lastFocusedBeforeMobileMenu?.focus({ preventScroll: true });
    lastFocusedBeforeMobileMenu = null;
  } else {
    openMobileMenu();
  }
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeMobileMenu();
  }
});

window.addEventListener("pageshow", closeMobileMenu);
closeMobileMenu();

const clampPercent = (value) => Math.min(100, Math.max(0, value));

const connection =
  navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const likelyLowPowerDevice =
  Boolean(connection?.saveData) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4) ||
  (typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4);

document.documentElement.classList.toggle(
  "low-power-mode",
  likelyLowPowerDevice,
);

/*
 * Homepage hero cabinet: the loop itself is pure CSS (styles.css, "Homepage
 * hero cabinet loop"). This only pauses it while the hero is off screen by
 * toggling .is-paused, which sets animation-play-state. If the observer is
 * unavailable or never reports, the class is never added and the loop simply
 * keeps running.
 */
const heroCabinet = document.querySelector("[data-hero-cabinet]");
if (heroCabinet instanceof HTMLElement && "IntersectionObserver" in window) {
  new IntersectionObserver(
    (records) => {
      records.forEach((record) => {
        heroCabinet.classList.toggle("is-paused", !record.isIntersecting);
      });
    },
    { threshold: 0 },
  ).observe(heroCabinet);
}

/*
 * Values lab: tap-to-play cabinet dioramas.
 * Each value pairs a chip (tab) with a view holding a CSS 3D scene; selecting a
 * chip shows its view and replays the scene by cycling .is-active on the stage.
 * Without JS the chips stay hidden and all three views render stacked.
 */
const valuesSection = document.querySelector("[data-values]");
if (valuesSection) {
  const valuesLab = valuesSection.querySelector(".values-lab");
  const valueChips = Array.from(
    valuesSection.querySelectorAll("[data-values-chip]"),
  );
  const valueViews = Array.from(
    valuesSection.querySelectorAll("[data-values-view]"),
  );

  if (
    valuesLab &&
    valueChips.length > 0 &&
    valueChips.length === valueViews.length
  ) {
    valuesLab.classList.add("is-enhanced");
    let activeValue = 0;

    const playScene = (view) => {
      const stage = view.querySelector(".vstage");
      if (!stage) return;
      stage.classList.remove("is-active");
      // Force reflow so re-adding the class restarts every part transition.
      void stage.offsetWidth;
      stage.classList.add("is-active");
    };

    const setActiveValue = (index, fromUser) => {
      activeValue = (index + valueChips.length) % valueChips.length;

      valueChips.forEach((chip, i) => {
        const isActive = i === activeValue;
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-selected", String(isActive));
        chip.tabIndex = isActive ? 0 : -1;
      });

      valueViews.forEach((view, i) => {
        const isActive = i === activeValue;
        view.classList.toggle("is-active", isActive);
        // Reset hidden scenes so they replay from the start next time.
        if (!isActive)
          view.querySelector(".vstage")?.classList.remove("is-active");
      });

      // Force the newly shown view to render its idle state first, then play;
      // a plain timeout is more dependable than rAF when the tab isn't painting.
      void valueViews[activeValue].offsetWidth;
      window.setTimeout(() => playScene(valueViews[activeValue]), 30);
      if (fromUser) valueChips[activeValue].focus({ preventScroll: true });
    };

    valueChips.forEach((chip, i) => {
      // Clicking the already-active chip replays its scene.
      chip.addEventListener("click", () => setActiveValue(i, false));

      chip.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          setActiveValue(activeValue + 1, true);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          setActiveValue(activeValue - 1, true);
        } else if (event.key === "Home") {
          event.preventDefault();
          setActiveValue(0, true);
        } else if (event.key === "End") {
          event.preventDefault();
          setActiveValue(valueChips.length - 1, true);
        }
      });
    });

    // Idle until first seen: the opening scene plays once on scroll into view.
    if ("IntersectionObserver" in window) {
      const valuesObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            playScene(valueViews[activeValue]);
            valuesObserver.disconnect();
          });
        },
        { threshold: 0.35 },
      );
      valuesObserver.observe(valuesSection);
    } else {
      playScene(valueViews[activeValue]);
    }
  }
}

/*
 * Coming-soon clock. The hands are CSS animations that each run one full turn
 * per 12 h / 1 h / 1 min, so all this does is hand them a negative delay equal
 * to how far through that turn the current time already is. No interval and no
 * animation frame; the compositor does the rest. Used by any section behind a
 * coming-soon wall.
 */
document.querySelectorAll("[data-soon-wall]").forEach((wall) => {
  if (!(wall instanceof HTMLElement)) return;
  const now = new Date();
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  const setStart = (selector, elapsedSeconds) => {
    const hand = wall.querySelector(selector);
    if (hand instanceof HTMLElement) {
      hand.style.setProperty("--start", `-${elapsedSeconds.toFixed(3)}s`);
    }
  };

  setStart("[data-clock-second]", seconds);
  setStart("[data-clock-minute]", minutes * 60);
  setStart("[data-clock-hour]", hours * 3600);
});

const revealItems = new Set(
  document.querySelectorAll(
    [
      "main .section-heading",
      "main .split-image",
      "main .split-copy",
      "main .lead-copy",
      "main .lead-cta-actions",
      "main .testimonial-inner",
      "main .why-grid > *",
      "main .simple-value",
      "main .value-stage",
      "main .customer-grid > *",
      "main .service-feature-grid > *",
      "main .shop-category-grid > *",
      "main .shop-product-grid > *",
      "main .case-study-grid > *",
      "main .review-grid > *",
      "main .team-grid > *",
      "main .gallery-grid > *",
      "main .process-grid > *",
      "main .why-list > *",
      "main .design-call-steps > *",
    ].join(","),
  ),
);

const staggerGroups = document.querySelectorAll(
  [
    "main .customer-grid",
    "main .service-feature-grid",
    "main .shop-category-grid",
    "main .shop-product-grid",
    "main .case-study-grid",
    "main .review-grid",
    "main .team-grid",
    "main .gallery-grid",
    "main .process-grid",
    "main .why-list",
    "main .design-call-steps",
  ].join(","),
);

staggerGroups.forEach((group) => {
  Array.from(group.children).forEach((item, index) => {
    revealItems.add(item);
    item.style.setProperty("--reveal-delay", `${Math.min(index * 45, 140)}ms`);
  });
});

document
  .querySelectorAll("main .split-image, main .lead-copy")
  .forEach((item) => item.classList.add("reveal-from-left"));
document
  .querySelectorAll("main .split-copy, main .lead-cta-actions")
  .forEach((item) => item.classList.add("reveal-from-right"));

if (revealItems.size > 0) {
  revealItems.forEach((item) => item.classList.add("scroll-reveal"));

  if (
    reduceMotionQuery.matches ||
    likelyLowPowerDevice ||
    !("IntersectionObserver" in window)
  ) {
    revealItems.forEach((item) => item.classList.add("is-revealed"));
  } else {
    document.documentElement.classList.add("reveal-ready");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px 18% 0px",
        threshold: 0.04,
      },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }
}

const processTimeline = document.querySelector("[data-process-timeline]");
const processSteps = Array.from(
  document.querySelectorAll("[data-process-step]"),
);

if (processTimeline && processSteps.length > 0) {
  const setActiveProcessStep = () => {
    const timelineRect = processTimeline.getBoundingClientRect();
    const progressAnchor = window.innerHeight * 0.52;
    const progress = clampPercent(
      ((progressAnchor - timelineRect.top) / timelineRect.height) * 100,
    );
    let activeStep = processSteps[0];
    let nearestDistance = Number.POSITIVE_INFINITY;

    processTimeline.style.setProperty("--process-progress", progress + "%");

    processSteps.forEach((step) => {
      const rect = step.getBoundingClientRect();
      const stepAnchor = rect.top + rect.height * 0.35;
      const distance = Math.abs(stepAnchor - progressAnchor);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        activeStep = step;
      }
    });

    processSteps.forEach((step) => {
      const isActive = step === activeStep;
      step.classList.toggle("is-active", isActive);
      if (isActive) {
        step.setAttribute("aria-current", "step");
      } else {
        step.removeAttribute("aria-current");
      }
    });
  };

  if (reduceMotionQuery.matches || !("IntersectionObserver" in window)) {
    processSteps.forEach((step) => step.classList.add("is-visible"));
  } else {
    const processObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        rootMargin: "0px 0px -14% 0px",
        threshold: 0.18,
      },
    );

    processSteps.forEach((step) => processObserver.observe(step));
  }

  let processTicking = false;
  const requestProcessUpdate = () => {
    if (processTicking) return;
    processTicking = true;
    window.requestAnimationFrame(() => {
      setActiveProcessStep();
      processTicking = false;
    });
  };

  window.addEventListener("scroll", requestProcessUpdate, { passive: true });
  window.addEventListener("resize", requestProcessUpdate);
  setActiveProcessStep();
}

const galleryCards = document.querySelectorAll(".gallery-grid .media");

if (galleryCards.length > 0 && typeof HTMLDialogElement === "function") {
  const lightbox = document.createElement("dialog");
  lightbox.className = "lightbox";
  lightbox.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close image">✕</button><img alt="" /><p class="lightbox-caption"></p>';
  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector(".lightbox-caption");

  galleryCards.forEach((card) => {
    const image = card.querySelector("img");
    if (!(image instanceof HTMLImageElement)) return;

    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute(
      "aria-label",
      `View larger: ${image.alt || "gallery photo"}`,
    );

    const openLightbox = () => {
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent =
        card.querySelector(".gallery-overlay strong")?.textContent || image.alt;
      lightbox.showModal();
    };

    card.addEventListener("click", openLightbox);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    });
  });

  lightbox
    .querySelector(".lightbox-close")
    ?.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
}

const comparisonSliders = document.querySelectorAll("[data-comparison]");

const setComparisonPosition = (slider, clientX) => {
  const rect = slider.getBoundingClientRect();
  const rawPosition = ((clientX - rect.left) / rect.width) * 100;
  const position = Math.min(100, Math.max(0, rawPosition));

  slider.style.setProperty("--position", position + "%");
  slider
    .querySelector(".comparison-handle")
    ?.setAttribute("aria-valuenow", String(Math.round(position)));
};

comparisonSliders.forEach((slider) => {
  const handle = slider.querySelector(".comparison-handle");

  slider.addEventListener("pointerdown", (event) => {
    slider.classList.add("is-dragging");
    slider.setPointerCapture?.(event.pointerId);
    setComparisonPosition(slider, event.clientX);
  });

  slider.addEventListener("pointermove", (event) => {
    if (!slider.classList.contains("is-dragging")) return;
    setComparisonPosition(slider, event.clientX);
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
    slider.addEventListener(eventName, () =>
      slider.classList.remove("is-dragging"),
    );
  });

  handle?.addEventListener("keydown", (event) => {
    const current = Number(handle.getAttribute("aria-valuenow") || 50);
    let next = current;

    if (event.key === "ArrowLeft") next = current - 4;
    if (event.key === "ArrowRight") next = current + 4;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 100;
    if (next === current && event.key !== "Home" && event.key !== "End") return;

    event.preventDefault();
    const position = Math.min(100, Math.max(0, next));
    slider.style.setProperty("--position", position + "%");
    handle.setAttribute("aria-valuenow", String(Math.round(position)));
  });
});

leadForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement)) return;

    const formMessage = form.querySelector(".form-message");
    const schedulerFlow = form.closest("[data-scheduler-flow]");
    const schedulerSuccess = schedulerFlow?.querySelector(
      "[data-scheduler-success]",
    );
    const schedulerPanel = schedulerFlow?.querySelector(
      "[data-scheduler-panel]",
    );
    const calendlyWidget = schedulerFlow?.querySelector(
      "[data-calendly-widget]",
    );
    const schedulerFallback = schedulerFlow?.querySelector(
      "[data-scheduler-fallback]",
    );
    const honeypotInput = form.querySelector('input[name="_gotcha"]');
    const isSchedulerForm = form.hasAttribute("data-scheduler-form");

    if (
      honeypotInput instanceof HTMLInputElement &&
      honeypotInput.value.trim()
    ) {
      form.reset();
      return;
    }

    const phoneInput = form.querySelector('input[name="phone"]');
    const emailInput = form.querySelector('input[name="email"]');
    const phoneValue =
      phoneInput instanceof HTMLInputElement ? phoneInput.value.trim() : "";
    const emailValue =
      emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
    if (phoneInput instanceof HTMLInputElement) phoneInput.value = phoneValue;
    if (emailInput instanceof HTMLInputElement) emailInput.value = emailValue;
    const phoneDigits = phoneValue.replace(/\D/g, "");
    const hasFullPhone = phonePattern.test(phoneDigits);
    const hasValidEmail = emailPattern.test(emailValue);

    phoneInput?.setCustomValidity(
      hasFullPhone
        ? ""
        : "Enter a full 10-digit phone number, like 780-123-4567.",
    );
    emailInput?.setCustomValidity(
      hasValidEmail
        ? ""
        : "Enter a valid email address with a domain, like name@example.com.",
    );

    if (!hasFullPhone || !hasValidEmail || !form.checkValidity()) {
      form.reportValidity();
      if (formMessage) {
        formMessage.textContent =
          form.dataset.validationMessage ||
          "Please enter every field with a full phone number and a valid email address.";
      }
      return;
    }

    const formData = new FormData(form);

    // Additive submit loading state; does not affect the Formspree/Calendly flow.
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.classList.add("is-loading");
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
    }
    const clearSubmitLoading = () => {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.classList.remove("is-loading");
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
      }
    };

    // Reveal the Calendly booking step. For scheduler forms this must run even if
    // the Formspree POST fails, so an email hiccup never blocks the client from
    // booking. The prefilled Calendly still captures all of their details.
    const revealScheduler = () => {
      const calendlyUrl = buildCalendlyUrl(formData);

      form.hidden = true;
      const contactAside = schedulerFlow?.querySelector("[data-contact-aside]");
      if (contactAside) contactAside.hidden = true;
      if (formMessage) {
        formMessage.textContent = "";
      }
      if (schedulerFallback instanceof HTMLAnchorElement) {
        schedulerFallback.href = calendlyUrl;
      }
      schedulerSuccess?.removeAttribute("hidden");
      schedulerPanel?.removeAttribute("hidden");
      renderCalendlyWidget(calendlyWidget, calendlyUrl);
      schedulerPanel?.scrollIntoView({
        behavior: reduceMotionQuery.matches ? "auto" : "smooth",
        block: "start",
      });
    };

    let deliveredToFormspree = false;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });
      deliveredToFormspree = response.ok;
    } catch {
      deliveredToFormspree = false;
    }

    clearSubmitLoading();
    form.reset();

    if (isSchedulerForm) {
      // Always continue to booking, whether or not Formspree accepted the POST.
      revealScheduler();
      return;
    }

    if (formMessage) {
      formMessage.textContent = deliveredToFormspree
        ? form.dataset.successMessage ||
          "Thank you. Your quote request has been sent to Corecut Cabinets."
        : form.dataset.errorMessage ||
          "Sorry, the quote request could not be sent. Please try again or email us directly.";
    }

    if (deliveredToFormspree) {
      const analyticsEvent = form.dataset.analyticsSuccess;
      if (analyticsEvent) window.corecutTrack?.(analyticsEvent);
      document.dispatchEvent(
        new CustomEvent("corecut:form-success", { detail: { form } }),
      );
    }
  });
});

/*
 * Conversational (one-question-at-a-time) controller.
 * Progressive enhancement layered over the existing form: without JS the steps
 * and the real submit button stay visible as a normal stacked form. With JS we
 * reveal one step at a time and, on the final step, let the browser submit the
 * form natively so the existing leadForms handler (Formspree + Calendly) runs
 * unchanged. A capture-phase submit listener intercepts non-final submissions.
 */
document.querySelectorAll("[data-chat-form]").forEach((form) => {
  if (!(form instanceof HTMLFormElement)) return;

  const stepsContainer = form.querySelector("[data-chat-steps]");
  const steps = Array.from(form.querySelectorAll("[data-chat-step]"));
  const realSubmit = form.querySelector('button[type="submit"]');
  if (!stepsContainer || steps.length === 0 || !realSubmit) return;

  form.classList.add("is-chat-enabled");

  // Remove the original submit button from the DOM (kept only as a no-JS
  // fallback). With no submit button present, empty required fields in the
  // not-yet-shown steps can't block navigation via implicit submission, so we
  // advance manually and submit natively only on the final step.
  const originalLabelText =
    realSubmit.querySelector(".button-label")?.textContent?.trim() ||
    "Send details";
  realSubmit.remove();

  const progress = document.createElement("div");
  progress.className = "chat-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-valuemin", "1");
  progress.setAttribute("aria-valuemax", String(steps.length));
  const progressBar = document.createElement("span");
  progressBar.className = "chat-progress-bar";
  progress.append(progressBar);

  const nav = document.createElement("div");
  nav.className = "chat-nav";
  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "chat-back";
  backButton.textContent = "← Back";
  const counter = document.createElement("span");
  counter.className = "chat-counter";
  counter.setAttribute("aria-live", "polite");
  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "button primary chat-next";
  const nextLabel = document.createElement("span");
  nextLabel.className = "button-label";
  nextButton.append(nextLabel);
  nav.append(backButton, counter, nextButton);

  stepsContainer.before(progress);
  stepsContainer.after(nav);

  let index = 0;
  const lastIndex = steps.length - 1;
  const isLast = () => index === lastIndex;

  const stepFields = (step) =>
    Array.from(
      step.querySelectorAll("input:not([type=hidden]), textarea, select"),
    );

  const showStep = (target, focus = true) => {
    index = Math.max(0, Math.min(lastIndex, target));

    steps.forEach((step, position) => {
      const active = position === index;
      step.classList.toggle("is-active", active);
      step.hidden = !active;
    });

    progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
    progress.setAttribute("aria-valuenow", String(index + 1));
    counter.textContent = `Question ${index + 1} of ${steps.length}`;
    backButton.hidden = index === 0;
    nextLabel.textContent = isLast() ? originalLabelText : "OK →";

    if (focus) {
      const field = stepFields(steps[index])[0];
      window.requestAnimationFrame(() => field?.focus({ preventScroll: true }));
    }
  };

  const validateStep = () => {
    for (const field of stepFields(steps[index])) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  };

  // If anything got cleared (e.g. via Back), jump to the first invalid step.
  const jumpToFirstInvalid = () => {
    for (let position = 0; position < steps.length; position += 1) {
      const invalid = stepFields(steps[position]).find(
        (field) => !field.checkValidity(),
      );
      if (invalid) {
        showStep(position);
        invalid.reportValidity();
        return true;
      }
    }
    return false;
  };

  const submitFinal = () => {
    if (jumpToFirstInvalid()) return;
    // Become a real submit button so the existing handler's spinner targets it,
    // then submit natively → runs the existing Formspree + Calendly handler.
    nextButton.type = "submit";
    form.requestSubmit();
  };

  const advance = () => {
    if (!validateStep()) return;
    if (isLast()) {
      submitFinal();
    } else {
      showStep(index + 1);
    }
  };

  nextButton.addEventListener("click", advance);
  backButton.addEventListener("click", () => showStep(index - 1));

  // Enter advances (except inside the textarea, where it should add a newline).
  // On a multi-field card, Enter first hops to the next field in that card.
  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.target instanceof HTMLTextAreaElement)
      return;
    event.preventDefault();

    const fields = stepFields(steps[index]);
    const position = fields.indexOf(event.target);
    if (position > -1 && position < fields.length - 1) {
      if (!event.target.checkValidity()) {
        event.target.reportValidity();
        return;
      }
      fields[position + 1].focus();
      return;
    }
    advance();
  });

  // Friction-free: selecting a choice moves to the next question automatically.
  form
    .querySelectorAll("[data-chat-autoadvance] input[type='radio']")
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          window.setTimeout(
            () => advance(),
            reduceMotionQuery.matches ? 0 : 220,
          );
        }
      });
    });

  showStep(0, false);
});
