import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract PAN from GSTIN (characters at index 2–11). */
export function extractPAN(gstin: string): string {
  if (!gstin || gstin.length < 12) return "";
  return gstin.substring(2, 12);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy") {
  return format(new Date(date), pattern);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function financialYearFromDate(value: string | Date) {
  const date = new Date(value);
  const year = date.getMonth() + 1 >= 4 ? date.getFullYear() : date.getFullYear() - 1;
  const nextYear = (year + 1).toString().slice(-2);
  return {
    startYear: year,
    endYear: year + 1,
    label: `${year.toString().slice(-2)}${nextYear}`,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertBelowThousand(value: number): string {
  let result = "";
  if (value >= 100) {
    result += `${ones[Math.floor(value / 100)]} Hundred `;
    value %= 100;
  }
  if (value >= 20) {
    result += `${tens[Math.floor(value / 10)]} `;
    value %= 10;
  }
  if (value > 0) {
    result += `${ones[value]} `;
  }
  return result.trim();
}

export function amountToWords(amount: number) {
  if (!amount) return "Zero Rupees Only";

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  const parts = [
    crore ? `${convertBelowThousand(crore)} Crore` : "",
    lakh ? `${convertBelowThousand(lakh)} Lakh` : "",
    thousand ? `${convertBelowThousand(thousand)} Thousand` : "",
    remainder ? convertBelowThousand(remainder) : "",
  ].filter(Boolean);

  const base = `${parts.join(" ")} Rupees`;
  return decimalPart
    ? `${base} and ${convertBelowThousand(decimalPart)} Paise Only`
    : `${base} Only`;
}
