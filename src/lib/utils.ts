import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SafeStorage - A robust wrapper for localStorage and sessionStorage
 * Prevents crashes in environments where storage is restricted or null (like some APK WebViews)
 * Falls back to in-memory storage if persistence is unavailable.
 */
class SafeStorage implements Storage {
  private inMemoryData: Record<string, string> = {};
  private type: 'localStorage' | 'sessionStorage';

  constructor(type: 'localStorage' | 'sessionStorage') {
    this.type = type;
  }

  private get storage(): Storage | null {
    try {
      if (typeof window === 'undefined') return null;
      const s = window[this.type];
      return s || null;
    } catch (e) {
      return null;
    }
  }

  get length(): number {
    const s = this.storage;
    return s ? s.length : Object.keys(this.inMemoryData).length;
  }

  clear(): void {
    const s = this.storage;
    if (s) {
      try {
        s.clear();
      } catch (e) {
        this.inMemoryData = {};
      }
    } else {
      this.inMemoryData = {};
    }
  }

  getItem(key: string): string | null {
    const s = this.storage;
    if (s) {
      try {
        return s.getItem(key);
      } catch (e) {
        return this.inMemoryData[key] || null;
      }
    }
    return this.inMemoryData[key] || null;
  }

  key(index: number): string | null {
    const s = this.storage;
    if (s) {
      try {
        return s.key(index);
      } catch (e) {
        return Object.keys(this.inMemoryData)[index] || null;
      }
    }
    return Object.keys(this.inMemoryData)[index] || null;
  }

  removeItem(key: string): void {
    const s = this.storage;
    if (s) {
      try {
        s.removeItem(key);
      } catch (e) {
        delete this.inMemoryData[key];
      }
    } else {
      delete this.inMemoryData[key];
    }
  }

  setItem(key: string, value: string): void {
    const s = this.storage;
    if (s) {
      try {
        s.setItem(key, value);
      } catch (e) {
        this.inMemoryData[key] = String(value);
      }
    } else {
      this.inMemoryData[key] = String(value);
    }
  }
}

export const safeLocalStorage = new SafeStorage('localStorage');
export const safeSessionStorage = new SafeStorage('sessionStorage');

/**
 * Generates a unique ID (UUID v4)
 * Uses crypto.randomUUID() if available (secure contexts), 
 * otherwise falls back to a math-based generator for non-secure environments like APK WebViews.
 */
export function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  // Robust fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
