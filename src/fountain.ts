export type FountainBlockType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "centered"
  | "title";

export type FountainBlock = {
  type: FountainBlockType;
  text: string;
};

const sceneHeadingPattern = /^(INT\.|EXT\.|EST\.|INT\/EXT\.|I\/E\.)\s+/i;
const transitionPattern = /^([A-Z][A-Z0-9 .'-]+ TO:|FADE OUT\.|CUT TO BLACK\.)$/;

export function parseFountain(source: string): FountainBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: FountainBlock[] = [];
  let previousType: FountainBlockType | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      previousType = null;
      continue;
    }

    const block = classifyLine(line, previousType);
    blocks.push(block);
    previousType = block.type;
  }

  return blocks;
}

function classifyLine(line: string, previousType: FountainBlockType | null): FountainBlock {
  if (line.startsWith("Title:")) {
    return { type: "title", text: line.replace(/^Title:\s*/i, "") };
  }

  if (line.startsWith(">") && line.endsWith("<")) {
    return { type: "centered", text: line.slice(1, -1).trim() };
  }

  if (sceneHeadingPattern.test(line) || line.startsWith(".")) {
    return { type: "scene-heading", text: line.replace(/^\./, "") };
  }

  if (transitionPattern.test(line)) {
    return { type: "transition", text: line };
  }

  if (line.startsWith("(") && line.endsWith(")")) {
    return { type: "parenthetical", text: line };
  }

  if (isCharacterCue(line, previousType)) {
    return { type: "character", text: line };
  }

  if (previousType === "character" || previousType === "parenthetical" || previousType === "dialogue") {
    return { type: "dialogue", text: line };
  }

  return { type: "action", text: line };
}

function isCharacterCue(line: string, previousType: FountainBlockType | null): boolean {
  if (previousType === "dialogue" || previousType === "parenthetical") {
    return false;
  }

  return /^[A-Z][A-Z0-9 '().-]{1,28}$/.test(line) && !transitionPattern.test(line);
}
