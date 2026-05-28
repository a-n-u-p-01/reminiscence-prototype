// storageService.ts – thin wrapper around Capacitor Storage
import { Preferences } from '@capacitor/preferences';

/** Retrieve a string value; falls back to `localStorage` when running in the browser */
export async function getItem(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  if (value !== null) return value;
  return localStorage.getItem(key);
}

/** Store a string value; also mirrors to `localStorage` for fast dev reloads */
export async function setItem(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
  localStorage.setItem(key, value);
}

/** Remove a key from storage */
export async function removeItem(key: string): Promise<void> {
  await Preferences.remove({ key });
  localStorage.removeItem(key);
}
