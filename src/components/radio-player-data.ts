// Extracted data, types, and helper functions from radio-player.tsx for modularity.

export interface Radio {
    id: number
    name: string
    url: string
    recent_date: string
    img?: string
}

export interface Category {
    id: string
    name: string
    icon: string
    gradient: string
    description: string
}

// Category definitions
export const categories: Category[] = [
    {
        id: "reciters",
        name: "القراء",
        icon: "fa-user-tie",
        gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        description: "استمع لأشهر القراء"
    },
    {
        id: "translations",
        name: "ترجمة معاني القرآن",
        icon: "fa-language",
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        description: "القرآن بلغات مختلفة"
    },
    {
        id: "tafsir",
        name: "التفسير وعلوم القرآن",
        icon: "fa-book-open",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        description: "تفسير وعلوم القرآن"
    },
    {
        id: "seerah",
        name: "السيرة والقصص",
        icon: "fa-mosque",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        description: "السيرة النبوية والقصص"
    },
    {
        id: "distinguished",
        name: "تلاوات متميزة",
        icon: "fa-star",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        description: "تلاوات خاشعة مميزة"
    },
    {
        id: "ruqyah",
        name: "الرقية الشرعية",
        icon: "fa-book-medical",
        gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
        description: "آيات الرقية الشرعية"
    },
    {
        id: "fatwas",
        name: "الفتاوى",
        icon: "fa-gavel",
        gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        description: "فتاوى وأحكام شرعية"
    },
    {
        id: "athkar",
        name: "الأدعية والأذكار",
        icon: "fa-hands-praying",
        gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        description: "أذكار الصباح والمساء"
    },
    {
        id: "seasons",
        name: "مواسم الخير",
        icon: "fa-moon",
        gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
        description: "رمضان والمناسبات"
    },
    {
        id: "qiraat",
        name: "القراءات العشر",
        icon: "fa-book-reader",
        gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        description: "القراءات العشر المتواترة"
    },
    {
        id: "general",
        name: "الإذاعة العامة",
        icon: "fa-broadcast-tower",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        description: "إذاعات متنوعة"
    },
    {
        id: "hadith",
        name: "صحيح البخاري ومسلم",
        icon: "fa-book-quran",
        gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        description: "أحاديث نبوية شريفة"
    }
]

// Manual radios (curated list supplementing the API)
export const manualRadios: Radio[] = [
    {
        id: 90000,
        name: "إذاعة القرأن الكريم من القاهرة",
        url: "https://stream.zeno.fm/ru2hqnplhk7uv",
        recent_date: new Date().toISOString(),
        img: "https://apkdownmod.com/thumbnail?src=images/appsicon/2020/08/app-image-5f42ba68a61b1.jpg"
    },
    // القراءات العشر - Ten Qira'at
    { id: 90001, name: "القارئ ياسين - رواية ورش عن نافع", url: "https://backup.qurango.net/radio/alqaria_yassen", recent_date: new Date().toISOString() },
    { id: 90002, name: "العيون الكوشي - رواية ورش عن نافع", url: "https://backup.qurango.net/radio/aloyoon_alkoshi", recent_date: new Date().toISOString() },
    { id: 90003, name: "عبدالباسط عبدالصمد - ورش عن نافع", url: "https://backup.qurango.net/radio/abdulbasit_abdulsamad_warsh", recent_date: new Date().toISOString() },
    { id: 90004, name: "عبدالرشيد صوفي - رواية السوسي عن أبي عمرو", url: "https://backup.qurango.net/radio/abdulrasheed_soufi_assosi", recent_date: new Date().toISOString() },
    { id: 90005, name: "عبدالرشيد صوفي - رواية خلف عن حمزة", url: "https://backup.qurango.net/radio/abdulrasheed_soufi_khalaf", recent_date: new Date().toISOString() },
    { id: 90006, name: "عمر القزابري - رواية ورش عن نافع", url: "https://backup.qurango.net/radio/omar_alqazabri", recent_date: new Date().toISOString() },
    { id: 90007, name: "وليد النائحي - رواية قالون عن نافع من طريق أبي نشيط", url: "https://backup.qurango.net/radio/waleed_alnaehi", recent_date: new Date().toISOString() },
    { id: 90008, name: "ياسر المزروعي - قراءة يعقوب الحضرمي بروايتي رويس وروح", url: "https://backup.qurango.net/radio/yasser_almazroyee", recent_date: new Date().toISOString() },
    { id: 90009, name: "محمد عبدالحكيم العبدالله - رواية البزي وقنبل عن ابن كثير", url: "https://backup.qurango.net/radio/mohammad_alabdullah_albizi", recent_date: new Date().toISOString() },
    { id: 90010, name: "محمد عبدالحكيم العبدالله - رواية الدوري عن الكسائي", url: "https://backup.qurango.net/radio/mohammad_alabdullah_aldorai", recent_date: new Date().toISOString() },
    { id: 90011, name: "محمود خليل الحصري - رواية ورش عن نافع", url: "https://backup.qurango.net/radio/mahmoud_khalil_alhussary_warsh", recent_date: new Date().toISOString() },
    { id: 90012, name: "مفتاح السلطني - رواية الدوري عن أبي عمرو", url: "https://backup.qurango.net/radio/muftah_alsaltany_aldori_an_abi_amr", recent_date: new Date().toISOString() },
    { id: 90013, name: "محمود الشيمي - رواية الدوري عن الكسائي", url: "https://backup.qurango.net/radio/mahmood_alsheimy", recent_date: new Date().toISOString() },
    { id: 90014, name: "إبراهيم الدوسري - رواية ورش عن نافع", url: "https://backup.qurango.net/radio/ibrahim_aldosari", recent_date: new Date().toISOString() },
    { id: 90015, name: "مفتاح السلطني - رواية الدوري عن الكسائي", url: "https://backup.qurango.net/radio/muftah_alsaltany_aldorai", recent_date: new Date().toISOString() },
    { id: 90016, name: "مفتاح السلطني - رواية ابن ذكوان عن ابن عامر", url: "https://backup.qurango.net/radio/muftah_alsaltany_ibn_thakwan_an_ibn_amr", recent_date: new Date().toISOString() },
    { id: 90017, name: "أحمد الطرابلسي - رواية قالون عن نافع", url: "https://backup.qurango.net/radio/ahmad_khader_altarabulsi", recent_date: new Date().toISOString() },
    { id: 90018, name: "الدوكالي محمد العالم - رواية قالون عن نافع", url: "https://backup.qurango.net/radio/addokali_mohammad_alalim", recent_date: new Date().toISOString() },
    { id: 90019, name: "محمد عبدالكريم - رواية ورش عن نافع من طريق أبي بكر الأصبهاني", url: "https://backup.qurango.net/radio/mohammad_abdullkarem_alasbahani", recent_date: new Date().toISOString() },
    { id: 90020, name: "الفاتح الزبير - رواية الدوري عن أبي عمرو", url: "https://backup.qurango.net/radio/alfateh_alzubair", recent_date: new Date().toISOString() },
    { id: 90021, name: "طارق دعوب - رواية قالون عن نافع", url: "https://backup.qurango.net/radio/tareq_abdulgani_daawob", recent_date: new Date().toISOString() },
    // مواسم الخير - Seasons of Goodness
    { id: 90022, name: "موسم ستة من شوال", url: "https://backup.qurango.net/radio/SixDaysOfShawwal", recent_date: new Date().toISOString() },
    { id: 90023, name: "موسم يوم عاشوراء", url: "https://backup.qurango.net/radio/TheDayofAshoora", recent_date: new Date().toISOString() },
    { id: 90024, name: "عشر ذي الحجة", url: "https://backup.qurango.net/radio/ten_dhul_hijjah", recent_date: new Date().toISOString() },
    // تلاوات متميزة - Distinguished Recitations
    { id: 90025, name: "الإذاعة العامة - اذاعة متنوعة لمختلف القراء", url: "https://backup.qurango.net/radio/mix", recent_date: new Date().toISOString() },
    { id: 90026, name: "محمد أيوب - قراءة متميزة", url: "https://backup.qurango.net/radio/ayyoub2", recent_date: new Date().toISOString() },
    // الفتاوى - Fatwas
    { id: 90027, name: "كتاب الاختيارات الفقهية في مسائل العبادات والمعاملات من فتاوى الشيخ الإمام ابن باز -رحمه لله", url: "https://backup.qurango.net/radio/alaikhtiarat_alfiqhayh_bin_baz", recent_date: new Date().toISOString() },
    // الرقية الشرعية - Ruqyah
    { id: 90028, name: "إذاعة آيات السكينة", url: "https://backup.qurango.net/radio/sakeenah", recent_date: new Date().toISOString() }
]

// API endpoint
export const RADIOS_API_URL = "https://mp3quran.net/api/v3/radios"

/**
 * Categorize a radio station based on its name.
 * Returns "excluded" for Sahaba-related radios (handled by a separate component).
 */
export function categorizeRadio(radio: Radio): string {
    const name = radio.name.toLowerCase()

    // Skip Sahaba-related radios (they have their own section now)
    if (name.includes("صحابة") || name.includes("الصحابي") || name.includes("التابعي")) {
        return "excluded"
    }

    // Translations
    if (name.includes("ترجمة")) return "translations"

    // Tafsir
    if (name.includes("تفسير") || name.includes("المختصر في تفسير")) return "tafsir"

    // Seerah & Stories
    if (name.includes("السيرة") || name.includes("قصص الأنبياء") || name.includes("في ظلال السيرة")) return "seerah"

    // Ruqyah
    if (name.includes("الرقية")) return "ruqyah"

    // Fatwas
    if (name.includes("الفتاوى") || name.includes("فتاوى")) return "fatwas"

    // Athkar
    if (name.includes("أذكار") || name.includes("آيات السكينة") || name.includes("الأدعية")) return "athkar"

    // Seasons
    if (name.includes("رمضان") || name.includes("العيد") || name.includes("تكبيرات") ||
        name.includes("موسم") || name.includes("عاشوراء") || name.includes("شوال") ||
        name.includes("ذي الحجة")) return "seasons"

    // Qira'at (Ten Recitations)
    if (name.includes("القراءات") || name.includes("قالون") || name.includes("ورش") ||
        name.includes("الدوري") || name.includes("السوسي") || name.includes("شعبة") ||
        name.includes("حفص") || name.includes("خلف") || name.includes("رواية")) return "qiraat"

    // Hadith
    if (name.includes("صحيح البخاري") || name.includes("صحيح مسلم") || name.includes("رياض الصالحين")) return "hadith"

    // Distinguished recitations
    if (name.includes("تراتيل") || name.includes("خاشعة") || name.includes("متميزة") || name.includes("سورة البقرة") || name.includes("سورة الملك")) return "distinguished"

    // General/Mix
    if (name.includes("الإذاعة العامة") || name.includes("متنوعة") || name.includes("mix")) return "general"

    // Default to reciters
    return "reciters"
}

/**
 * Get the category icon for a radio based on its categorization.
 */
export function getCategoryIcon(radio: Radio): string {
    const categoryId = categorizeRadio(radio)
    const category = categories.find(c => c.id === categoryId)
    return category ? category.icon : "fa-broadcast-tower"
}
