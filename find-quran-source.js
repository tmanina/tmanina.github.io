const https = require('https');

const sources = [
    "https://raw.githubusercontent.com/semarketir/quranjson/master/source/images/001.png",
    "https://everyayah.com/data/images_png/001.png",
    "https://android.quran.com/data/width_1024/page001.png",
    "https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/kfgqpc/Hafs/page001.png",
    "https://raw.githubusercontent.com/fawazahmed0/quran-images/master/images/001.png"
];

function checkUrl(url) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
    });
}

async function findSource() {
    console.log("Checking sources...");
    for (const url of sources) {
        process.stdout.write(`Checking ${url} ... `);
        const exists = await checkUrl(url);
        if (exists) {
            console.log("FOUND!");
            console.log(`Working URL: ${url}`);
            process.exit(0);
        } else {
            console.log("Failed");
        }
    }
    console.log("No working source found.");
    process.exit(1);
}

findSource();
