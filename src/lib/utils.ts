import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value == null || Number.isNaN(value)) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCompactCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value == null || Number.isNaN(value)) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value == null || Number.isNaN(value)) return "Not available";
  return `${value.toFixed(decimals)}%`;
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return /^(true|1|yes|y)$/i.test(value.trim());
  return false;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
