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
    // Stored in public/media and committed with the code, so every deploy ships the images
    // and the site serves them as static files (/media/<file>).
    // Note: on Vercel, uploads made from the live admin are NOT kept — upload locally, then push.
    staticDir: path.resolve(process.cwd(), "public/media"),
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
