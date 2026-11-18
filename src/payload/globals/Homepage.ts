import type { GlobalConfig } from "payload";
import { loggedIn, publicRead } from "../access";
import { hexColor } from "../fields/hexColor";
import { revalidateGlobal } from "../hooks/revalidate";

/**
 * Home page settings. `charmsFlavors` drives both the 3D bar's flavour picker in the hero
 * and the "rank them" list in the Charms section.
 */
export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: { ar: "الصفحة الرئيسية", en: "Homepage" },
  admin: { group: "الموقع" },
  access: { read: publicRead, update: loggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: "charmsFlavors",
      type: "array",
      label: { ar: "نكهات تشارمز", en: "Charms flavours" },
      labels: {
        singular: { ar: "نكهة", en: "Flavour" },
        plural: { ar: "النكهات", en: "Flavours" },
      },
      admin: {
        description: {
          ar: "تظهر في واجهة البوظة ثلاثية الأبعاد وفي قسم «رتّبهم». المفتاح يحدد شكل البوظة (almonds, double-chocolate, cookies-cream, strawberry-white).",
          en: "Used by the 3D hero and the “rank them” section. The key selects the 3D look (almonds, double-chocolate, cookies-cream, strawberry-white).",
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "key", type: "text", label: { ar: "المفتاح", en: "Key" }, required: true },
            { name: "name", type: "text", label: { ar: "الاسم", en: "Name" }, localized: true, required: true },
          ],
        },
        {
          type: "row",
          fields: [
            hexColor("pack", { ar: "لون العبوة", en: "Pack colour" }, "#2a63b8"),
            hexColor("packDeep", { ar: "لون العبوة الغامق", en: "Pack colour (deep)" }, "#143f80"),
          ],
        },
      ],
    },
  ],
};
