import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function interpolate(template: string, obj: Record<string, unknown>): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => String(obj[key] ?? ""))
}