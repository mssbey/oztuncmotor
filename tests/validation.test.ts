import { describe, expect, it } from "vitest";
import { parseCatalogParams, catalogQueryString } from "@/lib/catalog";
import { specRows, specSummary, type SpecValues } from "@/lib/specs";
import { normalizePhone, normalizePlate, appointmentStep1 } from "@/lib/validation";
import { issueFormToken, verifyFormToken } from "@/server/security";

describe("telefon ve plaka", () => {
  it("farklı yazımları 10 haneye indirger", () => {
    for (const v of ["0555 111 22 33", "+90 555 111 2233", "905551112233", "5551112233"]) {
      expect(normalizePhone(v)).toBe("5551112233");
    }
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("0155 111 22 33")).toBeNull();
  });
  it("plakayı biçimlendirir", () => {
    expect(normalizePlate("81abc123")).toBe("81 ABC 123");
    expect(appointmentStep1.safeParse({ brandId: "x", model: "m", serviceItemId: "s", plate: "99 ZZ 1" }).success).toBe(false);
  });
  it("“Diğer” marka seçilince marka adı zorunlu", () => {
    const r = appointmentStep1.safeParse({ brandId: "other", brandOther: "", model: "m", serviceItemId: "s" });
    expect(r.success).toBe(false);
  });
});

describe("form belirteci", () => {
  it("süre ve imza kontrolü", () => {
    const now = Date.now();
    expect(verifyFormToken(issueFormToken(now - 5000), now)).toBe("ok");
    expect(verifyFormToken(issueFormToken(now - 500), now)).toBe("too-fast");
    expect(verifyFormToken(issueFormToken(now - 7 * 3600_000), now)).toBe("expired");
    expect(verifyFormToken(`${now - 5000}.degistirilmis`, now)).toBe("invalid");
  });
});

describe("katalog URL parametreleri", () => {
  it("geçersiz değerleri ayıklar ve geri yazar", () => {
    const f = parseCatalogParams({ marka: "a-demo,<script>", stok: "stokta,yok", min: "100.000", sira: "fiyat-artan" });
    expect(f.brands).toEqual(["a-demo"]);
    expect(f.stock).toEqual(["stokta"]);
    expect(f.min).toBe(100000);
    expect(catalogQueryString(f)).toBe("?marka=a-demo&stok=stokta&min=100000&sira=fiyat-artan");
  });
});

describe("teknik özellikler", () => {
  const base: SpecValues = {
    powertrain: "ELECTRIC",
    engineCc: 650, // elektrikli modelde gösterilmemeli
    powerHp: null,
    torqueNm: null,
    motorPowerKw: 11,
    batteryKwh: null,
    rangeKm: 110,
    chargeTimeHours: null,
    topSpeedKmh: null,
    weightKg: null,
    seatHeightMm: null,
    fuelCapacityL: null,
    transmission: null,
    cooling: null,
    brakes: null,
    licenseClass: null,
    extraSpecs: [],
  };
  it("yalnızca girilmiş ve güç aktarımına uygun alanları listeler", () => {
    const labels = specRows(base).map((r) => r.label);
    expect(labels).toEqual(["Güç aktarımı", "Motor gücü", "Menzil"]);
    expect(specSummary(base)).toEqual(["11 kW", "110 km menzil"]);
  });
});
