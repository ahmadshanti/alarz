import type { CollectionConfig } from "payload";
import { loggedIn } from "../access";

/** Contact-form submissions. Created only by the server route (/api/contact) with overrideAccess. */
export const Messages: CollectionConfig = {
  slug: "messages",
  labels: {
    singular: { ar: "رسالة", en: "Message" },
    plural: { ar: "رسائل التواصل", en: "Messages" },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "phone", "type", "status", "createdAt"],
    group: "الرسائل",
  },
  defaultSort: "-createdAt",
  access: {
    create: () => false,
    read: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", label: { ar: "الاسم", en: "Name" }, required: true, admin: { readOnly: true } },
        { name: "phone", type: "text", label: { ar: "الهاتف", en: "Phone" }, required: true, admin: { readOnly: true } },
      ],
    },
    {
      name: "type",
      type: "select",
      label: { ar: "نوع الطلب", en: "Type" },
      defaultValue: "general",
      options: [
        { value: "general", label: { ar: "استفسار عام", en: "General" } },
        { value: "distributor", label: { ar: "طلب توزيع", en: "Distributor" } },
        { value: "feedback", label: { ar: "رأي / ملاحظة", en: "Feedback" } },
      ],
      admin: { readOnly: true },
    },
    { name: "message", type: "textarea", label: { ar: "الرسالة", en: "Message" }, required: true, admin: { readOnly: true } },
    {
      name: "status",
      type: "select",
      label: { ar: "الحالة", en: "Status" },
      defaultValue: "new",
      options: [
        { value: "new", label: { ar: "جديدة", en: "New" } },
        { value: "in-progress", label: { ar: "قيد المتابعة", en: "In progress" } },
        { value: "done", label: { ar: "تمت", en: "Done" } },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "locale",
      type: "select",
      label: { ar: "لغة المرسل", en: "Sender language" },
      options: [
        { value: "ar", label: { ar: "العربية", en: "Arabic" } },
        { value: "en", label: { ar: "الإنجليزية", en: "English" } },
      ],
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
