const fs = require('fs');

const normalizeArabic = (text) => {
    return text
        .replace(/[\u064B-\u065F]/g, "")
        .replace(/[\u0622\u0623\u0625\u0671]/g, "ا")
        .replace("ة", "ه")
}

const data = JSON.parse(fs.readFileSync('public/data/bukhari.json', 'utf8'));
const hadiths = data.hadiths;
console.log('Total:', hadiths.length);

const query = "سفيان";
const normQuery = normalizeArabic(query);
console.log('Query:', query, 'Norm:', normQuery);

const filtered = hadiths.filter(h => {
    if (!h || !h.text) return false;
    const normText = normalizeArabic(h.text);
    return normText.includes(normQuery);
});

console.log('Matches:', filtered.length);
if (hadiths.length > 0) {
    const h = hadiths[0];
    const norm = normalizeArabic(h.text);
    console.log('First Hadith Raw:', h.text.substring(0, 100));
    console.log('First Hadith Norm:', norm.substring(0, 100));
    console.log('Includes Norm Query?', norm.includes(normQuery));
}
