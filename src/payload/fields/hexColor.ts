import type { TextField } from "payload";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** A required "#RRGGBB" colour stored as text. */
export function hexColor(name: string, label: { ar: string; en: string }, defaultValue: string): TextField {
  return {
    name,
    type: "text",
    label,
    required: true,
    defaultValue,
    admin: {
      placeholder: "#FEB258",
      description: { ar: "لون بصيغة HEX، مثال: ‎#FEB258", en: "HEX colour, e.g. #FEB258" },
    },
    validate: (value: string | null | undefined) =>
      (typeof value === "string" && HEX.test(value)) || "لون غير صالح — استخدم صيغة ‎#RRGGBB / Invalid colour, use #RRGGBB",
  };
}
