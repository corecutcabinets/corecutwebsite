const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const leadForms = document.querySelectorAll(".lead-form");
const introOverlay = document.querySelector(".intro-overlay");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

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
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    menuButton?.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
  }
});

leadForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement)) return;

    const formMessage = form.querySelector(".form-message");

    if (!form.checkValidity()) {
      form.reportValidity();
      if (formMessage) {
        formMessage.textContent = "Please fill out every field with a valid email address.";
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
      if (formMessage) {
        formMessage.textContent = "Thank you. Your quote request has been sent to CoreCut Cabinets.";
      }
    } catch {
      if (formMessage) {
        formMessage.textContent = "Sorry, the quote request could not be sent. Please try again or email us directly.";
      }
    }
  });
});
