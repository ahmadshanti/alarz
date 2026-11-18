import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { ar } from "@payloadcms/translations/languages/ar";
import { en } from "@payloadcms/translations/languages/en";
import sharp from "sharp";

import { Users } from "./payload/collections/Users";
import { Media } from "./payload/collections/Media";
import { Categories } from "./payload/collections/Categories";
import { Products } from "./payload/collections/Products";
import { Milestones } from "./payload/collections/Milestones";
import { QualityItems } from "./payload/collections/QualityItems";
import { News } from "./payload/collections/News";
import { Messages } from "./payload/collections/Messages";
import { Homepage } from "./payload/globals/Homepage";
import { SiteSettings } from "./payload/globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "",
  secret: process.env.PAYLOAD_SECRET || "",

  admin: {
    user: Users.slug,
    avatar: "default",
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " | الآرز",
      icons: [{ rel: "icon", type: "image/svg+xml", url: "/favicon.svg" }],
    },
    components: {
      graphics: {
        Logo: "/payload/components/graphics#Logo",
        Icon: "/payload/components/graphics#Icon",
      },
    },
  },

  collections: [Products, Categories, News, Milestones, QualityItems, Media, Messages, Users],
  globals: [Homepage, SiteSettings],

  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || "" },
  }),
  sharp,
  graphQL: { disable: true },

  localization: {
    locales: [
      { code: "ar", label: { ar: "العربية", en: "Arabic" }, rtl: true },
      { code: "en", label: { ar: "الإنجليزية", en: "English" } },
    ],
    defaultLocale: "ar",
    fallback: true,
  },
  i18n: {
    supportedLanguages: { ar, en },
    fallbackLanguage: "ar",
  },

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
