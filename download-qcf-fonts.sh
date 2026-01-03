#!/bin/bash
# Download all QCF fonts (QCF_P001 to QCF_P604)
# Run: chmod +x download-qcf-fonts.sh && ./download-qcf-fonts.sh

BASE_URL="https://raw.githubusercontent.com/mustafa0x/qpc-fonts/f93bf5f3/mushaf-woff2"
OUTPUT_DIR="public/fonts/qcf/mushaf-woff2"

mkdir -p "$OUTPUT_DIR"

# Download Basmala font
echo "Downloading QCF_BSML.woff2..."
curl -sL -o "$OUTPUT_DIR/QCF_BSML.woff2" "$BASE_URL/QCF_BSML.woff2"

# Download all page fonts (001-604)
for i in $(seq 1 604); do
    PAGE=$(printf "%03d" $i)
    FILENAME="QCF_P${PAGE}.woff2"
    
    if [ -f "$OUTPUT_DIR/$FILENAME" ]; then
        echo "[$PAGE/604] Already exists: $FILENAME"
    else
        echo "[$PAGE/604] Downloading: $FILENAME"
        curl -sL -o "$OUTPUT_DIR/$FILENAME" "$BASE_URL/$FILENAME"
    fi
done

echo "Done! All QCF fonts downloaded to $OUTPUT_DIR"
