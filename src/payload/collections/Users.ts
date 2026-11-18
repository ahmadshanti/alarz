import type { CollectionConfig, FieldAccess } from "payload";
import { adminOnly, adminOrSelf, isAdminUser } from "../access";

/** Role can be set by admins — or by anyone while no user exists yet (first-user setup). */
const canSetRole: FieldAccess = async ({ req }) => {
  if (isAdminUser(req.user as { id: number; role?: string } | null)) return true;
  const { totalDocs } = await req.payload.count({ collection: "users", req, overrideAccess: true });
  return totalDocs === 0;
};

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: { ar: "مستخدم", en: "User" },
    plural: { ar: "المستخدمون", en: "Users" },
  },
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "role"],
    group: "الإدارة",
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: adminOrSelf,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      // The very first account ever created becomes an admin.
      async ({ data, operation, req }) => {
        if (operation === "create") {
          const { totalDocs } = await req.payload.count({ collection: "users", req, overrideAccess: true });
          if (totalDocs === 0) data.role = "admin";
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: { ar: "الاسم", en: "Name" },
    },
    {
      name: "role",
      type: "select",
      label: { ar: "الصلاحية", en: "Role" },
      required: true,
      defaultValue: "editor",
      saveToJWT: true,
      options: [
        { value: "admin", label: { ar: "مدير", en: "Admin" } },
        { value: "editor", label: { ar: "محرّر محتوى", en: "Editor" } },
      ],
      access: { create: canSetRole, update: canSetRole },
      admin: {
        description: {
          ar: "المدير يدير كل شيء. المحرّر يعدّل المحتوى فقط.",
          en: "Admins manage everything. Editors edit content only.",
        },
      },
    },
  ],
};
