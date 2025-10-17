/*
 * Unified logger for dev & production (Tauri desktop / web).
 * - Persists to file in Tauri via @tauri-apps/plugin-log
 * - Falls back to console in web or when plugin not available
 * - Captures window errors and unhandled rejections
 */
import type { AxiosError } from "axios";
import * as TauriLog from "@tauri-apps/plugin-log";
import { appLogDir, join } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";

function fmt(input: unknown): string {
  try {
    if (typeof input === "string") return input;
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

// 内存日志缓冲，便于在 UI 中查看最近日志
const MEM_LIMIT = 500;
const memBuffer: string[] = [];
const listeners = new Set<(lines: string[]) => void>();

function notify() {
  const snapshot = [...memBuffer];
  for (const cb of listeners) cb(snapshot);
}

function pushMem(level: "DEBUG" | "INFO" | "WARN" | "ERROR", text: string) {
  const line = `[${new Date().toISOString()}] [${level}] ${text}`;
  memBuffer.push(line);
  if (memBuffer.length > MEM_LIMIT) {
    memBuffer.splice(0, memBuffer.length - MEM_LIMIT);
  }
  notify();
}

// Attach browser console to Tauri log file when available (no-op in web)
try {
  // Will forward console.debug/info/warn/error to the plugin targets
  // Requires capability: "log:default" in src-tauri/capabilities/default.json
  (TauriLog as any).attachConsole?.();
} catch (err) {
  // ignore when plugin or capability is not available
}

export function getLogBuffer(): string[] {
  return [...memBuffer];
}

export function onLogUpdate(cb: (lines: string[]) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function logDebug(message: unknown, meta?: unknown) {
  const text = meta ? `${fmt(message)} | ${fmt(meta)}` : fmt(message);
  pushMem("DEBUG", text);
  try {
    await TauriLog.debug(text);
  } catch {
    console.debug("[DEBUG]", text);
  }
}

export async function logInfo(message: unknown, meta?: unknown) {
  const text = meta ? `${fmt(message)} | ${fmt(meta)}` : fmt(message);
  pushMem("INFO", text);
  try {
    await TauriLog.info(text);
  } catch {
    console.info("[INFO]", text);
  }
}

export async function logWarn(message: unknown, meta?: unknown) {
  const text = meta ? `${fmt(message)} | ${fmt(meta)}` : fmt(message);
  pushMem("WARN", text);
  try {
    await TauriLog.warn(text);
  } catch {
    console.warn("[WARN]", text);
  }
}

export async function logError(message: unknown, meta?: unknown) {
  const text = meta ? `${fmt(message)} | ${fmt(meta)}` : fmt(message);
  pushMem("ERROR", text);
  try {
    await TauriLog.error(text);
  } catch {
    console.error("[ERROR]", text);
  }
}

export async function logPhase(phase: string, detail?: unknown) {
  await logInfo(`[startup] ${phase}`, detail);
}

export function initGlobalErrorCapture() {
  // window.onerror
  window.addEventListener("error", async (ev) => {
    const info = {
      message: ev.message,
      filename: (ev as ErrorEvent).filename,
      lineno: (ev as ErrorEvent).lineno,
      colno: (ev as ErrorEvent).colno,
      stack: (ev.error && (ev.error as Error).stack) || undefined,
    };
    await logError("window.error", info);
  });
  // unhandled promise
  window.addEventListener("unhandledrejection", async (ev) => {
    let payload: unknown = ev.reason;
    if (ev.reason instanceof Error) {
      payload = { message: ev.reason.message, stack: ev.reason.stack };
    }
    await logError("unhandledrejection", payload);
  });
}

export async function logAxiosError(err: unknown) {
  const e = err as AxiosError;
  const detail = {
    message: e.message,
    code: e.code,
    url: e.config?.url,
    method: e.config?.method,
    status: e.response?.status,
    data: e.response?.data,
  };
  await logError("axios.error", detail);
}

export async function getAppLogPath(): Promise<string | undefined> {
  try {
    const dir = await appLogDir();
    return await join(dir, "app.log");
  } catch (e) {
    // web 场景会失败，返回 undefined
    return undefined;
  }
}

export async function readAppLogText(): Promise<string | undefined> {
  try {
    const path = await getAppLogPath();
    if (!path) return undefined;
    return await readTextFile(path);
  } catch (e) {
    await logWarn("readAppLogText failed", String(e));
    return undefined;
  }
}