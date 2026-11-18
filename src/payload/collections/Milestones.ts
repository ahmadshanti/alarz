import type { CollectionConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { revalidateHooks } from "../hooks/revalidate";

export const Milestones: CollectionConfig = {
  slug: "milestones",
  labels: {
    singular: { ar: "محطة", en: "Milestone" },
    plural: { ar: "محطات القصة", en: "Milestones" },
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["year", "title", "order"],
    group: "المحتوى",
  },
  defaultSort: "order",
  access: { read: publicRead, create: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: revalidateHooks,
  fields: [
    {
      name: "year",
      type: "text",
      label: { ar: "السنة", en: "Year" },
      required: true,
      admin: { description: { ar: "مثال: 2009 أو ✦", en: "e.g. 2009 or ✦" } },
    },
    { name: "title", type: "text", label: { ar: "العنوان", en: "Title" }, localized: true, required: true },
    { name: "body", type: "textarea", label: { ar: "النص", en: "Body" }, localized: true, required: true },
    {
      name: "order",
      type: "number",
      label: { ar: "الترتيب", en: "Order" },
      defaultValue: 1,
      admin: { position: "sidebar" },
    },
  ],
};
