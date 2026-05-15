// Store de configuración editable (tarifario + datos institucionales).
//
// F1: persistencia en localStorage del navegador del admin. Cuando llegue
// Supabase, reemplazamos la implementación de fetchSettings/saveSettings por
// llamadas a la BD; los componentes que usan useSettings/useSettingsValue no
// cambian.

import { useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_TARIFF } from "./pricing.js";

const STORAGE_KEY = "extractos:settings:v1";

/**
 * Defaults — alineados con supabase/seed.sql.
 * @type {Record<string, any>}
 */
export const DEFAULT_SETTINGS = Object.freeze({
  tariff_table: { ...DEFAULT_TARIFF },
  radio_legal_name: "Sociedad Comercial de Radiodifusión y Publicidad del Sur Limitada",
  radio_legal_rut: "79.966.670-7",
  radio_giro: "Radiodifusión y Publicidad",
  radio_brand_names: ["Radio La Frontera AM 1110", "Radio Araucana FM 95.9"],
  radio_address: "Caupolicán 110 Oficina 2003 Piso 20, Temuco, Región de La Araucanía",
  radio_phone_landline: "+56 45 2213166",
  radio_phone_mobile: "+56 9 4239 0216",
  radio_email_administration: "administracion@araucanayfrontera.cl",
  radio_email_secretary: "administracion@araucanayfrontera.cl",
  radio_bank_name: "Banco Santander",
  radio_bank_account_type: "Cuenta Corriente",
  radio_bank_account_number: "0-000-9874438-0",
  radio_coverage_default: "Provincia de Cautín, IX Región de La Araucanía",
  default_broadcast_times: ["10:00", "10:05", "10:10"],
  notification_emails: [
    "administracion@araucanayfrontera.cl",
  ],
});

function loadFromStorage() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let cachedSettings = null;
const subscribers = new Set();

function getSnapshot() {
  if (!cachedSettings) cachedSettings = loadFromStorage();
  return cachedSettings;
}

function notify() {
  for (const cb of subscribers) cb();
}

function subscribe(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/** @returns {object} */
export function getSettings() {
  return getSnapshot();
}

/** @param {object} patch */
export function updateSettings(patch) {
  cachedSettings = { ...getSnapshot(), ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSettings));
      // Aviso al resto de tabs para mantener consistencia.
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    } catch (err) {
      console.warn("[settings-store] no pudo persistir:", err);
    }
  }
  notify();
}

export function resetSettings() {
  cachedSettings = { ...DEFAULT_SETTINGS };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  notify();
}

/** Hook React: re-renderiza cuando cambian los settings. */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  // Sync entre pestañas vía evento storage.
  useEffect(() => {
    function onStorage(e) {
      if (e.key && e.key !== STORAGE_KEY) return;
      cachedSettings = null;
      notify();
    }
    if (typeof window === "undefined") return;
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return settings;
}

/** Hook conveniencia: lee un setting específico. */
export function useSettingsValue(key) {
  const settings = useSettings();
  return settings?.[key];
}

/** Indica si hay overrides locales (vs solo defaults). */
export function hasLocalOverrides() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}
