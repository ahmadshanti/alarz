import type { MetadataRoute } from "next";

/**
 * Web app manifest: "Add to Home screen" installs Al-Arz like an app —
 * branded icon, cream splash screen, opens full-screen without the browser bar.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/ar",
    name: "بوظة الآرز — Al-Arz Ice Cream",
    short_name: "الآرز",
    description: "بوظة الآرز من نابلس منذ ١٩٥٠ — المنتجات، أقرب نقاط البيع، ومساعد ذكي.",
    start_url: "/ar",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#fff8ee",
    theme_color: "#feb258",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "وين تلاقينا", short_name: "نقاط البيع", url: "/ar/stores", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "منتجاتنا", short_name: "المنتجات", url: "/ar/products", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "شو نكهتك؟", short_name: "الاختبار", url: "/ar/quiz", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
