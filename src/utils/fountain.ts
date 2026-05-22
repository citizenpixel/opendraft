export type FountainBlockType = "scene-heading" | "action" | "character" | "dialogue";

export type FountainBlock = {
  type: FountainBlockType;
  text: string;
};

const sceneHeadingPattern = /^(INT\.|EXT\.)\s+/;

export function parseFountain(source: string): FountainBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: FountainBlock[] = [];
  let isInDialogue = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      isInDialogue = false;
      continue;
    }

    const block = classifyLine(line, isInDialogue);
    blocks.push(block);
    isInDialogue = block.type === "character" || block.type === "dialogue";
  }

  return blocks;
}

function classifyLine(line: string, isInDialogue: boolean): FountainBlock {
  if (sceneHeadingPattern.test(line)) {
    return { type: "scene-heading", text: line };
  }

  if (isInDialogue) {
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
