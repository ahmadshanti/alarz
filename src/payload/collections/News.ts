import type { CollectionConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { revalidateHooks } from "../hooks/revalidate";

export const News: CollectionConfig = {
  slug: "news",
  labels: {
    singular: { ar: "خبر", en: "News item" },
    plural: { ar: "الأخبار", en: "News" },
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "date", "published"],
    group: "المحتوى",
  },
  defaultSort: "-date",
  access: { read: publicRead, create: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: revalidateHooks,
  fields: [
    { name: "title", type: "text", label: { ar: "العنوان", en: "Title" }, localized: true, required: true },
    { name: "excerpt", type: "textarea", label: { ar: "مقتطف", en: "Excerpt" }, localized: true, required: true },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: { ar: "صورة الغلاف", en: "Cover image" },
      admin: {
        description: { ar: "اختياري. بدونها يظهر غلاف ملوّن.", en: "Optional. Without it a coloured cover is shown." },
      },
    },
    { name: "source", type: "text", label: { ar: "المصدر", en: "Source" }, localized: true, required: true },
    { name: "url", type: "text", label: { ar: "رابط الخبر", en: "Link" } },
    {
      name: "date",
      type: "date",
      label: { ar: "التاريخ", en: "Date" },
      required: true,
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "published",
      type: "checkbox",
      label: { ar: "منشور", en: "Published" },
      defaultValue: true,
      admin: { position: "sidebar" },
    },
  ],
};
