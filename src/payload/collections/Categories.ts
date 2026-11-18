import type { CollectionConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { revalidateHooks } from "../hooks/revalidate";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: { ar: "تصنيف", en: "Category" },
    plural: { ar: "التصنيفات", en: "Categories" },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "key", "order"],
    group: "المحتوى",
  },
  defaultSort: "order",
  access: { read: publicRead, create: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: revalidateHooks,
  fields: [
    { name: "name", type: "text", label: { ar: "الاسم", en: "Name" }, localized: true, required: true },
    { name: "tagline", type: "text", label: { ar: "الشعار", en: "Tagline" }, localized: true },
    {
      name: "key",
      type: "select",
      label: { ar: "النوع", en: "Key" },
      required: true,
      unique: true,
      options: [
        { value: "single", label: { ar: "حصة واحدة", en: "Single serve" } },
        { value: "family", label: { ar: "عبوات عائلية", en: "Family packs" } },
        { value: "occasion", label: { ar: "عبوات للمناسبات", en: "Occasion packs" } },
      ],
      admin: { position: "sidebar" },
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
