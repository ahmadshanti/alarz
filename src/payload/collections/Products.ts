import type { CollectionConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { hexColor } from "../fields/hexColor";
import { revalidateHooks } from "../hooks/revalidate";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: { ar: "منتج", en: "Product" },
    plural: { ar: "المنتجات", en: "Products" },
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "featured", "published", "order"],
    group: "المحتوى",
  },
  defaultSort: "order",
  access: { read: publicRead, create: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: revalidateHooks,
  fields: [
    {
      // Shown in the admin list only: "line – flavor"
      name: "title",
      type: "text",
      localized: true,
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData }) =>
            [siblingData.line, siblingData.flavor].filter((v) => typeof v === "string" && v.trim()).join(" – "),
        ],
      },
    },
    {
      type: "row",
      fields: [
        { name: "line", type: "text", label: { ar: "خط المنتج", en: "Product line" }, localized: true, required: true },
        { name: "flavor", type: "text", label: { ar: "النكهة", en: "Flavour" }, localized: true },
        { name: "size", type: "text", label: { ar: "الحجم", en: "Size" }, localized: true },
      ],
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      label: { ar: "التصنيف", en: "Category" },
      required: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: { ar: "صورة المنتج", en: "Product image" },
      admin: {
        description: {
          ar: "اختياري. بدون صورة يظهر رسم المنتج الملوّن.",
          en: "Optional. Without an image the coloured illustration is shown.",
        },
      },
    },
    {
      name: "colors",
      type: "group",
      label: { ar: "ألوان الرسم", en: "Illustration colours" },
      fields: [
        {
          type: "row",
          fields: [
            hexColor("base", { ar: "اللون الأساسي", en: "Base" }, "#FEB258"),
            hexColor("accent", { ar: "لون التفاصيل", en: "Accent" }, "#194E91"),
          ],
        },
      ],
    },
    {
      name: "featured",
      type: "checkbox",
      label: { ar: "مميز", en: "Featured" },
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "published",
      type: "checkbox",
      label: { ar: "منشور", en: "Published" },
      defaultValue: true,
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
