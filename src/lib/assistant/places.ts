/**
 * Small gazetteer so the assistant can answer "nearest shop to <place>" without the visitor
 * sharing their location. Coordinates are approximate town / landmark centres.
 */
export interface Place {
  names: string[];
  lat: number;
  lng: number;
  label: { ar: string; en: string };
}

export const PLACES: Place[] = [
  // landmarks (checked first — more specific)
  { names: ["جامعة النجاح", "النجاح", "النجاح الجديد", "الحرم الجديد", "an-najah", "najah", "an najah university"], lat: 32.22819, lng: 35.22223, label: { ar: "جامعة النجاح (الحرم الجديد)", en: "An-Najah University (new campus)" } },
  { names: ["النجاح القديم", "الحرم القديم", "old campus"], lat: 32.22025, lng: 35.24431, label: { ar: "جامعة النجاح (الحرم القديم)", en: "An-Najah University (old campus)" } },
  { names: ["دوار الشهداء", "الدوار", "وسط نابلس", "البلد نابلس", "nablus downtown", "martyrs square"], lat: 32.2213, lng: 35.2617, label: { ar: "دوار الشهداء، نابلس", en: "Martyrs' Square, Nablus" } },
  { names: ["رفيديا", "rafidia"], lat: 32.2235, lng: 35.235, label: { ar: "رفيديا، نابلس", en: "Rafidia, Nablus" } },
  { names: ["المخفية", "makhfiyeh"], lat: 32.2186, lng: 35.2433, label: { ar: "المخفية، نابلس", en: "Al-Makhfiya, Nablus" } },
  { names: ["المنطقة الصناعية نابلس", "الصناعية", "مصنع الآرز", "مصنع الارز"], lat: 32.2234, lng: 35.2861, label: { ar: "المنطقة الصناعية الشرقية، نابلس", en: "Eastern Industrial Zone, Nablus" } },
  { names: ["جامعة بيرزيت", "بيرزيت", "birzeit"], lat: 31.96, lng: 35.182, label: { ar: "جامعة بيرزيت", en: "Birzeit University" } },
  { names: ["دوار المنارة", "المنارة", "al-manara"], lat: 31.9036, lng: 35.2042, label: { ar: "دوار المنارة، رام الله", en: "Al-Manara Square, Ramallah" } },
  // cities & towns — West Bank
  { names: ["نابلس", "nablus"], lat: 32.2211, lng: 35.2544, label: { ar: "نابلس", en: "Nablus" } },
  { names: ["رام الله", "رامالله", "ramallah"], lat: 31.9038, lng: 35.2034, label: { ar: "رام الله", en: "Ramallah" } },
  { names: ["البيرة", "al-bireh", "bireh"], lat: 31.91, lng: 35.216, label: { ar: "البيرة", en: "Al-Bireh" } },
  { names: ["الخليل", "hebron", "khalil"], lat: 31.5326, lng: 35.0998, label: { ar: "الخليل", en: "Hebron" } },
  { names: ["جنين", "jenin"], lat: 32.461, lng: 35.295, label: { ar: "جنين", en: "Jenin" } },
  { names: ["طولكرم", "tulkarm", "tulkarem"], lat: 32.3104, lng: 35.0286, label: { ar: "طولكرم", en: "Tulkarm" } },
  { names: ["قلقيلية", "qalqilya", "qalqilia"], lat: 32.1896, lng: 34.9706, label: { ar: "قلقيلية", en: "Qalqilya" } },
  { names: ["بيت لحم", "bethlehem"], lat: 31.7054, lng: 35.2024, label: { ar: "بيت لحم", en: "Bethlehem" } },
  { names: ["بيت ساحور", "beit sahour"], lat: 31.705, lng: 35.226, label: { ar: "بيت ساحور", en: "Beit Sahour" } },
  { names: ["بيت جالا", "beit jala"], lat: 31.715, lng: 35.187, label: { ar: "بيت جالا", en: "Beit Jala" } },
  { names: ["أريحا", "اريحا", "jericho"], lat: 31.857, lng: 35.459, label: { ar: "أريحا", en: "Jericho" } },
  { names: ["سلفيت", "salfit"], lat: 32.085, lng: 35.18, label: { ar: "سلفيت", en: "Salfit" } },
  { names: ["طوباس", "tubas"], lat: 32.3209, lng: 35.3697, label: { ar: "طوباس", en: "Tubas" } },
  { names: ["القدس", "jerusalem", "al-quds"], lat: 31.778, lng: 35.2354, label: { ar: "القدس", en: "Jerusalem" } },
  { names: ["دورا", "dura"], lat: 31.507, lng: 35.03, label: { ar: "دورا", en: "Dura" } },
  { names: ["يطا", "yatta"], lat: 31.447, lng: 35.093, label: { ar: "يطا", en: "Yatta" } },
  { names: ["حلحول", "halhul"], lat: 31.581, lng: 35.099, label: { ar: "حلحول", en: "Halhul" } },
  { names: ["عنبتا", "anabta"], lat: 32.307, lng: 35.118, label: { ar: "عنبتا", en: "Anabta" } },
  { names: ["حوارة", "huwara"], lat: 32.153, lng: 35.256, label: { ar: "حوارة", en: "Huwara" } },
  { names: ["عصيرة", "عصيرة الشمالية", "asira"], lat: 32.25, lng: 35.27, label: { ar: "عصيرة الشمالية", en: "Asira ash-Shamaliya" } },
  { names: ["بيتا", "beita"], lat: 32.144, lng: 35.288, label: { ar: "بيتا", en: "Beita" } },
  { names: ["قباطية", "qabatiya"], lat: 32.41, lng: 35.282, label: { ar: "قباطية", en: "Qabatiya" } },
  { names: ["يعبد", "ya'bad", "yabad"], lat: 32.446, lng: 35.17, label: { ar: "يعبد", en: "Ya'bad" } },
  { names: ["طمون", "tammun"], lat: 32.285, lng: 35.384, label: { ar: "طمون", en: "Tammun" } },
  { names: ["سنجل", "sinjil"], lat: 32.032, lng: 35.27, label: { ar: "سنجل", en: "Sinjil" } },
  // Gaza Strip
  { names: ["غزة", "gaza"], lat: 31.5017, lng: 34.4668, label: { ar: "غزة", en: "Gaza" } },
  { names: ["خانيونس", "خان يونس", "khan yunis", "khan younis"], lat: 31.346, lng: 34.306, label: { ar: "خان يونس", en: "Khan Yunis" } },
  { names: ["رفح", "rafah"], lat: 31.287, lng: 34.25, label: { ar: "رفح", en: "Rafah" } },
  { names: ["دير البلح", "deir al-balah"], lat: 31.418, lng: 34.351, label: { ar: "دير البلح", en: "Deir al-Balah" } },
  { names: ["جباليا", "jabalia", "jabalya"], lat: 31.53, lng: 34.483, label: { ar: "جباليا", en: "Jabalia" } },
];

/** Fold Arabic spelling variants and case so "الخليل" ~ "خليل", "أريحا" ~ "اريحا", "قلقيليه" ~ "قلقيلية". */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // harakat + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^ال/, "")
    .replace(/\s+ال/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Best match for a free-text place name, or null. Longer (more specific) names win. */
export function findPlace(query: string): Place | null {
  const q = normalize(query);
  if (!q) return null;
  let best: { place: Place; score: number } | null = null;
  for (const place of PLACES) {
    for (const name of place.names) {
      const n = normalize(name);
      if (!n) continue;
      const score = q === n ? 1000 + n.length : q.includes(n) || n.includes(q) ? n.length : 0;
      if (score && (!best || score > best.score)) best = { place, score };
    }
  }
  return best?.place ?? null;
}
