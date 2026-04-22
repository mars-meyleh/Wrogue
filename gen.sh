#!/bin/bash
INPUT_FILE="Archives/ascii.txt"
OUTPUT_FILE="game/assets/ascii-bg.svg"
LINE_COUNT=$(wc -l < "$INPUT_FILE")
MAX_LENGTH=$(awk "{ if (length > max) max = length } END { print max }" "$INPUT_FILE")
CHAR_WIDTH=10
CHAR_HEIGHT=20
SVG_WIDTH=$((MAX_LENGTH * CHAR_WIDTH))
SVG_HEIGHT=$(( (LINE_COUNT + 1) * CHAR_HEIGHT))
echo "Line Count: $LINE_COUNT"
echo "Max Line Length: $MAX_LENGTH"
echo "SVG Width: $SVG_WIDTH"
echo "SVG Height: $SVG_HEIGHT"
{
echo "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"$SVG_WIDTH\" height=\"$SVG_HEIGHT\">"
echo "  <rect width=\"100%\" height=\"100%\" fill=\"black\" />"
echo "  <text x=\"0\" y=\"20\" font-family=\"monospace\" font-size=\"20\" fill=\"white\" xml:space=\"preserve\">"
while IFS= read -r line || [[ -n "$line" ]]; do
    escaped_line=$(echo "$line" | sed "s/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/\"/\&quot;/g; s/'\/\&apos;/g")
    echo "    <tspan x=\"0\" dy=\"1.2em\">$escaped_line</tspan>"
done < "$INPUT_FILE"
echo "  </text>"
echo "</svg>"
} > "$OUTPUT_FILE"
ls -l "$OUTPUT_FILE"
