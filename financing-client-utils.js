// @ts-check

/** @param {unknown} value */
export function toMoneyNumber(value) {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.replace(/[$,\s]/g, "");
  return normalized ? Number(normalized) : Number.NaN;
}

/**
 * @param {number} amount
 * @param {number} downPayment
 */
export function financedAmount(amount, downPayment) {
  if (!Number.isFinite(amount) || !Number.isFinite(downPayment))
    return Number.NaN;
  return Math.max(0, amount - downPayment);
}

/**
 * Fixed business payment terms: a flat service fee applied to the financed
 * amount, repaid in equal weekly payments. Mirrors BUSINESS_PLANS in
 * financing.js.
 */
export const BUSINESS_PLANS = Object.freeze([
  Object.freeze({ id: "weeks-4", label: "4 weeks", weeks: 4, rate: 0 }),
  Object.freeze({ id: "weeks-8", label: "8 weeks", weeks: 8, rate: 0.99 }),
  Object.freeze({ id: "weeks-12", label: "12 weeks", weeks: 12, rate: 2.99 }),
  Object.freeze({ id: "weeks-26", label: "26 weeks", weeks: 26, rate: 4.99 }),
  Object.freeze({ id: "weeks-52", label: "52 weeks", weeks: 52, rate: 9.99 }),
]);

export const DEFAULT_BUSINESS_PLAN_ID = "weeks-26";

/**
 * @typedef {object} BusinessBreakdown
 * @property {number} originalPrice
 * @property {number} serviceFee
 * @property {number} total
 * @property {number} weekly
 * @property {number} weeks
 */

/**
 * serviceFee = financed × rate / 100; total = financed + serviceFee;
 * weekly = total / weeks. Mirrors businessPaymentBreakdown in financing.js.
 *
 * @param {number} financed
 * @param {{ weeks: number; rate: number }} plan
 * @returns {BusinessBreakdown | null}
 */
export function businessPaymentBreakdown(financed, plan) {
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
}

/**
 * @param {number} financed
 * @param {{ weeks: number; rate: number }} plan
 */
export function businessWeeklyPayment(financed, plan) {
  return businessPaymentBreakdown(financed, plan)?.weekly ?? Number.NaN;
}

/**
 * @typedef {object} HomeownerPaymentResult
 * @property {number} amountFinanced
 * @property {number} monthlyPayment
 * @property {number} estimatedWeeklyPayment
 * @property {number} totalRepayment
 * @property {number} totalInterest
 * @property {number} numberOfMonthlyPayments
 */

/** @returns {HomeownerPaymentResult} */
function emptyHomeownerPaymentResult() {
  return {
    amountFinanced: 0,
    monthlyPayment: 0,
    estimatedWeeklyPayment: 0,
    totalRepayment: 0,
    totalInterest: 0,
    numberOfMonthlyPayments: 0,
  };
}

/**
 * Standard fixed-term monthly amortization. The budgeting-only weekly estimate
 * is one quarter of the monthly payment after the monthly payment is rounded
 * to cents. Mirrors calculateHomeownerPayment in financing.js.
 *
 * @param {number} projectAmount
 * @param {number} downPayment
 * @param {number} annualInterestRate
 * @param {number} termMonths
 * @returns {HomeownerPaymentResult}
 */
export function calculateHomeownerPayment(
  projectAmount,
  downPayment,
  annualInterestRate,
  termMonths,
) {
  if (
    !Number.isFinite(projectAmount) ||
    !Number.isFinite(downPayment) ||
    !Number.isFinite(annualInterestRate) ||
    !Number.isFinite(termMonths)
  ) {
    return emptyHomeownerPaymentResult();
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
    return emptyHomeownerPaymentResult();
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
    return emptyHomeownerPaymentResult();
  }

  return {
    amountFinanced,
    monthlyPayment,
    estimatedWeeklyPayment,
    totalRepayment,
    totalInterest,
    numberOfMonthlyPayments,
  };
}

/**
 * @param {{ email: string; phone: string; consent: boolean }} values
 */
export function validateFinancingContact(values) {
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
}
