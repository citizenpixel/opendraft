export type FountainBlockType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "shot"
  | "general-text"
  | "general-text-centered";

export type FountainBlock = {
  type: FountainBlockType;
  text: string;
};

const sceneHeadingPattern = /^(INT\.|EXT\.)\s+/i;
const transitionPattern = /\bTO:$/i;

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
  if (line.startsWith("[[OpenDraft: Shot]]")) {
    return { type: "shot", text: line.replace("[[OpenDraft: Shot]]", "").trimStart() };
  }

  if (line.startsWith("[[OpenDraft: General Text]]")) {
    return {
      type: "general-text",
      text: line.replace("[[OpenDraft: General Text]]", "").trimStart(),
    };
  }

  if (line.startsWith(">") && line.endsWith("<")) {
    return { type: "general-text-centered", text: line.slice(1, -1).trim() };
  }

  if (line.startsWith("!")) {
    return { type: "action", text: line.slice(1) };
  }

  if (line.startsWith("@")) {
    return { type: "character", text: line.slice(1).toUpperCase() };
  }

  if (sceneHeadingPattern.test(line)) {
    return { type: "scene-heading", text: line.toUpperCase() };
  }

  if (transitionPattern.test(line)) {
    return { type: "transition", text: line.toUpperCase() };
  }

  if (expectsDialogue && line.startsWith("(")) {
    return { type: "parenthetical", text: line };
  }

  if (expectsDialogue) {
    return { type: "dialogue", text: line };
  }

  return { type: "action", text: line };
}
