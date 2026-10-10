// Teknik özellik tanımları. Yalnızca girilmiş değerler gösterilir; boşlar asla tahmin edilmez.
import { formatNumber } from "./catalog";

export type Powertrain = "ICE" | "ELECTRIC";

export type SpecValues = {
  powertrain: Powertrain;
  engineCc: number | null;
  powerHp: number | null;
  torqueNm: number | null;
  motorPowerKw: number | null;
  batteryKwh: number | null;
  rangeKm: number | null;
  chargeTimeHours: number | null;
  topSpeedKmh: number | null;
  weightKg: number | null;
  seatHeightMm: number | null;
  fuelCapacityL: number | null;
  transmission: string | null;
  cooling: string | null;
  brakes: string | null;
  licenseClass: string | null;
  extraSpecs: { label: string; value: string }[];
};

type SpecKey = Exclude<keyof SpecValues, "powertrain" | "extraSpecs">;

export const SPEC_FIELDS: {
  key: SpecKey;
  label: string;
  unit?: string;
  digits?: number;
  only?: Powertrain;
  kind: "int" | "decimal" | "text";
}[] = [
  { key: "engineCc", label: "Motor hacmi", unit: "cc", only: "ICE", kind: "int" },
  { key: "powerHp", label: "Azami güç", unit: "HP", only: "ICE", kind: "decimal" },
  { key: "motorPowerKw", label: "Motor gücü", unit: "kW", only: "ELECTRIC", kind: "decimal" },
  { key: "torqueNm", label: "Tork", unit: "Nm", kind: "decimal" },
  { key: "batteryKwh", label: "Batarya kapasitesi", unit: "kWh", only: "ELECTRIC", kind: "decimal", digits: 2 },
  { key: "rangeKm", label: "Menzil", unit: "km", only: "ELECTRIC", kind: "int" },
  { key: "chargeTimeHours", label: "Şarj süresi", unit: "saat", only: "ELECTRIC", kind: "decimal" },
  { key: "topSpeedKmh", label: "Azami hız", unit: "km/s", kind: "int" },
  { key: "weightKg", label: "Ağırlık", unit: "kg", kind: "int" },
  { key: "seatHeightMm", label: "Sele yüksekliği", unit: "mm", kind: "int" },
  { key: "fuelCapacityL", label: "Yakıt deposu", unit: "L", only: "ICE", kind: "decimal" },
  { key: "transmission", label: "Şanzıman", kind: "text" },
  { key: "cooling", label: "Soğutma", only: "ICE", kind: "text" },
  { key: "brakes", label: "Frenler", kind: "text" },
  { key: "licenseClass", label: "Ehliyet sınıfı", kind: "text" },
];

export function fieldsFor(powertrain: Powertrain) {
  return SPEC_FIELDS.filter((f) => !f.only || f.only === powertrain);
}

export function formatSpec(field: (typeof SPEC_FIELDS)[number], value: unknown): string | null {
  if (value == null || value === "") return null;
  if (field.kind === "text") return String(value);
  const n = formatNumber(value as number, field.digits ?? 1);
  return field.unit ? `${n} ${field.unit}` : n;
}

/** Girilmiş özelliklerin etiket-değer listesi. */
export function specRows(m: SpecValues): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: "Güç aktarımı", value: m.powertrain === "ELECTRIC" ? "Elektrikli" : "Benzinli" },
  ];
  for (const field of fieldsFor(m.powertrain)) {
    const value = formatSpec(field, m[field.key]);
    if (value) rows.push({ label: field.label, value });
  }
  for (const extra of m.extraSpecs) {
    if (extra.label && extra.value) rows.push(extra);
  }
  return rows;
}

/** Kartlardaki kısa teknik özet: en fazla üç girilmiş değer. */
export function specSummary(m: SpecValues): string[] {
  const keys: SpecKey[] =
    m.powertrain === "ELECTRIC"
      ? ["motorPowerKw", "rangeKm", "topSpeedKmh", "weightKg"]
      : ["engineCc", "powerHp", "weightKg", "seatHeightMm"];
  const out: string[] = [];
  for (const key of keys) {
    const field = SPEC_FIELDS.find((f) => f.key === key)!;
    const v = formatSpec(field, m[key]);
    if (v) out.push(key === "rangeKm" ? `${v} menzil` : v);
    if (out.length === 3) break;
  }
  return out;
}
