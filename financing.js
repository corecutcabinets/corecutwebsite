// Keep this entry point as a classic script so the static-site preview also
// works when an HTML file is opened directly from disk.
const toMoneyNumber = (value) => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.replace(/[$,\s]/g, "");
  return normalized ? Number(normalized) : Number.NaN;
};

const financedAmount = (amount, downPayment) => {
  if (!Number.isFinite(amount) || !Number.isFinite(downPayment))
    return Number.NaN;
  return Math.max(0, amount - downPayment);
};

// Fixed business payment terms: a flat service fee applied to the financed
// amount, repaid in equal weekly payments. Keep in sync with the mirror in
// financing-client-utils.js.
const BUSINESS_PLANS = [
  { id: "weeks-4", label: "4 weeks", weeks: 4, rate: 0 },
  { id: "weeks-8", label: "8 weeks", weeks: 8, rate: 0.99 },
  { id: "weeks-12", label: "12 weeks", weeks: 12, rate: 2.99 },
  { id: "weeks-26", label: "26 weeks", weeks: 26, rate: 4.99 },
  { id: "weeks-52", label: "52 weeks", weeks: 52, rate: 9.99 },
];

const DEFAULT_BUSINESS_PLAN_ID = "weeks-26";

// serviceFee = financed × rate / 100; total = financed + serviceFee;
// weekly = total / weeks.
const businessPaymentBreakdown = (financed, plan) => {
  if (!Number.isFinite(financed) || financed <= 0 || !plan) return null;
  const serviceFee = (financed * plan.rate) / 100;
  const total = financed + serviceFee;
  return {
    originalPrice: financed,
    serviceFee,
    total,
    weekly: total / plan.weeks,
    weeks: plan.weeks,
  };
};

const businessWeeklyPayment = (financed, plan) =>
  businessPaymentBreakdown(financed, plan)?.weekly ?? Number.NaN;

// Standard fixed-term monthly amortization. The budgeting-only weekly estimate
// is one quarter of the monthly payment after the monthly payment is rounded
// to cents. Keep this in sync with financing-client-utils.js.
const calculateHomeownerPayment = (
  projectAmount,
  downPayment,
  annualInterestRate,
  termMonths,
) => {
  const emptyResult = {
    amountFinanced: 0,
    monthlyPayment: 0,
    estimatedWeeklyPayment: 0,
    totalRepayment: 0,
    totalInterest: 0,
    numberOfMonthlyPayments: 0,
  };

  if (
    !Number.isFinite(projectAmount) ||
    !Number.isFinite(downPayment) ||
    !Number.isFinite(annualInterestRate) ||
    !Number.isFinite(termMonths)
  ) {
    return emptyResult;
  }

  const amountFinanced = projectAmount - downPayment;
  if (
    projectAmount <= 0 ||
    downPayment < 0 ||
    downPayment > projectAmount ||
    amountFinanced <= 0 ||
    annualInterestRate < 0 ||
    termMonths <= 0
  ) {
    return emptyResult;
  }

  const numberOfMonthlyPayments = Math.round(termMonths);
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const compoundFactor = Math.pow(
    1 + monthlyInterestRate,
    numberOfMonthlyPayments,
  );
  const rawMonthlyPayment =
    annualInterestRate === 0
      ? amountFinanced / numberOfMonthlyPayments
      : amountFinanced *
        ((monthlyInterestRate * compoundFactor) / (compoundFactor - 1));
  const monthlyPayment =
    Math.round((rawMonthlyPayment + Number.EPSILON) * 100) / 100;
  const estimatedWeeklyPayment = monthlyPayment / 4;
  const totalRepayment = monthlyPayment * numberOfMonthlyPayments;
  const totalInterest = Math.max(0, totalRepayment - amountFinanced);

  if (
    !Number.isFinite(monthlyPayment) ||
    !Number.isFinite(estimatedWeeklyPayment) ||
    !Number.isFinite(totalRepayment) ||
    monthlyPayment < 0 ||
    estimatedWeeklyPayment < 0 ||
    totalRepayment < 0
  ) {
    return emptyResult;
  }

  return {
    amountFinanced,
    monthlyPayment,
    estimatedWeeklyPayment,
    totalRepayment,
    totalInterest,
    numberOfMonthlyPayments,
  };
};

const validateFinancingContact = (values) => {
  const errors = {};
  const phoneDigits = values.phone.replace(/\D/g, "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address, like name@example.com.";
  }

  if (!/^1?\d{10}$/.test(phoneDigits)) {
    errors.phone = "Enter a full 10-digit phone number, like 780-123-4567.";
  }

  if (!values.consent) {
    errors.consent =
      "Consent is required before Corecut can contact you about financing options.";
  }

  return errors;
};

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const paymentFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const track = (eventName, properties = {}) => {
  if (typeof window.corecutTrack === "function") {
    window.corecutTrack(eventName, properties);
  }
};

const pageEventByType = {
  hub: "financing_hub_view",
  homeowner: "homeowner_financing_view",
  business: "business_financing_view",
};

const pageType = document.body.dataset.financingPage;
if (pageType && pageEventByType[pageType]) track(pageEventByType[pageType]);

const syncFaqSchema = () => {
  const schemaElement = document.querySelector("[data-faq-schema]");
  const faqItems = Array.from(document.querySelectorAll("[data-faq-item]"));
  if (!(schemaElement instanceof HTMLScriptElement) || faqItems.length === 0)
    return;

  const mainEntity = faqItems.flatMap((item) => {
    const summary = item.querySelector("summary")?.textContent?.trim();
    const answer = item
      .querySelector("[data-faq-answer]")
      ?.textContent?.replace(/\s+/g, " ")
      .trim();
    return summary && answer
      ? [
          {
            "@type": "Question",
            name: summary,
            acceptedAnswer: { "@type": "Answer", text: answer },
          },
        ]
      : [];
  });

  schemaElement.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  });
};

const applyPublicSettings = async () => {
  if (window.location.protocol === "file:") return;

  try {
    const response = await fetch("/api/financing/public-settings", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;

    const settings = await response.json();
    if (settings.disclosure?.text) {
      document
        .querySelectorAll("[data-financing-disclosure]")
        .forEach((element) => {
          const base =
            element.getAttribute("data-base-disclosure") ||
            element.textContent.trim();
          element.textContent =
            settings.disclosure.mode === "replace"
              ? settings.disclosure.text
              : `${base} ${settings.disclosure.text}`;
        });
    }

    if (settings.businessCreditCheckAnswer) {
      const answer = document.querySelector("[data-business-credit-answer]");
      if (answer) answer.textContent = settings.businessCreditCheckAnswer;
    }

    syncFaqSchema();
  } catch {
    // Static defaults remain complete and accurate if public settings are unavailable.
  }
};

applyPublicSettings();

document
  .querySelectorAll("[data-financing-calculator]")
  .forEach((calculator) => {
    if (!(calculator instanceof HTMLElement)) return;

    const mode = calculator.dataset.mode;
    const amountInput = calculator.querySelector("[data-amount-input]");
    const amountRange = calculator.querySelector("[data-amount-range]");
    const downPaymentInput = calculator.querySelector("[data-down-payment]");
    const interestRateInput = calculator.querySelector("[data-interest-rate]");
    const homeownerTermInput = calculator.querySelector(
      "[data-homeowner-term]",
    );
    const homeownerTermRange = calculator.querySelector(
      "[data-homeowner-term-range]",
    );
    const amountOutput = calculator.querySelector(
      "[data-project-amount-output]",
    );
    const financedOutput = calculator.querySelector(
      "[data-financed-amount-output]",
    );
    const resultStatus = calculator.querySelector("[data-result-status]");
    const estimateOutput = calculator.querySelector("[data-estimate-output]");
    const planDisclosure = calculator.querySelector("[data-plan-disclosure]");
    // The total appears twice in the Tabit-style panel (headline tile and fee
    // breakdown row), so every hook is collected as a list.
    const breakdownOutputs = {
      original: calculator.querySelectorAll("[data-breakdown-original]"),
      fee: calculator.querySelectorAll("[data-breakdown-fee]"),
      total: calculator.querySelectorAll("[data-breakdown-total]"),
      duration: calculator.querySelectorAll("[data-breakdown-duration]"),
    };
    const printButton = calculator.querySelector("[data-calculator-print]");
    const planRadios = Array.from(
      calculator.querySelectorAll("[data-plan-radio]"),
    ).filter((radio) => radio instanceof HTMLInputElement);
    const inquiryForm = document.querySelector(
      mode === "homeowner" ? "#homeowner-inquiry" : "#business-inquiry",
    );
    const inquiryAmount = inquiryForm?.querySelector(
      "[data-form-calculator-amount]",
    );
    const inquiryPreference = inquiryForm?.querySelector(
      "[data-form-payment-preference]",
    );
    let started = false;
    let lastTrackedPlan = "";

    // The amount slider is optional: the business calculator is number-entry
    // only, while the homeowner one still pairs an input with a range.
    if (!(amountInput instanceof HTMLInputElement)) return;
    if (!(downPaymentInput instanceof HTMLInputElement)) return;

    const markStarted = () => {
      if (started) return;
      started = true;
      track("financing_calculator_started", { mode });
    };

    const trackEstimateViewed = (planId) => {
      if (lastTrackedPlan === planId) return;
      lastTrackedPlan = planId;
      track(
        "financing_estimate_viewed",
        mode === "business" ? { mode, plan: planId } : { mode },
      );
    };

    const selectedBusinessPlan = () => {
      const checked = planRadios.find((radio) => radio.checked);
      return (
        BUSINESS_PLANS.find((plan) => plan.id === checked?.value) ||
        BUSINESS_PLANS.find((plan) => plan.id === DEFAULT_BUSINESS_PLAN_ID) ||
        BUSINESS_PLANS[0]
      );
    };

    const currentValues = () => {
      const amount = toMoneyNumber(amountInput.value);
      const downPayment = toMoneyNumber(downPaymentInput.value || "0");
      return {
        amount,
        downPayment,
        financed: financedAmount(amount, downPayment),
      };
    };

    const updateSummary = () => {
      const values = currentValues();
      const minimum = Number(amountInput.min);
      const maximum = Number(amountInput.max);
      const validAmount =
        Number.isFinite(values.amount) &&
        values.amount >= minimum &&
        values.amount <= maximum;
      const validDownPayment =
        Number.isFinite(values.downPayment) &&
        values.downPayment >= 0 &&
        values.downPayment < values.amount;

      downPaymentInput.setCustomValidity(
        validDownPayment
          ? ""
          : "The upfront payment must be zero or more and less than the project amount.",
      );
      amountInput.setCustomValidity(
        validAmount
          ? ""
          : `Enter an amount from ${currencyFormatter.format(minimum)} to ${currencyFormatter.format(maximum)}.`,
      );

      if (amountOutput)
        amountOutput.textContent = validAmount
          ? currencyFormatter.format(values.amount)
          : "Unavailable";
      if (financedOutput) {
        financedOutput.textContent =
          validAmount && validDownPayment
            ? mode === "homeowner"
              ? paymentFormatter.format(values.financed)
              : currencyFormatter.format(values.financed)
            : "Unavailable";
      }
      if (inquiryAmount instanceof HTMLInputElement) {
        inquiryAmount.value =
          validAmount && validDownPayment ? String(values.financed) : "";
      }
      if (
        inquiryPreference instanceof HTMLInputElement &&
        mode === "business"
      ) {
        const plan = selectedBusinessPlan();
        inquiryPreference.value = plan
          ? `${plan.weeks} weeks · ${plan.rate}% service fee`
          : "Not selected";
      }

      return validAmount && validDownPayment && values.financed >= minimum;
    };

    const renderBreakdown = (breakdown) => {
      const unavailable = "Unavailable";
      const write = (nodes, value) => {
        nodes.forEach((node) => {
          node.textContent = value;
        });
      };
      write(
        breakdownOutputs.original,
        breakdown ? paymentFormatter.format(breakdown.originalPrice) : unavailable,
      );
      write(
        breakdownOutputs.fee,
        breakdown ? paymentFormatter.format(breakdown.serviceFee) : unavailable,
      );
      write(
        breakdownOutputs.total,
        breakdown ? paymentFormatter.format(breakdown.total) : unavailable,
      );
      write(
        breakdownOutputs.duration,
        breakdown ? `${breakdown.weeks} weeks` : unavailable,
      );
    };

    const clearEstimate = () => {
      if (estimateOutput) estimateOutput.textContent = "";
      if (planDisclosure) planDisclosure.textContent = "";
      renderBreakdown(null);
    };

    const renderInquiryOnly = (message) => {
      calculator.classList.remove("has-estimate", "has-error");
      calculator.classList.add("is-inquiry-only");
      calculator.removeAttribute("aria-busy");
      if (resultStatus) {
        resultStatus.textContent =
          message ||
          "Enter your project amount to see estimated weekly payments. Final terms are confirmed after reviewing your application.";
      }
      clearEstimate();
    };

    const renderBusinessEstimate = () => {
      const summaryValid = updateSummary();
      const values = currentValues();

      // Selected-term styling is mirrored onto a class so the highlight does
      // not depend on `:has()` support. CSS carries both: `.is-selected` for
      // this path and `:has(input:checked)` so the term checked in the markup
      // still highlights with JS disabled.
      planRadios.forEach((radio) => {
        const card = radio.closest(".plan-card");
        if (card) card.classList.toggle("is-selected", radio.checked);
      });

      BUSINESS_PLANS.forEach((plan) => {
        const priceOutput = calculator.querySelector(
          `[data-plan-price="${plan.id}"]`,
        );
        if (!(priceOutput instanceof HTMLElement)) return;
        const payment = businessWeeklyPayment(values.financed, plan);
        priceOutput.textContent =
          summaryValid && Number.isFinite(payment)
            ? paymentFormatter.format(payment)
            : "Unavailable";
      });

      if (!summaryValid) {
        renderInquiryOnly(
          "Review the project amount and upfront payment to continue.",
        );
        return;
      }

      const plan = selectedBusinessPlan();
      const breakdown = businessPaymentBreakdown(values.financed, plan);
      if (!plan || !breakdown || !Number.isFinite(breakdown.weekly)) {
        renderInquiryOnly();
        return;
      }

      calculator.classList.remove("is-inquiry-only", "has-error");
      calculator.classList.add("has-estimate");
      // Tabit-style headline: the label, the amount, and "per week" as static
      // markup beneath it. The term is carried by the Duration tile.
      if (resultStatus) resultStatus.textContent = "Weekly payment";
      if (estimateOutput) {
        estimateOutput.textContent = paymentFormatter.format(breakdown.weekly);
      }
      if (planDisclosure) {
        planDisclosure.textContent = `Fixed weekly payments for ${plan.weeks} weeks. This estimate is for planning; final terms are confirmed with your financing agreement.`;
      }
      renderBreakdown(breakdown);
      trackEstimateViewed(plan.id);
    };

    const renderHomeownerEstimate = () => {
      if (
        !(interestRateInput instanceof HTMLInputElement) ||
        !(homeownerTermInput instanceof HTMLInputElement)
      ) {
        renderInquiryOnly();
        return;
      }

      const summaryValid = updateSummary();
      const annualRate = toMoneyNumber(interestRateInput.value);
      const months = Number(homeownerTermInput.value);
      const validRate =
        Number.isFinite(annualRate) && annualRate >= 0 && annualRate <= 35;
      const validTerm =
        Number.isInteger(months) && months >= 12 && months <= 240;

      interestRateInput.setCustomValidity(
        validRate ? "" : "Enter an interest rate from 0% to 35%.",
      );
      homeownerTermInput.setCustomValidity(
        validTerm ? "" : "Enter a repayment length from 12 to 240 months.",
      );

      if (!summaryValid) {
        renderInquiryOnly(
          "Review the project amount and down payment to continue.",
        );
        return;
      }

      if (!validRate || !validTerm) {
        renderInquiryOnly(
          "Enter an interest rate and a repayment length from 12 to 240 months to continue.",
        );
        return;
      }

      const values = currentValues();
      const paymentResult = calculateHomeownerPayment(
        values.amount,
        values.downPayment,
        annualRate,
        months,
      );

      if (paymentResult.estimatedWeeklyPayment <= 0) {
        renderInquiryOnly();
        return;
      }

      calculator.classList.remove("is-inquiry-only", "has-error");
      calculator.classList.add("has-estimate");
      if (resultStatus) resultStatus.textContent = "Estimated weekly payment";
      if (estimateOutput) {
        estimateOutput.textContent = `Approximately ${paymentFormatter.format(paymentResult.estimatedWeeklyPayment)} per week`;
      }
      if (planDisclosure) {
        planDisclosure.textContent =
          "Estimated weekly payment for budgeting purposes only. This amount is calculated by dividing the estimated monthly payment by four and may not represent the lender’s actual payment frequency or final payment amount. Actual rates, payments, terms, fees and approval conditions are determined by the financing provider.";
      }
      if (inquiryPreference instanceof HTMLInputElement) {
        inquiryPreference.value = `${annualRate}% planning rate · ${months} months · weekly payments`;
      }
      trackEstimateViewed("homeowner_weekly_estimate");
    };

    const renderEstimateForMode = () => {
      if (mode === "homeowner") renderHomeownerEstimate();
      else renderBusinessEstimate();
    };

    const handleValueInput = (event) => {
      markStarted();
      if (amountRange instanceof HTMLInputElement) {
        if (event.currentTarget === amountRange)
          amountInput.value = amountRange.value;
        if (event.currentTarget === amountInput) {
          const amount = toMoneyNumber(amountInput.value);
          if (Number.isFinite(amount)) amountRange.value = String(amount);
        }
      }
      if (
        homeownerTermInput instanceof HTMLInputElement &&
        homeownerTermRange instanceof HTMLInputElement
      ) {
        if (event.currentTarget === homeownerTermRange)
          homeownerTermInput.value = homeownerTermRange.value;
        if (event.currentTarget === homeownerTermInput) {
          const months = Number(homeownerTermInput.value);
          if (Number.isFinite(months))
            homeownerTermRange.value = String(months);
        }
      }
      renderEstimateForMode();
    };

    [
      amountInput,
      amountRange,
      downPaymentInput,
      interestRateInput,
      homeownerTermInput,
      homeownerTermRange,
    ]
      .filter((input) => input instanceof HTMLInputElement)
      .forEach((input) => input.addEventListener("input", handleValueInput));

    planRadios.forEach((radio) =>
      radio.addEventListener("change", () => {
        markStarted();
        renderBusinessEstimate();
      }),
    );

    // "Save as PDF" hands off to the browser's own print-to-PDF; a print
    // stylesheet reduces the page to the calculator. No export library.
    if (printButton instanceof HTMLElement) {
      printButton.addEventListener("click", () => window.print());
    }

    renderEstimateForMode();
  });

/* Why-financing cards: user-controlled, keyboard-accessible tabs. */
document.querySelectorAll("[data-why-tabs]").forEach((tabsRoot) => {
  if (!(tabsRoot instanceof HTMLElement)) return;
  const cards = Array.from(tabsRoot.querySelectorAll("[data-why-tab]"));
  const panels = Array.from(tabsRoot.querySelectorAll("[data-why-panel]"));
  if (cards.length === 0 || cards.length !== panels.length) return;

  tabsRoot.classList.add("is-enhanced");
  let activeIndex = 0;

  const setActiveTab = (index, focusCard) => {
    activeIndex = (index + cards.length) % cards.length;

    cards.forEach((card, i) => {
      const isActive = i === activeIndex;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-selected", String(isActive));
      if (card instanceof HTMLElement) card.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel, i) => {
      const isActive = i === activeIndex;
      panel.classList.toggle("is-active", isActive);
      panel.toggleAttribute("hidden", !isActive);
    });

    if (focusCard && cards[activeIndex] instanceof HTMLElement) {
      cards[activeIndex].focus({ preventScroll: true });
    }
  };

  cards.forEach((card, i) => {
    card.addEventListener("click", () => setActiveTab(i, false));

    card.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setActiveTab(activeIndex + 1, true);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveTab(activeIndex - 1, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveTab(0, true);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveTab(cards.length - 1, true);
      }
    });
  });

  setActiveTab(0, false);
});

/*
 * Homeowner financing hero with pointer parallax and a scroll-linked drift.
 * Both only write CSS custom properties; every transform lives in the
 * stylesheet, so the hero still renders correctly (just static) if this block
 * never runs. Reads are batched into one animation frame to stay off the
 * layout path, and the whole thing idles under reduced-motion.
 */
const financeHero = document.querySelector("[data-finance-hero]");
if (financeHero instanceof HTMLElement) {
  const heroReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 981px)",
  );

  let pointerX = 0;
  let pointerY = 0;
  let scrollDepth = 0;
  let heroFrame = 0;

  const paintHero = () => {
    heroFrame = 0;
    financeHero.style.setProperty("--fh-mx", pointerX.toFixed(3));
    financeHero.style.setProperty("--fh-my", pointerY.toFixed(3));
    financeHero.style.setProperty("--fh-scroll", scrollDepth.toFixed(3));
  };

  const scheduleHero = () => {
    if (heroFrame || heroReducedMotion.matches) return;
    heroFrame = window.requestAnimationFrame(paintHero);
  };

  const resetPointer = () => {
    pointerX = 0;
    pointerY = 0;
    scheduleHero();
  };

  financeHero.addEventListener("pointermove", (event) => {
    if (!finePointer.matches) return;
    const rect = financeHero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    scheduleHero();
  });
  financeHero.addEventListener("pointerleave", resetPointer);

  const updateHeroScroll = () => {
    const height = financeHero.offsetHeight || 1;
    scrollDepth = Math.min(1, Math.max(0, window.scrollY / height));
    scheduleHero();
  };

  window.addEventListener("scroll", updateHeroScroll, { passive: true });
  window.addEventListener("resize", updateHeroScroll, { passive: true });

  if (typeof finePointer.addEventListener === "function") {
    finePointer.addEventListener("change", resetPointer);
  }
  if (typeof heroReducedMotion.addEventListener === "function") {
    heroReducedMotion.addEventListener("change", () => {
      pointerX = 0;
      pointerY = 0;
      scrollDepth = 0;
      paintHero();
    });
  }

  updateHeroScroll();
}

document.querySelectorAll("[data-financing-form]").forEach((form) => {
  if (!(form instanceof HTMLFormElement)) return;
  const email = form.querySelector('input[name="email"]');
  const phone = form.querySelector('input[name="phone"]');
  const consent = form.querySelector('input[name="consent"]');

  form.addEventListener(
    "submit",
    (event) => {
      const errors = validateFinancingContact({
        email: email instanceof HTMLInputElement ? email.value : "",
        phone: phone instanceof HTMLInputElement ? phone.value : "",
        consent: consent instanceof HTMLInputElement ? consent.checked : true,
      });

      email?.setCustomValidity(errors.email || "");
      phone?.setCustomValidity(errors.phone || "");
      consent?.setCustomValidity(errors.consent || "");

      if (Object.keys(errors).length > 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        form.querySelector(".form-message").textContent =
          "Please review the highlighted contact fields.";
        form.reportValidity();
      }
    },
    true,
  );
});

document.addEventListener("corecut:form-success", (event) => {
  const form = event.detail?.form;
  if (
    !(form instanceof HTMLFormElement) ||
    !form.matches("[data-financing-form]")
  )
    return;
  const success = form.parentElement?.querySelector(
    "[data-financing-form-success]",
  );
  if (!(success instanceof HTMLElement)) return;

  form.hidden = true;
  success.hidden = false;
  success.querySelector("h3")?.setAttribute("tabindex", "-1");
  success.querySelector("h3")?.focus({ preventScroll: true });
  success.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
  });
});

syncFaqSchema();
