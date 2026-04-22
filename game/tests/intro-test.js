// ============================================================
// WROGUE / ORCAERY ASCII INTRO
// Single-file version for analysis and editing
// Requires: <pre id="screen"></pre> in your HTML
// ============================================================

const screen = document.getElementById("screen");
const FRAME_WIDTH_PX = 1100;
const FRAME_HEIGHT_PX = 980;

// ------------------------------------------------------------
// BASIC SCREEN STYLE FROM JS (optional, but useful for testing)
// ------------------------------------------------------------
document.body.style.background = "black";
document.body.style.color = "#b7d18c";
document.body.style.margin = "0";
document.body.style.position = "relative";
document.body.style.width = "100vw";
document.body.style.height = "100vh";
document.body.style.overflow = "hidden";
document.body.style.fontFamily = '"Courier New", monospace';

screen.style.whiteSpace = "pre";
screen.style.fontSize = "14px";
screen.style.lineHeight = "1";
screen.style.padding = "20px";
screen.style.width = `${FRAME_WIDTH_PX}px`;
screen.style.height = `${FRAME_HEIGHT_PX}px`;
screen.style.boxSizing = "border-box";
screen.style.border = "1px solid #556b2f";
screen.style.boxShadow = "0 0 24px rgba(120,180,80,0.15) inset";
screen.style.background = "black";
screen.style.color = "#b7d18c";
screen.style.overflow = "hidden";
screen.style.position = "absolute";
screen.style.transformOrigin = "top left";

function fitFrameToViewport() {
  const padding = 16;
  const availableWidth = Math.max(window.innerWidth - padding * 2, 1);
  const availableHeight = Math.max(window.innerHeight - padding * 2, 1);
  const scale = Math.min(availableWidth / FRAME_WIDTH_PX, availableHeight / FRAME_HEIGHT_PX, 1);

  const scaledWidth = FRAME_WIDTH_PX * scale;
  const scaledHeight = FRAME_HEIGHT_PX * scale;

  screen.style.transform = `scale(${scale})`;
  screen.style.left = `${Math.floor((window.innerWidth - scaledWidth) / 2)}px`;
  screen.style.top = `${Math.floor((window.innerHeight - scaledHeight) / 2)}px`;
}

window.addEventListener("resize", fitFrameToViewport);
fitFrameToViewport();

// ------------------------------------------------------------
// UTIL
// ------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function padRight(str, width) {
  if (str.length >= width) return str;
  return str + " ".repeat(width - str.length);
}

function fitToWidth(str, width) {
  const text = String(str ?? "").replace(/\r/g, "");
  if (text.length <= width) return padRight(text, width);
  return text.slice(0, width);
}

function wrapTextToWidth(str, width) {
  const text = String(str ?? "").replace(/\r/g, "").trim();
  if (!text) return [""];

  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }
      continue;
    }

    if (!current) {
      current = word;
      continue;
    }

    if (current.length + 1 + word.length <= width) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function centerText(str, width) {
  return String(str)
    .split("\n")
    .map(line => {
      if (line.length >= width) return line;
      const left = Math.floor((width - line.length) / 2);
      const right = width - line.length - left;
      return " ".repeat(left) + line + " ".repeat(right);
    })
    .join("\n");
}

function setScreen(text) {
  screen.textContent = text;
}

// ------------------------------------------------------------
// COLOR FEEL VIA ASCII ONLY
// Since we are using a <pre>, we fake “panels” and old terminal.
// ------------------------------------------------------------

const GLYPHS = ["@", "#", "%", "&", "█", "▓", "▒", "░", "?", "/", "\\", "=", "+", "~"];
const GLITCH_CHARS = ["@", "#", "%", "&", "█", "?", "0", "1", "X", "=", ":", ";", "~"];

function corruptText(text, intensity = 0.04) {
  return text
    .split("")
    .map(ch => {
      if (ch === "\n") return ch;
      if (ch === " ") return Math.random() < intensity * 0.15 ? pick([".", " "]) : ch;
      if (Math.random() < intensity) return pick(GLITCH_CHARS);
      return ch;
    })
    .join("");
}

function horizontalNoiseLine(width = 100, intensity = 0.25) {
  let line = "";
  for (let i = 0; i < width; i++) {
    line += Math.random() < intensity ? pick(["-", "=", "~", ":", ".", " "]) : " ";
  }
  return line;
}

function addScanlines(text) {
  const lines = text.split("\n");
  return lines
    .map((line, i) => {
      if (i % 4 === 1) {
        return line.replace(/[^\s]/g, ch => (Math.random() < 0.08 ? "." : ch));
      }
      return line;
    })
    .join("\n");
}

function addRandomNoiseToFrame(text, lineCount = 2) {
  const lines = text.split("\n");
  for (let i = 0; i < lineCount; i++) {
    const idx = randInt(0, lines.length - 1);
    lines[idx] = horizontalNoiseLine(lines[idx].length || 100, 0.35);
  }
  return lines.join("\n");
}

async function flickerFrame(baseText, frames = 6, speed = 60, intensity = 0.08) {
  for (let i = 0; i < frames; i++) {
    let frame = corruptText(baseText, intensity);
    frame = addScanlines(frame);
    if (Math.random() < 0.5) frame = addRandomNoiseToFrame(frame, randInt(1, 3));
    setScreen(frame);
    await sleep(speed);
  }
  setScreen(baseText);
}

async function glitchBurst(baseText, duration = 600, intensity = 0.15) {
  const start = performance.now();
  while (performance.now() - start < duration) {
    let frame = corruptText(baseText, intensity);
    frame = addScanlines(frame);
    if (Math.random() < 0.7) frame = addRandomNoiseToFrame(frame, randInt(2, 4));
    setScreen(frame);
    await sleep(randInt(35, 75));
  }
  setScreen(baseText);
}

// ------------------------------------------------------------
// ASCII ART BLOCKS
// ------------------------------------------------------------

const ORCAERY_WHALE = String.raw`
                              __
                     _.-~  )_)
          _.--~~~~'~   _--~ /  
        .'           .'    /    
       /   ORCAERY  /     /     
      |            |     |      
       \           \     \      
         '-..__..-' \__.-'      
`;

const ASHROOT_TREE = String.raw`
                     &&& &&  & &&
                 && &\/&\|& ()|/ @, &&
                 &\/(/&/&||/& /_/)_&/_&
              &() &\/&|()|/&\/ '%" & ()
             &_\_&&_\ |& |&&/&__%_/_& &&
           &&   && & &| &| /& & % ()& /&&
            ()&_---()&\&\|&&-&&--%---()~
                &&     \||| 
                        |||
                        |||
                        |||
                  , -=-~  .-^- _
`;

const WROGUE_TITLE = String.raw`
██╗    ██╗██████╗  ██████╗  ██████╗ ██╗   ██╗███████╗
██║    ██║██╔══██╗██╔═══██╗██╔════╝ ██║   ██║██╔════╝
██║ █╗ ██║██████╔╝██║   ██║██║  ███╗██║   ██║█████╗  
██║███╗██║██╔══██╗██║   ██║██║   ██║██║   ██║██╔══╝  
╚███╔███╔╝██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝███████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝
`;

const MINI_ICONS = {
  tree: String.raw`
      /\
    &&&&&&
   &&&&&&&&
     ||||
     ||||
     ||||
    _||||_
`,
  codex: String.raw`
     ______
    /     /\
   /_____/  \
   \     \  /
    \_____\/
`,
  merchant: String.raw`
      /\
     /__\
    / || \
      ||
     /__\
`,
  forge: String.raw`
      _/_ 
   __/___\__
     (___)
      /_\
`,
  rest: String.raw`
      /\
     /  \
    /____\
      ||
      ||
`
};

// ------------------------------------------------------------
// PANEL / LAYOUT HELPERS
// ------------------------------------------------------------

function makeBox(title, contentLines, width = 34) {
  const horizontal = "-".repeat(width - 2);
  let out = "";
  out += "+" + horizontal + "+\n";

  const titleLine = "| " + fitToWidth(title, width - 4) + " |\n";
  out += titleLine;

  out += "|" + " ".repeat(width - 2) + "|\n";

  for (const line of contentLines) {
    const raw = String(line ?? "");
    const preparedLines = /^\s/.test(raw)
      ? [fitToWidth(raw, width - 4)]
      : wrapTextToWidth(raw, width - 4);

    for (const prepared of preparedLines) {
      out += "| " + padRight(prepared, width - 4) + " |\n";
    }
  }

  out += "+" + horizontal + "+";
  return out;
}

function mergeColumns(columns, gap = "   ") {
  const splitCols = columns.map(c => c.split("\n"));
  const maxHeight = Math.max(...splitCols.map(c => c.length));
  const widths = splitCols.map(col => Math.max(...col.map(line => line.length)));

  const normalized = splitCols.map((col, idx) => {
    const width = widths[idx];
    const result = [];
    for (let i = 0; i < maxHeight; i++) {
      result.push(padRight(col[i] || "", width));
    }
    return result;
  });

  const lines = [];
  for (let row = 0; row < maxHeight; row++) {
    lines.push(normalized.map(col => col[row]).join(gap));
  }
  return lines.join("\n");
}

function progressBar(percent, width = 28) {
  const filled = Math.round((percent / 100) * width);
  return "[" + "█".repeat(filled) + " ".repeat(width - filled) + `] ${String(percent).padStart(3, " ")}%`;
}

function bootPanelContent(progress) {
  return [
    "> Initializing Orcaery Systems...",
    "> Memory Check.............[ OK ]",
    "> Core Modules.............[ OK ]",
    "> Video Interface..........[ OK ]",
    "> Input Devices............[ OK ]",
    "> Ashroot Link.............[ ?? ]",
    "> World Seed...............[ OK ]",
    "> Loading Dungeon Protocols......",
    "> Establishing Connection........",
    "> Handshake................[ OK ]",
    "",
    "Orcaery Systems",
    "All systems nominal.",
    "",
    progressBar(progress, 20)
  ];
}

function orcaeryPanelContent() {
  return [
    "",
    "         __",
    "  _.-~  )_)",
    " /      /",
    "| ORCAERY",
    " \\      \\",
    "  ~-._  )",
    "       \\",
    "",
    "indie games from the deep",
    "",
    "The descent begins below."
  ];
}

function interferencePanelContent(progress) {
  return [
    "",
    "// WARNING: ASHROOT INTERFERENCE",
    "",
    "// REALITY STABILIZING...",
    "",
    progressBar(progress, 22),
    "",
    "Signal bleed detected.",
    "Memory echo present.",
    "Proceeding anyway."
  ];
}

function ashrootPanelContent() {
  return [
    "",
    "         /\\",
    "       &&&&&&",
    "      &&&&&&&&",
    "        ||||",
    "        ||||",
    "        ||||",
    "",
    "ASHROOT",
    "THE WORLD REMEMBERS."
  ];
}

function normalizeAsciiIcon(iconText) {
  const lines = String(iconText)
    .replace(/^\n+|\n+$/g, "")
    .split("\n");

  const nonEmpty = lines.filter(line => line.trim().length > 0);
  if (nonEmpty.length === 0) return lines;

  const commonIndent = Math.min(...nonEmpty.map(line => {
    const match = line.match(/^\s*/);
    return match ? match[0].length : 0;
  }));

  return lines.map(line => line.slice(commonIndent));
}

function inGameLoaderPanel(title, subtitle, percent, iconText) {
  const iconLines = normalizeAsciiIcon(iconText).map(line => centerText(line, 24));
  return makeBox(
    title,
    [
      progressBar(percent, 18),
      "",
      ...iconLines,
      "",
      subtitle
    ],
    28
  );
}

function makeSectionHeader(text, width = 110) {
  const label = `[ ${text} ]`;
  if (label.length >= width) return label;
  const left = Math.floor((width - label.length) / 2);
  const right = width - label.length - left;
  return "=".repeat(left) + label + "=".repeat(right);
}

function buildLoaderPanels(visibleCount = 4) {
  const panels = [
    inGameLoaderPanel("DESCENDING...", "The dark grows closer.", 34, MINI_ICONS.tree),
    inGameLoaderPanel("OPENING CODEX...", "Knowledge resists you.", 71, MINI_ICONS.codex),
    inGameLoaderPanel("VISITING MERCHANT...", "Everything has a price.", 42, MINI_ICONS.merchant),
    inGameLoaderPanel("FORGING / CRAFTING...", "Ash becomes something more.", 63, MINI_ICONS.forge)
  ];

  const placeholder = inGameLoaderPanel("LINK PENDING...", "Awaiting synchronization.", 0, MINI_ICONS.rest);
  return panels.map((panel, idx) => (idx < visibleCount ? panel : placeholder));
}

// ------------------------------------------------------------
// MAIN SCREEN BUILDERS
// ------------------------------------------------------------

function buildMainBootScreen(bootProgress = 42, interferenceProgress = 42) {
  const topLeft = makeBox("1. BOOT", bootPanelContent(bootProgress), 34);
  const topMid = makeBox("2. ORCAERY", orcaeryPanelContent(), 34);
  const topRight = makeBox("3. CORRUPTION SURGE", interferencePanelContent(interferenceProgress), 34);

  const firstRow = mergeColumns([topLeft, topMid, topRight], "   ");

  const titleBlock = [
    centerText("ORCAERY SYSTEMS v1.0.0", 110),
    "",
    centerText("BOOT SEQUENCE", 110),
    "",
    firstRow
  ].join("\n");

  return titleBlock;
}

function buildFullIntroFrame(opts = {}) {
  const {
    bootProgress = 100,
    interferenceProgress = 68,
    titleCorruption = false,
    titleCorruptionIntensity = 0.08,
    loadPercent = 68,
    footerBlink = false,
    footerText = "",
    loadersVisibleCount = 4
  } = opts;

  const left = makeBox("1. BOOT", bootPanelContent(bootProgress), 34);
  const mid = makeBox("2. ORCAERY", orcaeryPanelContent(), 34);
  const right = makeBox("3. CORRUPTION SURGE", interferencePanelContent(interferenceProgress), 34);

  const row1 = mergeColumns([left, mid, right], "   ");

  const title = titleCorruption
    ? corruptText(WROGUE_TITLE, titleCorruptionIntensity)
    : WROGUE_TITLE;

  const loadSection = makeBox(
    "4. LOADING",
    [
      centerText("LOADING WROGUE", 30),
      progressBar(loadPercent, 22),
      "",
      "Scanning dungeons...",
      "Weaving Ashroot...",
      "Preparing horrors..."
    ],
    110
  );

  const loaders = mergeColumns(buildLoaderPanels(loadersVisibleCount), "  ");

  const resolvedFooterText = footerText || (footerBlink
    ? "PRESS ANY KEY TO BEGIN YOUR DESCENT"
    : " ");
  const footer = centerText(resolvedFooterText, 110);

  return [
    centerText("ORCAERY SYSTEMS v1.0.0", 110),
    "",
    row1,
    makeSectionHeader("5. TITLE REVEAL", 110),
    title,
    centerText("DIVE. LOOT. GROW. DESCEND.", 110),
    loadSection,
    makeSectionHeader("6. IN-GAME LOADERS (EXAMPLES)", 110),
    loaders,
    "",
    footer
  ].join("\n");
}

// ------------------------------------------------------------
// OLD TERMINAL TEXT BOOT
// ------------------------------------------------------------

async function typeLines(lines, delayPerLine = 180, charDelay = 10) {
  let current = "";

  for (const line of lines) {
    for (const ch of line) {
      current += ch;
      setScreen(current);
      await sleep(charDelay);
    }
    current += "\n";
    setScreen(current);
    await sleep(delayPerLine);
  }

  return current;
}

async function quickBootTextPhase() {
  const lines = [
    "ORCAERY SYSTEMS v1.0.0",
    "Boot sequence started.",
    "",
    "> Initializing Orcaery Systems...",
    "> Memory Check.............[ OK ]",
    "> Core Modules.............[ OK ]",
    "> Video Interface..........[ OK ]",
    "> Input Devices............[ OK ]",
    "> Ashroot Link.............[ ?? ]",
    "> World Seed...............[ OK ]",
    "",
    "Signal anomaly detected."
  ];

  await typeLines(lines, 120, 8);
  await sleep(400);
}

// ------------------------------------------------------------
// ANIMATION PHASES
// ------------------------------------------------------------

async function animatePanelBoot() {
  for (let p = 0; p <= 100; p += 10) {
    const frame = buildMainBootScreen(Math.min(p, 100), Math.min(Math.max(p - 20, 0), 68));
    setScreen(frame);
    if (p === 50) {
      await glitchBurst(frame, 400, 0.12);
    } else {
      await sleep(120);
    }
  }
}

async function animateOrcaeryWhaleFocus() {
  const frame = [
    "",
    centerText("ORCAERY", 100),
    "",
    centerText(ORCAERY_WHALE.split("\n")[1] || "", 100),
    centerText(ORCAERY_WHALE.split("\n")[2] || "", 100),
    centerText(ORCAERY_WHALE.split("\n")[3] || "", 100),
    centerText(ORCAERY_WHALE.split("\n")[4] || "", 100),
    centerText(ORCAERY_WHALE.split("\n")[5] || "", 100),
    centerText(ORCAERY_WHALE.split("\n")[6] || "", 100),
    "",
    centerText("indie games from the deep", 100)
  ].join("\n");

  await flickerFrame(frame, 8, 70, 0.06);
  await sleep(500);
}

async function animateAshrootInterference() {
  const frames = [
    `
[WARNING] ASHROOT INTERFERENCE DETECTED
REALITY STABILIZING...
${progressBar(18, 28)}
`,
    `
[WARNING] ASHROOT INTERFERENCE DETECTED
REALITY STABILIZING...
${progressBar(42, 28)}
`,
    `
[WARNING] ASHROOT INTERFERENCE DETECTED
REALITY STABILIZING...
${progressBar(68, 28)}
`
  ];

  for (const text of frames) {
    await glitchBurst(centerText(text.trim(), 90), 450, 0.22);
    await sleep(120);
  }
}

async function animateTitleReveal() {
  for (let i = 0; i < 8; i++) {
    const t = (i + 1) / 8;
    const loadPercent = Math.round(20 + 48 * t * t);
    const titleIntensity = 0.2 * (1 - t) + 0.01;
    const frameIntensity = 0.09 * (1 - t) + 0.015;
    const base = buildFullIntroFrame({
      bootProgress: 100,
      interferenceProgress: 68,
      titleCorruption: true,
      titleCorruptionIntensity: titleIntensity,
      loadPercent,
      footerBlink: false,
      loadersVisibleCount: 1
    });
    setScreen(addRandomNoiseToFrame(corruptText(base, frameIntensity), 1));
    await sleep(110);
  }

  const stable = buildFullIntroFrame({
    bootProgress: 100,
    interferenceProgress: 68,
    titleCorruption: false,
    loadPercent: 68,
    footerBlink: false,
    loadersVisibleCount: 1
  });

  setScreen(stable);
  await sleep(700);
}

async function animateFinalBlinkLoop() {
  const prompts = [
    "PRESS ANY KEY TO BEGIN YOUR DESCENT",
    "THE DESCENT AWAITS // PRESS ANY KEY"
  ];

  for (let i = 0; i < 8; i++) {
    const visibleCount = Math.min(4, 1 + Math.floor(i / 2));
    let frameA = buildFullIntroFrame({
      bootProgress: 100,
      interferenceProgress: 68,
      titleCorruption: false,
      loadPercent: 68,
      footerText: prompts[i % prompts.length],
      loadersVisibleCount: visibleCount
    });

    if (i % 3 === 2) {
      frameA = addRandomNoiseToFrame(frameA, 1);
    }

    setScreen(frameA);
    await sleep(420);
  }
}

// ------------------------------------------------------------
// EXTRA REUSABLE LOADING ANIMATIONS FOR IN-GAME STATES
// ------------------------------------------------------------

async function runMiniLoader(label, subtitle, percentTarget = 100, iconText = MINI_ICONS.codex) {
  for (let p = 0; p <= percentTarget; p += 7) {
    const panel = inGameLoaderPanel(label, subtitle, Math.min(p, 100), iconText);
    let frame = "\n\n\n" + centerText(panel, 110);

    if (Math.random() < 0.22) {
      frame = corruptText(frame, 0.06);
    }

    setScreen(frame);
    await sleep(70);
  }
}

async function demoMiniLoaders() {
  await runMiniLoader("DESCENDING...", "The dark grows closer.", 100, ASHROOT_TREE);
  await sleep(250);
  await runMiniLoader("OPENING CODEX...", "Knowledge resists you.", 100, MINI_ICONS.codex);
  await sleep(250);
  await runMiniLoader("VISITING MERCHANT...", "Everything has a price.", 100, MINI_ICONS.merchant);
  await sleep(250);
  await runMiniLoader("FORGING / CRAFTING...", "Ash becomes something more.", 100, MINI_ICONS.forge);
  await sleep(350);
}

// ------------------------------------------------------------
// FULL INTRO SEQUENCE
// ------------------------------------------------------------

let introFinished = false;
let introStarted = false;

async function playIntro() {
  if (introStarted) return;
  introStarted = true;

  await quickBootTextPhase();
  await animatePanelBoot();
  await sleep(250);

  await animateOrcaeryWhaleFocus();
  await animateAshrootInterference();
  await animateTitleReveal();
  await animateFinalBlinkLoop();

  introFinished = true;
}

function startGamePlaceholder() {
  setScreen(`
${centerText("WROGUE", 100)}

${centerText("Intro finished. Replace startGamePlaceholder() with your real game start.", 100)}

${centerText("Suggested next integration:", 100)}
${centerText("- state = 'TITLE' or 'MENU'", 100)}
${centerText("- after key press, call your actual start function", 100)}
`);
}

// ------------------------------------------------------------
// KEY INPUT
// ------------------------------------------------------------

document.addEventListener("keydown", async (e) => {
  if (!introStarted) return;

  if (introFinished) {
    startGamePlaceholder();
  }
});

// ------------------------------------------------------------
// AUTO START
// ------------------------------------------------------------

playIntro();

// ------------------------------------------------------------
// OPTIONAL: expose helpers in console for you to test manually
// ------------------------------------------------------------
window.WROGUE_INTRO = {
  playIntro,
  runMiniLoader,
  demoMiniLoaders,
  corruptText,
  glitchBurst,
  buildFullIntroFrame,
  startGamePlaceholder
};