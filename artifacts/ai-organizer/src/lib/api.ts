/**
 * Backward-compatibility shim.
 * The monolithic api.ts was split into src/lib/api/ modules.
 * This file exists so that any stale Vite HMR references resolve.
 */
export * from "./api/index";
