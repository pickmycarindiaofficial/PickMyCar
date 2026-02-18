/**
 * Global Storage Polyfill — Defense-in-Depth for APK WebViews
 * 
 * MUST be imported as the very first module in main.tsx.
 * 
 * In some Android WebView configurations (e.g., APK wrappers),
 * window.localStorage and window.sessionStorage are null, causing
 * uncaught TypeErrors in both our code AND third-party libraries
 * (Radix UI, React Query, Supabase, etc.) that we cannot modify.
 * 
 * This polyfill detects null/inaccessible storage and installs
 * a spec-compliant in-memory Storage shim on the window object,
 * ensuring no code — ours or third-party — can crash.
 * 
 * Security: The in-memory fallback is MORE secure than real localStorage
 * since data never touches disk and is lost when the WebView closes.
 */

(function installStoragePolyfill() {
    if (typeof window === 'undefined') return;

    /**
     * Creates a spec-compliant in-memory Storage implementation.
     * Uses a Map internally for O(1) lookups and isolation.
     */
    function createMemoryStorage(): Storage {
        const store = new Map<string, string>();

        const storage: Storage = {
            get length() {
                return store.size;
            },

            clear() {
                store.clear();
            },

            getItem(key: string): string | null {
                return store.get(key) ?? null;
            },

            key(index: number): string | null {
                const keys = Array.from(store.keys());
                return keys[index] ?? null;
            },

            removeItem(key: string): void {
                store.delete(key);
            },

            setItem(key: string, value: string): void {
                store.set(key, String(value));
            },
        };

        return storage;
    }

    /**
     * Tests whether a storage object is usable (not null, and read/write works).
     */
    function isStorageUsable(storageType: 'localStorage' | 'sessionStorage'): boolean {
        try {
            const s = window[storageType];
            if (!s) return false;

            // Verify read/write actually works (some browsers throw on access)
            const testKey = '__pmc_storage_test__';
            s.setItem(testKey, '1');
            s.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }

    // Install polyfill for localStorage if needed
    if (!isStorageUsable('localStorage')) {
        try {
            Object.defineProperty(window, 'localStorage', {
                value: createMemoryStorage(),
                writable: true,
                configurable: true,
            });
            console.warn('[PickMyCar] localStorage unavailable — using in-memory fallback');
        } catch (e) {
            console.error('[PickMyCar] Failed to install localStorage polyfill:', e);
        }
    }

    // Install polyfill for sessionStorage if needed
    if (!isStorageUsable('sessionStorage')) {
        try {
            Object.defineProperty(window, 'sessionStorage', {
                value: createMemoryStorage(),
                writable: true,
                configurable: true,
            });
            console.warn('[PickMyCar] sessionStorage unavailable — using in-memory fallback');
        } catch (e) {
            console.error('[PickMyCar] Failed to install sessionStorage polyfill:', e);
        }
    }
})();
