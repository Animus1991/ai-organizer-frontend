// Utility functions for the application
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export formatBytes from formatters for backward compatibility
export { formatBytes } from "../utils/formatters";
