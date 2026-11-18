import path from "path";
import type { CollectionConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { revalidateHooks } from "../hooks/revalidate";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: { ar: "صورة", en: "Media" },
    plural: { ar: "الصور", en: "Media" },
  },
  admin: { group: "المحتوى" },
  access: {
    read: publicRead,
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: revalidateHooks,
  upload: {
    // <project root>/media (git-ignored). Use a storage adapter in production — see README.
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*"],
    adminThumbnail: "thumb",
    imageSizes: [
      { name: "thumb", width: 300 },
      { name: "card", width: 700 },
      { name: "large", width: 1400 },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: { ar: "النص البديل (وصف الصورة)", en: "Alt text" },
      localized: true,
    },
  ],
};
