const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://raw.githubusercontent.com/batoulapps/quran-svg/master/svg/';
const OUTPUT_DIR = '/Users/mr-root/tmaninacopy3/public/mushaf/pages';
const TOTAL_PAGES = 604;

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function downloadAll() {
    console.log(`Starting download of ${TOTAL_PAGES} pages...`);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Download in batches of 10 to avoid overwhelming connection
    const BATCH_SIZE = 10;

    for (let i = 1; i <= TOTAL_PAGES; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && (i + j) <= TOTAL_PAGES; j++) {
            const pageNum = i + j;
            const pageStr = String(pageNum).padStart(3, '0');
            const url = `${BASE_URL}${pageStr}.svg`;
            const dest = path.join(OUTPUT_DIR, `${pageStr}.svg`); // Keep as SVG for now

            // Skip if already exists
            if (fs.existsSync(dest)) {
                // console.log(`Skipping page ${pageStr} (already exists)`);
                continue;
            }

            batch.push(
                downloadFile(url, dest)
                    .then(() => process.stdout.write(`.`))
                    .catch(err => console.error(`\nError downloading page ${pageStr}: ${err.message}`))
            );
        }

        await Promise.all(batch);
    }

    console.log('\nDownload complete!');
}

downloadAll();
