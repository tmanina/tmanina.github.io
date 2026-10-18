export type City = "cairo" | "giza" | "alexandria" | "port-said" | "suez" | "ismailia" | "damietta" |
  "damanhur" | "tanta" | "mansoura" | "zagazig" | "shebin" | "banha" | "kafr-el-sheikh" |
  "fayoum" | "beni-suef" | "minya" | "assiut" | "sohag" | "qena" | "luxor" | "aswan" |
  "hurghada" | "new-valley" | "matrouh" | "north-sinai" | "south-sinai"

export interface CityInfo {
  name: string
  englishName: string
  latitude: number
  longitude: number
}

export const egyptCities: Record<City, CityInfo> = {
  cairo: { name: "القاهرة", englishName: "Cairo", latitude: 30.0444, longitude: 31.2357 },
  giza: { name: "الجيزة", englishName: "Giza", latitude: 30.0131, longitude: 31.2089 },
  alexandria: { name: "الإسكندرية", englishName: "Alexandria", latitude: 31.2001, longitude: 29.9187 },
  "port-said": { name: "بورسعيد", englishName: "Port Said", latitude: 31.2653, longitude: 32.3019 },
  suez: { name: "السويس", englishName: "Suez", latitude: 29.9668, longitude: 32.5498 },
  ismailia: { name: "الإسماعيلية", englishName: "Ismailia", latitude: 30.5833, longitude: 32.2722 },
  damietta: { name: "دمياط", englishName: "Damietta", latitude: 31.4175, longitude: 31.8144 },
  damanhur: { name: "البحيرة", englishName: "Damanhur", latitude: 31.0341, longitude: 30.4682 },
  tanta: { name: "الغربية", englishName: "Tanta", latitude: 30.7865, longitude: 31.0004 },
  mansoura: { name: "الدقهلية", englishName: "Mansoura", latitude: 31.0409, longitude: 31.3785 },
  zagazig: { name: "الشرقية", englishName: "Zagazig", latitude: 30.5877, longitude: 31.5021 },
  shebin: { name: "المنوفية", englishName: "Shebin El Kom", latitude: 30.5594, longitude: 31.0118 },
  banha: { name: "القليوبية", englishName: "Banha", latitude: 30.4659, longitude: 31.1784 },
  "kafr-el-sheikh": { name: "كفر الشيخ", englishName: "Kafr El Sheikh", latitude: 31.1107, longitude: 30.9388 },
  fayoum: { name: "الفيوم", englishName: "Fayoum", latitude: 29.3084, longitude: 30.8428 },
  "beni-suef": { name: "بني سويف", englishName: "Beni Suef", latitude: 29.0661, longitude: 31.0994 },
  minya: { name: "المنيا", englishName: "Minya", latitude: 28.0871, longitude: 30.7618 },
  assiut: { name: "أسيوط", englishName: "Assiut", latitude: 27.1783, longitude: 31.1859 },
  sohag: { name: "سوهاج", englishName: "Sohag", latitude: 26.5569, longitude: 31.6948 },
  qena: { name: "قنا", englishName: "Qena", latitude: 26.1551, longitude: 32.7160 },
  luxor: { name: "الأقصر", englishName: "Luxor", latitude: 25.6872, longitude: 32.6396 },
  aswan: { name: "أسوان", englishName: "Aswan", latitude: 24.0889, longitude: 32.8998 },
  hurghada: { name: "البحر الأحمر", englishName: "Hurghada", latitude: 27.2579, longitude: 33.8116 },
  "new-valley": { name: "الوادي الجديد", englishName: "Al Kharga", latitude: 25.4514, longitude: 30.5461 },
  matrouh: { name: "مطروح", englishName: "Marsa Matrouh", latitude: 31.3543, longitude: 27.2373 },
  "north-sinai": { name: "شمال سيناء", englishName: "Arish", latitude: 31.1312, longitude: 33.7989 },
  "south-sinai": { name: "جنوب سيناء", englishName: "Sharm El Sheikh", latitude: 27.9158, longitude: 34.3300 },
}

