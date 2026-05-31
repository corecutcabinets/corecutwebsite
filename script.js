const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const navDropdowns = document.querySelectorAll(".nav-dropdown");
const mobileNavToggles = document.querySelectorAll(".mobile-nav-toggle");
const leadForms = document.querySelectorAll(".lead-form");
const introOverlay = document.querySelector(".intro-overlay");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const localAssetImages = document.querySelectorAll('img[src^="./assets/"], img[src^="assets/"]');
const localPageLinks = {
  "/": "index.html",
  "/residential": "residential.html",
  "/commercial": "commercial.html",
  "/gallery": "gallery.html",
  "/before-after": "before-after.html",
  "/book-design-call": "contact.html",
  "/our-process": "our-process.html",
  "/our-approach": "our-approach.html",
  "/installation-service": "installation-service.html",
  "/showroom": "showroom.html",
  "/about": "about.html",
  "/contact": "contact.html",
};
const phonePattern = /^1?\d{10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const calendlyBaseUrl = "https://calendly.com/corecutcabinets/30min";

const getFormValue = (formData, name) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

const buildCalendlyUrl = (formData) => {
  const url = new URL(calendlyBaseUrl);
  const customAnswers = [
    getFormValue(formData, "phone"),
    getFormValue(formData, "project_type"),
    getFormValue(formData, "preferred_contact_method"),
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

  if (window.Calendly && typeof window.Calendly.initInlineWidget === "function") {
    window.Calendly.initInlineWidget({
      url,
      parentElement: widget,
    });
    return;
  }

  if (attempts < 12) {
    window.setTimeout(() => renderCalendlyWidget(widget, url, attempts + 1), 250);
  }
};

const closeMobileSubmenus = (activeGroup) => {
  document.querySelectorAll(".mobile-nav-group").forEach((group) => {
    if (group === activeGroup) return;

    group.classList.remove("is-open");
    group.querySelector(".mobile-nav-toggle")?.setAttribute("aria-expanded", "false");
  });
};

const closeMobileMenu = () => {
  menuButton?.setAttribute("aria-expanded", "false");
  mobileMenu?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  closeMobileSubmenus();
};

const closeNavDropdowns = (activeDropdown) => {
  navDropdowns.forEach((dropdown) => {
    if (dropdown === activeDropdown) return;

    dropdown.classList.remove("is-open");
    dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
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
  if (!(image instanceof HTMLImageElement) || image.dataset.assetRetry === "true") return;
  if (window.location.protocol === "file:") return;

  const assetPath = image.getAttribute("src")?.replace(/^\.\//, "");
  if (!assetPath?.startsWith("assets/")) return;

  image.dataset.assetRetry = "true";
  image.src = `/${assetPath}`;
};

localAssetImages.forEach((image) => {
  image.addEventListener("error", () => retryFromSiteRoot(image));

  if (image instanceof HTMLImageElement && image.complete && image.naturalWidth === 0) {
    retryFromSiteRoot(image);
  }
});

document.addEventListener(
  "click",
  (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;

    if (link instanceof HTMLAnchorElement && (link.closest(".mobile-nav") || link.getAttribute("href") === "/contact")) {
      closeMobileMenu();
    }

    if (!(event.target instanceof Element) || !event.target.closest(".nav-dropdown")) {
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
  }
});

document.querySelectorAll('a[href^="/"]:not([href^="//"])').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (window.location.protocol !== "file:" || !(link instanceof HTMLAnchorElement)) return;

    const href = link.getAttribute("href") || "";
    const [cleanPath, hash] = href.split("#");
    const localTarget = localPageLinks[cleanPath];
    if (!localTarget) return;

    closeMobileMenu();
    event.preventDefault();
    window.location.href = hash ? localTarget + "#" + hash : localTarget;
  });
});

if (introOverlay) {
  const introStorageKey = "corecutIntroSeen";
  const prefersReducedMotion = reduceMotionQuery.matches;
  let introSeen = false;

  try {
    introSeen = sessionStorage.getItem(introStorageKey) === "true";
  } catch {
    introSeen = false;
  }

  const hideIntro = () => {
    introOverlay.classList.add("is-hidden");
    window.setTimeout(() => introOverlay.remove(), prefersReducedMotion ? 0 : 340);
  };

  if (introSeen || prefersReducedMotion) {
    hideIntro();
  } else {
    introOverlay.setAttribute("aria-hidden", "false");
    try {
      sessionStorage.setItem(introStorageKey, "true");
    } catch {
      // The intro can still run normally if browser storage is unavailable.
    }
    window.setTimeout(hideIntro, 2350);
  }
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("nav-open", !isOpen);
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeMobileMenu();
  }
});

window.addEventListener("pageshow", closeMobileMenu);
closeMobileMenu();

const clampPercent = (value) => Math.min(100, Math.max(0, value));

const valuesSection = document.querySelector("[data-values-section]");
const valuesViewport = document.querySelector("[data-values-viewport]");
const valuesTrack = document.querySelector("[data-values-track]");
const valueCards = Array.from(document.querySelectorAll("[data-value-card]"));
const valuesMobileQuery = window.matchMedia("(max-width: 980px)");

const setValuesScroll = () => {
  if (!valuesSection || !valuesViewport || !valuesTrack || valueCards.length === 0) return;

  if (reduceMotionQuery.matches) {
    valuesSection.style.setProperty("--values-x", "0px");
    valuesSection.style.setProperty("--values-progress", "100%");
    valueCards.forEach((card) => card.classList.add("is-active"));
    return;
  }

  const sectionRect = valuesSection.getBoundingClientRect();
  const stickyOffset = valuesMobileQuery.matches ? 74 : 82;
  const scrollableDistance = Math.max(1, valuesSection.offsetHeight - window.innerHeight + stickyOffset);
  const progress = clampPercent(((-sectionRect.top + stickyOffset) / scrollableDistance) * 100);
  const maxShift = Math.max(0, valuesTrack.scrollWidth - valuesViewport.clientWidth);
  const shift = -maxShift * (progress / 100);
  let activeCard = valueCards[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  valuesSection.style.setProperty("--values-x", shift + "px");
  valuesSection.style.setProperty("--values-progress", progress + "%");

  const viewportCenter = valuesViewport.clientWidth / 2;

  valueCards.forEach((card) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2 + shift;
    const distance = Math.abs(cardCenter - viewportCenter);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      activeCard = card;
    }
  });

  valueCards.forEach((card) => card.classList.toggle("is-active", card === activeCard));
};

if (valuesSection && valuesViewport && valuesTrack && valueCards.length > 0) {
  let valuesTicking = false;
  const requestValuesUpdate = () => {
    if (valuesTicking) return;
    valuesTicking = true;
    window.requestAnimationFrame(() => {
      setValuesScroll();
      valuesTicking = false;
    });
  };

  window.addEventListener("scroll", requestValuesUpdate, { passive: true });
  window.addEventListener("resize", requestValuesUpdate);
  window.addEventListener("load", requestValuesUpdate);
  window.addEventListener("pageshow", requestValuesUpdate);
  valuesMobileQuery.addEventListener?.("change", requestValuesUpdate);
  reduceMotionQuery.addEventListener?.("change", requestValuesUpdate);
  setValuesScroll();
  window.setTimeout(requestValuesUpdate, 120);
}

const processTimeline = document.querySelector("[data-process-timeline]");
const processSteps = Array.from(document.querySelectorAll("[data-process-step]"));

if (processTimeline && processSteps.length > 0) {
  const setActiveProcessStep = () => {
    const timelineRect = processTimeline.getBoundingClientRect();
    const progressAnchor = window.innerHeight * 0.52;
    const progress = clampPercent(((progressAnchor - timelineRect.top) / timelineRect.height) * 100);
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

const comparisonSliders = document.querySelectorAll("[data-comparison]");

const setComparisonPosition = (slider, clientX) => {
  const rect = slider.getBoundingClientRect();
  const rawPosition = ((clientX - rect.left) / rect.width) * 100;
  const position = Math.min(100, Math.max(0, rawPosition));

  slider.style.setProperty("--position", position + "%");
  slider.querySelector(".comparison-handle")?.setAttribute("aria-valuenow", String(Math.round(position)));
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
    slider.addEventListener(eventName, () => slider.classList.remove("is-dragging"));
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
    const schedulerSuccess = schedulerFlow?.querySelector("[data-scheduler-success]");
    const schedulerPanel = schedulerFlow?.querySelector("[data-scheduler-panel]");
    const calendlyWidget = schedulerFlow?.querySelector("[data-calendly-widget]");
    const schedulerFallback = schedulerFlow?.querySelector("[data-scheduler-fallback]");
    const honeypotInput = form.querySelector("input[name=\"_gotcha\"]");
    const isSchedulerForm = form.hasAttribute("data-scheduler-form");

    if (honeypotInput instanceof HTMLInputElement && honeypotInput.value.trim()) {
      form.reset();
      return;
    }

    const phoneInput = form.querySelector('input[name="phone"]');
    const emailInput = form.querySelector('input[name="email"]');
    const phoneValue = phoneInput instanceof HTMLInputElement ? phoneInput.value.trim() : "";
    const emailValue = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
    if (phoneInput instanceof HTMLInputElement) phoneInput.value = phoneValue;
    if (emailInput instanceof HTMLInputElement) emailInput.value = emailValue;
    const phoneDigits = phoneValue.replace(/\D/g, "");
    const hasFullPhone = phonePattern.test(phoneDigits);
    const hasValidEmail = emailPattern.test(emailValue);

    phoneInput?.setCustomValidity(hasFullPhone ? "" : "Enter a full 10-digit phone number, like 780-123-4567.");
    emailInput?.setCustomValidity(hasValidEmail ? "" : "Enter a valid email address with a domain, like name@example.com.");

    if (!hasFullPhone || !hasValidEmail || !form.checkValidity()) {
      form.reportValidity();
      if (formMessage) {
        formMessage.textContent = "Please enter every field with a full phone number and a valid email address.";
      }
      return;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Quote request failed");
      }

      form.reset();

      if (isSchedulerForm) {
        const calendlyUrl = buildCalendlyUrl(formData);

        form.hidden = true;
        if (formMessage) {
          formMessage.textContent = "";
        }
        if (schedulerFallback instanceof HTMLAnchorElement) {
          schedulerFallback.href = calendlyUrl;
        }
        schedulerSuccess?.removeAttribute("hidden");
        schedulerPanel?.removeAttribute("hidden");
        renderCalendlyWidget(calendlyWidget, calendlyUrl);
        schedulerPanel?.scrollIntoView({ behavior: reduceMotionQuery.matches ? "auto" : "smooth", block: "start" });
        return;
      }

      if (formMessage) {
        formMessage.textContent = "Thank you. Your quote request has been sent to Corecut Cabinets.";
      }
    } catch {
      if (formMessage) {
        formMessage.textContent = "Sorry, the quote request could not be sent. Please try again or email us directly.";
      }
    }
  });
});
