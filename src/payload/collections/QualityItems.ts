import type { CollectionConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { revalidateHooks } from "../hooks/revalidate";

export const QualityItems: CollectionConfig = {
  slug: "quality-items",
  labels: {
    singular: { ar: "بند جودة", en: "Quality item" },
    plural: { ar: "الصحة والجودة", en: "Quality items" },
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "icon", "year", "order"],
    group: "المحتوى",
  },
  defaultSort: "order",
  access: { read: publicRead, create: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: revalidateHooks,
  fields: [
    { name: "title", type: "text", label: { ar: "العنوان", en: "Title" }, localized: true, required: true },
    { name: "body", type: "textarea", label: { ar: "النص", en: "Body" }, localized: true, required: true },
    {
      type: "row",
      fields: [
        { name: "year", type: "text", label: { ar: "السنة", en: "Year" } },
        {
          name: "icon",
          type: "select",
          label: { ar: "الأيقونة", en: "Icon" },
          required: true,
          defaultValue: "badge",
          options: [
            { value: "lab", label: { ar: "مختبر", en: "Lab" } },
            { value: "shield", label: { ar: "درع", en: "Shield" } },
            { value: "badge", label: { ar: "شارة", en: "Badge" } },
            { value: "flask", label: { ar: "دورق", en: "Flask" } },
          ],
        },
      ],
    },
    {
      name: "order",
      type: "number",
      label: { ar: "الترتيب", en: "Order" },
      defaultValue: 1,
      admin: { position: "sidebar" },
    },
  ],
};
