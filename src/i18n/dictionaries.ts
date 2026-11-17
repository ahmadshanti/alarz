import type { Locale } from "@/content/types";

const ar = {
  meta: {
    title: "بوظة الآرز | طعم فلسطيني أصيل منذ ١٩٥٠",
    description: "شركة الآرز للبوظة — نابلس، فلسطين. بوظة بجودة عالمية وطعم أصيل منذ عام ١٩٥٠.",
  },
  nav: {
    home: "الرئيسية",
    story: "قصتنا",
    products: "منتجاتنا",
    quality: "الجودة",
    news: "الأخبار",
    contact: "تواصل معنا",
    switchLang: "English",
    menu: "القائمة",
    close: "إغلاق",
  },
  hero: {
    eyebrow: "من نابلس منذ ١٩٥٠",
    titleTop: "بوظة",
    titleBrand: "الآرز",
    subtitle: "طعم فلسطيني أصيل، بيكبر معك من جيل لجيل. اختار نكهتك وخلّي البرودة تحكي.",
    ctaPrimary: "اكتشف منتجاتنا",
    ctaSecondary: "قصتنا",
    pickFlavor: "اختار نكهتك",
    scroll: "انزل",
  },
  marquee: ["فانيلا", "شوكولاتة", "فستق حلبي", "مستكة عربية", "تشيزكيك الفراولة", "كراميل بالقرفة", "برتقال", "ليمون", "كوكيز وكريم", "موكا"],
  story: {
    eyebrow: "قصتنا",
    title: "من معمل ثلج صغير… لأكبر اسم بالبوظة في فلسطين",
    stats: {
      years: "سنة من الطعم",
      capacity: "مليون لتر شهرياً",
      first: "أول شركة مثلجات في فلسطين والأردن بشهادة HACCP",
    },
  },
  products: {
    eyebrow: "منتجاتنا",
    title: "نكهة لكل مزاج",
    subtitle: "من الحصة الصغيرة لعبوة المناسبات، كل منتج معمول بحب وبأفضل المكونات.",
    count: "منتج",
  },
  quality: {
    eyebrow: "الصحة والجودة",
    title: "الجودة عنا مش شعار… هي طريقة شغل",
    subtitle: "من اختيار المواد الخام ومواد التغليف، لحد ما توصل البوظة لإيدك.",
  },
  news: {
    eyebrow: "آخر الأخبار",
    title: "الآرز بالأخبار",
    readMore: "اقرأ المزيد",
  },
  contact: {
    eyebrow: "تواصل معنا",
    title: "بدك تصير موزّع؟ أو تلاقي موزّع بمنطقتك؟",
    subtitle: "احكيلنا وفريقنا برجعلك بأسرع وقت.",
    phones: "الهاتف",
    address: "العنوان",
    intlNote: "من خارج الدول العربية استخدم المقدمة 972 بدل 970",
    form: {
      name: "الاسم",
      phone: "رقم الهاتف",
      type: "نوع الطلب",
      types: { general: "استفسار عام", distributor: "طلب توزيع", feedback: "ملاحظة أو شكوى" },
      message: "رسالتك",
      submit: "أرسل",
      sending: "جاري الإرسال…",
      success: "وصلتنا رسالتك، شكراً إلك!",
      error: "صار خطأ، جرّب مرة ثانية.",
    },
  },
  footer: {
    tagline: "طعم فلسطيني أصيل منذ ١٩٥٠",
    rights: "جميع الحقوق محفوظة لشركة الآرز للأيس كريم المحدودة",
    follow: "تابعنا",
  },
};

export type Dictionary = typeof ar;

const en: Dictionary = {
  meta: {
    title: "Al-Arz Ice Cream | Authentic Palestinian taste since 1950",
    description: "Al-Arz Ice Cream Co. — Nablus, Palestine. World-class quality and an authentic taste since 1950.",
  },
  nav: {
    home: "Home",
    story: "Our Story",
    products: "Products",
    quality: "Quality",
    news: "News",
    contact: "Contact",
    switchLang: "العربية",
    menu: "Menu",
    close: "Close",
  },
  hero: {
    eyebrow: "From Nablus since 1950",
    titleTop: "Al-Arz",
    titleBrand: "Ice Cream",
    subtitle: "An authentic Palestinian taste, passed from generation to generation. Pick your flavour and let it melt.",
    ctaPrimary: "Explore products",
    ctaSecondary: "Our story",
    pickFlavor: "Pick a flavour",
    scroll: "Scroll",
  },
  marquee: ["Vanilla", "Chocolate", "Aleppo Pistachio", "Arabic Mastic", "Strawberry Cheesecake", "Cinnamon Caramel", "Orange", "Lemon", "Cookies & Cream", "Mocha"],
  story: {
    eyebrow: "Our Story",
    title: "From a small ice factory… to Palestine's biggest name in ice cream",
    stats: {
      years: "years of flavour",
      capacity: "million litres a month",
      first: "First ice cream maker in Palestine & Jordan with HACCP",
    },
  },
  products: {
    eyebrow: "Our Products",
    title: "A flavour for every mood",
    subtitle: "From single treats to party tubs, everything is made with love and the finest ingredients.",
    count: "products",
  },
  quality: {
    eyebrow: "Health & Quality",
    title: "Quality isn't a slogan. It's how we work.",
    subtitle: "From raw materials and packaging all the way to your hands.",
  },
  news: {
    eyebrow: "Latest news",
    title: "Al-Arz in the news",
    readMore: "Read more",
  },
  contact: {
    eyebrow: "Get in touch",
    title: "Want to become a distributor, or find one near you?",
    subtitle: "Tell us and our team will get back to you shortly.",
    phones: "Phone",
    address: "Address",
    intlNote: "Calling from outside Arab countries? Use 972 instead of 970",
    form: {
      name: "Name",
      phone: "Phone number",
      type: "Request type",
      types: { general: "General enquiry", distributor: "Distribution request", feedback: "Feedback or complaint" },
      message: "Your message",
      submit: "Send",
      sending: "Sending…",
      success: "Got it — thank you!",
      error: "Something went wrong, please try again.",
    },
  },
  footer: {
    tagline: "Authentic Palestinian taste since 1950",
    rights: "All rights reserved — Al-Arz Ice Cream Co. Ltd.",
    follow: "Follow us",
  },
};

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
