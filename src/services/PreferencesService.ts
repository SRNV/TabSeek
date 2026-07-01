const PREFIX = 'tabseek_';

export const PreferencesService = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch (e) {
      console.warn(`[Preferences] Failed to read "${key}":`, e);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Preferences] Failed to write "${key}":`, e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.warn(`[Preferences] Failed to remove "${key}":`, e);
    }
  },
};
