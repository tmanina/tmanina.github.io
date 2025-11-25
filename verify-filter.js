const fs = require('fs');

const normalizeArabic = (text) => {
    return text
        .replace(/[\u064B-\u065F]/g, "") // Remove tashkeel
        .replace(/[\u0622\u0623\u0625\u0671]/g, "ا") // Normalize alef
        .replace("ة", "ه") // Normalize ta marbuta
}

try {
    const data = JSON.parse(fs.readFileSync('public/data/bukhari.json', 'utf8'));
    const hadiths = data.hadiths;
    console.log('Total hadiths:', hadiths.length);

    const searchQuery = "النية";
    const normalizedQuery = normalizeArabic(searchQuery);
    console.log('Search query:', searchQuery);
    console.log('Normalized query:', normalizedQuery);

    const filtered = hadiths.filter((h, index) => {
        if (!h) return false;
        const normalizedText = h.text ? normalizeArabic(h.text) : "";
        if (index === 0) {
            console.log('First hadith text:', h.text);
            console.log('First hadith normalized:', normalizedText);
        }

        const textMatch = normalizedText.includes(normalizedQuery);
        const numberMatch = h.hadith_number && h.hadith_number.toString().includes(searchQuery);
        return textMatch || numberMatch;
    });

    console.log('Filtered count:', filtered.length);

} catch (e) {
    console.error(e);
}
