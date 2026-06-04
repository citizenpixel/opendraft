export type FountainBlockType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export type FountainBlock = {
  type: FountainBlockType;
  text: string;
};

const sceneHeadingPattern = /^(INT\.|EXT\.)\s+/i;
const transitionPattern = /^[A-Z][A-Z0-9 .'-]* TO:$/;

export function parseFountain(source: string): FountainBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: FountainBlock[] = [];
  let expectsDialogue = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      expectsDialogue = false;
      continue;
    }

    const block = classifyLine(line, expectsDialogue);
    blocks.push(block);
    expectsDialogue =
      block.type === "character" || block.type === "dialogue" || block.type === "parenthetical";
  }

  return blocks;
}

function classifyLine(line: string, expectsDialogue: boolean): FountainBlock {
  if (sceneHeadingPattern.test(line)) {
    return { type: "scene-heading", text: line.toUpperCase() };
  }

  if (transitionPattern.test(line)) {
    return { type: "transition", text: line };
  }

  if (expectsDialogue && line.startsWith("(")) {
    return { type: "parenthetical", text: line };
  }

  if (expectsDialogue) {
    return { type: "dialogue", text: line };
  }

  if (isAllCaps(line)) {
    return { type: "character", text: line };
  }

  return { type: "action", text: line };
}

function isAllCaps(line: string): boolean {
  return /[A-Z]/.test(line) && line === line.toUpperCase();
}
