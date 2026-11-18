import type { GlobalConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: { ar: "إعدادات الموقع", en: "Site settings" },
  admin: { group: "الموقع" },
  access: { read: publicRead, update: loggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: "phones",
      type: "array",
      label: { ar: "أرقام الهاتف", en: "Phone numbers" },
      labels: { singular: { ar: "رقم", en: "Phone" }, plural: { ar: "الأرقام", en: "Phones" } },
      fields: [{ name: "number", type: "text", label: { ar: "الرقم", en: "Number" }, required: true }],
    },
    {
      type: "row",
      fields: [
        { name: "email", type: "email", label: { ar: "البريد الإلكتروني (يظهر بالموقع)", en: "Public email" } },
        {
          name: "notifyEmail",
          type: "email",
          label: { ar: "بريد استقبال الرسائل", en: "Notification email" },
          admin: {
            description: {
              ar: "لاستقبال رسائل نموذج التواصل (بعد ربط خدمة البريد).",
              en: "Receives contact-form messages (once an email adapter is set up).",
            },
          },
        },
      ],
    },
    { name: "address", type: "text", label: { ar: "العنوان", en: "Address" }, localized: true },
    { name: "poBox", type: "text", label: { ar: "صندوق البريد", en: "P.O. Box" }, localized: true },
    {
      type: "row",
      fields: [
        { name: "facebook", type: "text", label: { ar: "رابط فيسبوك", en: "Facebook URL" } },
        { name: "instagram", type: "text", label: { ar: "رابط إنستغرام", en: "Instagram URL" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "foundedYear", type: "number", label: { ar: "سنة التأسيس", en: "Founded year" } },
        { name: "monthlyCapacityLiters", type: "number", label: { ar: "الطاقة الإنتاجية الشهرية (لتر)", en: "Monthly capacity (litres)" } },
      ],
    },
  ],
};
