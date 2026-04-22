import html
import os

input_file = "Archives/ascii.txt"
output_file = "game/assets/ascii-bg.svg"

with open(input_file, 'r') as f:
    lines = f.readlines()

line_count = len(lines)
max_length = max(len(line.rstrip('\r\n')) for line in lines) if lines else 0

char_width = 10
char_height = 20
svg_width = max_length * char_width
svg_height = (line_count + 1) * char_height

print(f"Line Count: {line_count}")
print(f"Max Line Length: {max_length}")
print(f"SVG Width: {svg_width}")
print(f"SVG Height: {svg_height}")

with open(output_file, 'w') as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_width}" height="{svg_height}">\n')
    f.write('  <rect width="100%" height="100%" fill="black" />\n')
    f.write('  <text x="0" y="20" font-family="monospace" font-size="20" fill="white" xml:space="preserve">\n')
    for line in lines:
        escaped_line = html.escape(line.rstrip('\r\n'))
        f.write(f'    <tspan x="0" dy="1.2em">{escaped_line}</tspan>\n')
    f.write('  </text>\n')
    f.write('</svg>\n')

print(f"File created: {output_file}")
