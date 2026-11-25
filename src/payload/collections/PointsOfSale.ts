import type { CollectionConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { revalidateHooks } from "../hooks/revalidate";

/**
 * Shops where Al-Arz ice cream is sold. Shown on the "where to buy" map.
 * Most points are imported from OpenStreetMap (`npm run stores:import`); the company can
 * add its own, edit any point, or hide one with "active".
 */
export const PointsOfSale: CollectionConfig = {
  slug: "points-of-sale",
  labels: {
    singular: { ar: "نقطة بيع", en: "Point of sale" },
    plural: { ar: "نقاط البيع", en: "Points of sale" },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "city", "active", "featured", "source"],
    group: "المحتوى",
    listSearchableFields: ["name", "nameEn", "city", "address"],
  },
  defaultSort: "name",
  access: { read: publicRead, create: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: revalidateHooks,
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", label: { ar: "الاسم", en: "Name" }, required: true },
        { name: "nameEn", type: "text", label: { ar: "الاسم بالإنجليزي", en: "Name (English)" } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          label: { ar: "النوع", en: "Type" },
          required: true,
          defaultValue: "supermarket",
          options: [
            { value: "supermarket", label: { ar: "سوبر ماركت", en: "Supermarket" } },
            { value: "minimarket", label: { ar: "ميني ماركت / بقالة", en: "Minimarket / grocery" } },
            { value: "mall", label: { ar: "مول / مركز تجاري", en: "Mall / department store" } },
            { value: "other", label: { ar: "متجر آخر", en: "Other shop" } },
          ],
        },
        { name: "city", type: "text", label: { ar: "المدينة", en: "City" } },
      ],
    },
    { name: "address", type: "text", label: { ar: "العنوان", en: "Address" } },
    { name: "phone", type: "text", label: { ar: "الهاتف", en: "Phone" } },
    {
      type: "row",
      fields: [
        {
          name: "lat",
          type: "number",
          label: { ar: "خط العرض", en: "Latitude" },
          required: true,
          index: true,
          admin: { step: 0.000001, description: { ar: "مثال: 32.2282", en: "e.g. 32.2282" } },
        },
        {
          name: "lng",
          type: "number",
          label: { ar: "خط الطول", en: "Longitude" },
          required: true,
          index: true,
          admin: { step: 0.000001, description: { ar: "مثال: 35.2222", en: "e.g. 35.2222" } },
        },
      ],
    },
    {
      name: "active",
      type: "checkbox",
      label: { ar: "ظاهرة على الخريطة", en: "Shown on the map" },
      defaultValue: true,
      admin: { position: "sidebar" },
    },
    {
      name: "featured",
      type: "checkbox",
      label: { ar: "موزّع معتمد", en: "Official distributor" },
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: { ar: "تظهر بعلامة مميزة على الخريطة.", en: "Highlighted on the map." },
      },
    },
    {
      name: "source",
      type: "select",
      label: { ar: "المصدر", en: "Source" },
      defaultValue: "manual",
      options: [
        { value: "osm", label: { ar: "OpenStreetMap", en: "OpenStreetMap" } },
        { value: "manual", label: { ar: "مضافة يدوياً", en: "Added manually" } },
      ],
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "osmId",
      type: "text",
      unique: true,
      index: true,
      admin: { position: "sidebar", readOnly: true, description: { ar: "للتحديث التلقائي", en: "Used by the importer" } },
    },
  ],
};
