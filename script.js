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

/*
 * Precision Assembly intro: a first-visit, CSS-3D build of the Corecut mark.
 * The early head script decides whether the intro should paint before the page
 * flashes; this controller owns readiness, accessibility, skipping, and cleanup.
 */
const corecutIntro = document.querySelector("[data-corecut-intro]");
if (corecutIntro instanceof HTMLElement) {
  const introKey = "corecut-precision-intro-v1";
  const introRoot = document.documentElement;
  const introShouldRun =
    introRoot.classList.contains("corecut-intro-pending") &&
    !reduceMotionQuery.matches;
  const introSkip = corecutIntro.querySelector("[data-corecut-intro-skip]");
  const introLogo = corecutIntro.querySelector("[data-corecut-intro-logo]");

  const clearIntroFailsafe = () => {
    if (window.__corecutIntroFailsafe) {
      window.clearTimeout(window.__corecutIntroFailsafe);
      window.__corecutIntroFailsafe = undefined;
    }
  };

  const markIntroSeen = () => {
    try {
      window.sessionStorage.setItem(introKey, "seen");
    } catch {
      // Storage can be unavailable in strict privacy contexts; the intro still exits safely.
    }
  };

  if (!introShouldRun) {
    clearIntroFailsafe();
    introRoot.classList.remove("corecut-intro-pending");
    corecutIntro.remove();
  } else {
    const introConnection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    // Phone browsers commonly report four CPU cores or 4 GB of memory even
    // when they can render this short CSS animation smoothly. Treating those
    // values as a low-power signal made most mobile visitors see only the
    // completed lockup. Use the user's explicit data-saving preference as the
    // sole reason to skip the 3D assembly.
    const introSaveDataEnabled = Boolean(introConnection?.saveData);
    const introMinimumDuration = introSaveDataEnabled ? 900 : 2250;
    const introMaximumDuration = introSaveDataEnabled ? 1700 : 3600;
    const introTimers = new Set();
    const previousAriaBusy = document.body.getAttribute("aria-busy");
    const blockedPageRegions = Array.from(
      document.querySelectorAll(
        ".site-header, .mobile-nav, main, .footer, elevenlabs-convai",
      ),
    ).map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    let introStartedAt = performance.now();
    let isLeaving = false;
    let isCleanedUp = false;

    const setIntroTimer = (callback, delay) => {
      const timer = window.setTimeout(() => {
        introTimers.delete(timer);
        callback();
      }, delay);
      introTimers.add(timer);
      return timer;
    };

    const restorePageRegions = () => {
      blockedPageRegions.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }
      });

      if (previousAriaBusy === null) {
        document.body.removeAttribute("aria-busy");
      } else {
        document.body.setAttribute("aria-busy", previousAriaBusy);
      }
    };

    const handleIntroKeydown = (event) => {
      if (event.key === "Escape") beginIntroExit();
    };

    const handleIntroPageShow = (event) => {
      if (event.persisted) cleanUpIntro();
    };

    const cleanUpIntro = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;

      introTimers.forEach((timer) => window.clearTimeout(timer));
      introTimers.clear();
      clearIntroFailsafe();
      markIntroSeen();
      restorePageRegions();
      document.body.classList.remove("corecut-intro-active");
      introRoot.classList.remove("corecut-intro-pending");
      document.removeEventListener("keydown", handleIntroKeydown);
      window.removeEventListener("pageshow", handleIntroPageShow);
      corecutIntro.remove();
      window.dispatchEvent(new CustomEvent("corecut:intro-complete"));
    };

    function beginIntroExit() {
      if (isLeaving || isCleanedUp) return;
      isLeaving = true;
      corecutIntro.classList.add("is-leaving");
      setIntroTimer(cleanUpIntro, 980);
    }

    const scheduleIntroExit = () => {
      const elapsed = performance.now() - introStartedAt;
      setIntroTimer(
        beginIntroExit,
        Math.max(0, introMinimumDuration - elapsed),
      );
    };

    const fontReady = document.fonts?.ready || Promise.resolve();
    const logoReady =
      introLogo instanceof HTMLImageElement &&
      typeof introLogo.decode === "function"
        ? introLogo.decode().catch(() => {})
        : Promise.resolve();

    blockedPageRegions.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    document.body.setAttribute("aria-busy", "true");
    document.body.classList.add("corecut-intro-active");
    corecutIntro.classList.toggle("is-lite", introSaveDataEnabled);
    introSkip?.addEventListener("click", beginIntroExit, { once: true });
    document.addEventListener("keydown", handleIntroKeydown);
    window.addEventListener("pageshow", handleIntroPageShow);

    corecutIntro
      .querySelector(".corecut-intro-curtain-right")
      ?.addEventListener("animationend", (event) => {
        if (
          isLeaving &&
          event.animationName === "corecut-intro-curtain-right-out"
        )
          cleanUpIntro();
      });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (isLeaving || isCleanedUp) return;
        introStartedAt = performance.now();
        corecutIntro.classList.add("is-playing");
        Promise.allSettled([fontReady, logoReady]).then(scheduleIntroExit);
        setIntroTimer(beginIntroExit, introMaximumDuration);
      });
    });
  }
}

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
 * Homepage project marquee: one continuous horizontal row of cabinetry films.
 *
 * The row is a flat strip: cards enter on the right, travel left in a straight
 * line, leave on the left and reappear on the right. The strip is a repeated
 * copy of `homeProjectVideos`, so translating it by exactly one set width wraps
 * invisibly. There is no angle, radius or orbit anywhere in this file.
 *
 * Depth is applied per card from its horizontal distance to the centre of the
 * screen only (scale / rotateY / translateZ / opacity), which keeps the path
 * horizontal while still giving the row a little dimensionality.
 *
 * On desktop the strip runs *behind* the hero copy: styles.css masks the middle
 * of the viewport out, so cards dissolve on the way in and reappear on the far
 * side. That flips which cards are worth attention — the ones nearest the
 * centre are the ones nobody can see — so `layeredQuery` below steers both the
 * caption highlight and the video play budget out to the open sides. Under
 * 1025px the layers un-stack, the mask is off, and the centre leads again.
 *
 * To add a project: append another object to `homeProjectVideos`. Card count,
 * strip width and the number of repeats are all derived at runtime.
 */
const homeProjectVideos = [
  {
    title: "Natural Oak Kitchen",
    category: "Custom Kitchen",
    location: "Edmonton, Alberta",
    video: "./assets/hero-kitchen-light.mp4",
    poster: "./assets/hero-kitchen-light-poster.jpg",
    href: "/gallery",
  },
  {
    title: "Walnut Galley Kitchen",
    category: "Custom Kitchen",
    location: "Edmonton, Alberta",
    video: "./assets/hero-kitchen-dark.mp4",
    poster: "./assets/hero-kitchen-dark-poster.jpg",
    href: "/gallery",
  },
  {
    title: "Open-Concept Cabinetry",
    category: "Kitchen & Living",
    location: "Edmonton, Alberta",
    video: "./assets/hero-open-concept.mp4",
    poster: "./assets/hero-open-concept-poster.jpg",
    href: "/gallery",
  },
  {
    title: "Media Wall Built-In",
    category: "Built-In Millwork",
    location: "Edmonton, Alberta",
    video: "./assets/hero-tv-wall-unit.mp4",
    poster: "./assets/hero-tv-wall-unit-poster.jpg",
    href: "/gallery",
  },
  {
    title: "Walk-In Wardrobe",
    category: "Storage & Closets",
    location: "Edmonton, Alberta",
    video: "./assets/hero-walk-in-closet.mp4",
    poster: "./assets/hero-walk-in-closet-poster.jpg",
    href: "/gallery",
  },
  // Videos 06-10 go here. Same shape, nothing else to change:
  // {
  //   title: "Quartz Island Kitchen",
  //   category: "Custom Kitchen",
  //   location: "Sherwood Park, Alberta",
  //   video: "./assets/hero-project-06.mp4",
  //   poster: "./assets/hero-project-06-poster.jpg",
  //   href: "/gallery",
  // },
];

const projectHero = document.querySelector("[data-project-hero]");
const projectHeroViewport = projectHero?.querySelector(
  "[data-project-hero-viewport]",
);
const projectHeroTrack = projectHero?.querySelector(
  "[data-project-hero-track]",
);

if (
  projectHero instanceof HTMLElement &&
  projectHeroViewport instanceof HTMLElement &&
  projectHeroTrack instanceof HTMLElement &&
  homeProjectVideos.length > 0
) {
  const previousButton = projectHero.querySelector("[data-project-hero-prev]");
  const nextButton = projectHero.querySelector("[data-project-hero-next]");

  const heroReducedMotion = reduceMotionQuery;
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)");
  const smallScreen = window.matchMedia("(max-width: 720px)");
  // Matches the breakpoint where styles.css puts the strip behind the copy.
  const layeredQuery = window.matchMedia("(min-width: 1025px)");

  const SPEED = 0.052; // px per ms; a set drifts past in roughly half a minute
  // Where a card sits in clear air while the strip runs behind the copy,
  // as a fraction of the distance from screen centre to screen edge.
  const CLEAR_ZONE = 0.62;
  const projectCount = homeProjectVideos.length;

  /* ---- build one card ---- */
  const buildCard = (project, copyIndex) => {
    const card = document.createElement("article");
    card.className = "home-project-hero__card";

    const link = document.createElement("a");
    link.className = "home-project-hero__card-link";
    link.href = project.href || "/gallery";
    link.setAttribute(
      "aria-label",
      `${project.title}. ${project.category}, ${project.location}. View our work.`,
    );
    // Only the first copy is reachable by keyboard; the rest are visual repeats.
    if (copyIndex > 0) {
      link.tabIndex = -1;
      card.setAttribute("aria-hidden", "true");
    }

    const media = document.createElement("span");
    media.className = "home-project-hero__media";

    const poster = document.createElement("img");
    poster.className = "home-project-hero__poster";
    poster.src = project.poster;
    poster.alt = "";
    poster.width = 720;
    poster.height = 900;
    poster.decoding = "async";
    poster.loading = copyIndex === 0 ? "eager" : "lazy";

    const video = document.createElement("video");
    video.className = "home-project-hero__video";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.tabIndex = -1;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-hidden", "true");

    const caption = document.createElement("span");
    caption.className = "home-project-hero__caption";
    const captionTitle = document.createElement("span");
    captionTitle.className = "home-project-hero__caption-title";
    captionTitle.textContent = project.title;
    const captionMeta = document.createElement("span");
    captionMeta.className = "home-project-hero__caption-meta";
    captionMeta.textContent = `${project.category} · ${project.location}`;
    caption.append(captionTitle, captionMeta);

    media.append(poster, video, caption);
    link.append(media);
    card.append(link);

    return { card, video, project, sourced: false, failed: false };
  };

  /* ---- lay the strip out; repeats are recomputed on resize ---- */
  let entries = [];
  let pitch = 0;
  let setWidth = 0;
  let offset = 0;
  let viewportWidth = 0;

  const measure = () => {
    viewportWidth = projectHeroViewport.clientWidth || window.innerWidth;
    const probe = entries[0]?.card;
    const cardWidth = probe ? probe.offsetWidth : 300;
    const gap =
      parseFloat(getComputedStyle(projectHeroTrack).columnGap || "0") || 0;
    pitch = cardWidth + gap;
    setWidth = pitch * projectCount;
  };

  const build = () => {
    projectHeroTrack.replaceChildren();
    entries = [];
    // One copy first so we can measure a real card, then top up to cover
    // twice the viewport plus a spare set for the wrap.
    homeProjectVideos.forEach((project) => {
      const entry = buildCard(project, 0);
      entries.push(entry);
      projectHeroTrack.append(entry.card);
    });
    measure();

    const needed = Math.max(
      2,
      Math.ceil((viewportWidth * 2) / Math.max(setWidth, 1)) + 1,
    );
    for (let copy = 1; copy < needed; copy += 1) {
      homeProjectVideos.forEach((project) => {
        const entry = buildCard(project, copy);
        entries.push(entry);
        projectHeroTrack.append(entry.card);
      });
    }
    measure();
  };

  const ensureSource = (entry) => {
    if (entry.sourced || entry.failed) return;
    entry.sourced = true;
    const source = document.createElement("source");
    source.src = entry.project.video;
    source.type = "video/mp4";
    entry.video.append(source);
    entry.video.addEventListener(
      "error",
      () => {
        // Poster remains, so a missing clip never leaves an empty card.
        entry.failed = true;
        entry.card.classList.remove("has-video");
      },
      { once: true },
    );
    entry.video.addEventListener(
      "loadeddata",
      () => entry.card.classList.add("has-video"),
      { once: true },
    );
    entry.video.load();
  };

  /* ---- per-frame: flat translate + distance-based depth ---- */
  let velocity = 0;
  let dragging = false;
  let dragMoved = 0;
  let pointerId = null;
  let lastPointerX = 0;
  let focusHeld = false;
  let visible = true;
  let idleUntil = 0;
  let frame = 0;
  let lastTime = 0;
  let lastMoveTime = 0;
  let tween = null;

  const paused = () =>
    dragging || focusHeld || document.hidden || performance.now() < idleUntil;

  const render = () => {
    projectHeroTrack.style.transform = `translate3d(${-offset}px, 0, 0)`;

    const centre = viewportWidth / 2;
    const half = Math.max(centre, 1);
    const playBudget = smallScreen.matches || coarsePointer.matches ? 1 : 2;
    const layered = layeredQuery.matches;
    const ranked = [];

    entries.forEach((entry, index) => {
      // Position is arithmetic; no getBoundingClientRect inside the loop.
      const cardCentre = index * pitch + pitch / 2 - offset;
      const delta = cardCentre - centre;
      const d = Math.min(1, Math.abs(delta) / half);
      const direction = delta === 0 ? 0 : Math.sign(delta);

      // Gentle depth: the cards on show are the ones out towards the edges,
      // so they have to stay crisp rather than shrink away.
      const scale = 1 - 0.07 * d;
      const rotateY = direction * 10 * d;
      const translateZ = -60 * d;
      const opacity = 1 - 0.14 * d;

      entry.card.style.transform = `translateZ(${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      entry.card.style.opacity = opacity.toFixed(3);
      entry.card.style.filter = `brightness(${(1 - 0.1 * d).toFixed(3)})`;
      entry.card.classList.toggle(
        "is-focus",
        layered ? d > 0.34 && d < 0.94 : d < 0.16,
      );

      const onScreen =
        cardCentre > -pitch && cardCentre < viewportWidth + pitch;
      // Behind the copy the middle of the strip is masked out, so rank by
      // distance from the open side band instead of from screen centre.
      const rank = layered ? Math.abs(d - CLEAR_ZONE) : d;
      ranked.push({ entry, rank, onScreen });
    });

    ranked.sort((a, b) => a.rank - b.rank);
    ranked.forEach((item, position) => {
      const shouldPlay = visible && item.onScreen && position < playBudget;
      if (shouldPlay) {
        ensureSource(item.entry);
        if (
          item.entry.sourced &&
          !item.entry.failed &&
          item.entry.video.paused
        ) {
          const attempt = item.entry.video.play();
          if (attempt && typeof attempt.catch === "function")
            attempt.catch(() => {});
        }
      } else if (!item.entry.video.paused) {
        item.entry.video.pause();
      }
    });
  };

  const needsFrame = () =>
    visible &&
    !document.hidden &&
    !dragging &&
    !focusHeld &&
    (tween !== null ||
      Math.abs(velocity) > 0.002 ||
      performance.now() < idleUntil ||
      !heroReducedMotion.matches);

  const wrap = () => {
    if (setWidth <= 0) return;
    offset = ((offset % setWidth) + setWidth) % setWidth;
  };

  const tick = (time) => {
    frame = 0;
    const delta = Math.min(64, time - (lastTime || time));
    lastTime = time;

    if (tween) {
      const progress = Math.min(1, (time - tween.start) / tween.duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      offset = tween.from + (tween.to - tween.from) * eased;
      if (progress >= 1) tween = null;
    } else if (Math.abs(velocity) > 0.002) {
      offset += velocity * delta;
      velocity *= Math.pow(0.94, delta / 16.67);
    } else if (!paused() && !heroReducedMotion.matches) {
      offset += SPEED * delta;
    }

    wrap();
    render();
    if (needsFrame()) frame = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (frame || !visible) return;
    lastTime = 0;
    frame = window.requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!frame) return;
    window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const nudge = (cards) => {
    const from = offset;
    tween = {
      from,
      to: from + cards * pitch,
      start: performance.now(),
      duration: 620,
    };
    idleUntil = 0;
    velocity = 0;
    start();
  };

  /* ---- drag / swipe ---- */
  projectHeroViewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    dragMoved = 0;
    pointerId = event.pointerId;
    lastPointerX = event.clientX;
    velocity = 0;
    tween = null;
    projectHeroViewport.setPointerCapture?.(event.pointerId);
    projectHeroViewport.classList.add("is-dragging");
  });

  projectHeroViewport.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    dragMoved += Math.abs(dx);
    offset -= dx;
    velocity = -dx * 0.05;
    lastMoveTime = performance.now();
    wrap();
    render();
  });

  const endDrag = (event) => {
    if (!dragging || (event && event.pointerId !== pointerId)) return;
    dragging = false;
    pointerId = null;
    projectHeroViewport.classList.remove("is-dragging");
    // Holding still before releasing should not fling the row.
    if (performance.now() - lastMoveTime > 140) velocity = 0;
    // Pick straight back up with no waiting period after letting go.
    idleUntil = 0;
    start();
  };

  projectHeroViewport.addEventListener("pointerup", endDrag);
  projectHeroViewport.addEventListener("pointercancel", endDrag);

  /* A drag must never follow the card's link. */
  projectHeroViewport.addEventListener(
    "click",
    (event) => {
      if (dragMoved > 8) {
        event.preventDefault();
        event.stopPropagation();
      }
      dragMoved = 0;
    },
    true,
  );

  projectHeroViewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudge(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nudge(1);
    }
  });

  previousButton?.addEventListener("click", () => nudge(-1));
  nextButton?.addEventListener("click", () => nudge(1));

  /* Hovering deliberately does NOT pause the row; only holding the pointer
     down stops it. Keyboard focus also holds it (so it can be operated with
     the arrow keys), but clicking to drag must not: a mouse click focuses the
     viewport too, and treating that as a hold left the row parked until the
     visitor clicked somewhere else. :focus-visible separates the two. */
  projectHeroViewport.addEventListener("focusin", (event) => {
    const target =
      event.target instanceof Element ? event.target : projectHeroViewport;
    let keyboardVisit = false;
    try {
      keyboardVisit = target.matches(":focus-visible");
    } catch {
      keyboardVisit = false;
    }
    if (!keyboardVisit) return;
    focusHeld = true;
  });
  projectHeroViewport.addEventListener("focusout", (event) => {
    if (
      event.relatedTarget instanceof Node &&
      projectHeroViewport.contains(event.relatedTarget)
    )
      return;
    focusHeld = false;
    start();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      entries.forEach((entry) => entry.video.pause());
      stop();
    } else {
      start();
    }
  });

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const previous = setWidth > 0 ? offset / setWidth : 0;
        build();
        offset = previous * setWidth;
        wrap();
        render();
        start();
      }, 180);
    },
    { passive: true },
  );

  if (typeof heroReducedMotion.addEventListener === "function") {
    heroReducedMotion.addEventListener("change", () => {
      projectHero.classList.toggle("is-static", heroReducedMotion.matches);
      start();
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (observed) => {
        observed.forEach((record) => {
          visible = record.isIntersecting;
          if (visible) {
            start();
          } else {
            entries.forEach((entry) => entry.video.pause());
            stop();
          }
        });
      },
      { threshold: 0.05 },
    );
    observer.observe(projectHero);
  }

  build();
  // Start part-way into the strip so cards are already cropped at both edges.
  offset = pitch / 2;
  projectHero.classList.toggle("is-static", heroReducedMotion.matches);
  projectHero.classList.add("is-ready");
  render();
  start();
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
