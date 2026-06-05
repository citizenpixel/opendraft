import { getFountainFilename } from "./exportFountain";
import { parseFountain, type FountainBlockType } from "./fountain";
import { createFileSaveTarget } from "./saveFile";

const page = {
  bottom: 720,
  left: 72,
  top: 72,
  width: 468,
};

type BlockLayout = {
  align?: "left" | "center" | "right";
  bold?: boolean;
  gapAfter: number;
  gapBefore: number;
  width: number;
  x: number;
};

export async function exportScreenplayPdf(source: string) {
  const filename = getFountainFilename(source).replace(/\.fountain$/i, ".pdf");
  const saveTarget = await createFileSaveTarget(filename, {
    description: "PDF screenplay",
    extension: ".pdf",
    mimeType: "application/pdf",
  });

  if (!saveTarget) {
    return;
  }

  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({
    format: "letter",
    unit: "pt",
  });
  const blocks = parseFountain(source);
  let y = page.top;

  document.setFont("courier", "normal");
  document.setFontSize(12);
  document.setLineHeightFactor(1.15);

  for (const block of blocks) {
    const layout = getBlockLayout(block.type);
    const text = formatPdfText(block.text, block.type);
    const lines = document.splitTextToSize(text, layout.width);
    const blockHeight = lines.length * 14;

    if (y + layout.gapBefore + blockHeight > page.bottom) {
      document.addPage("letter");
      y = page.top;
    }

    y += layout.gapBefore;
    document.setFont("courier", layout.bold ? "bold" : "normal");
    document.text(lines, layout.x, y, {
      align: layout.align ?? "left",
      maxWidth: layout.width,
    });
    y += blockHeight + layout.gapAfter;
  }

  await saveTarget.write(document.output("blob"));
}

function getBlockLayout(type: FountainBlockType): BlockLayout {
  switch (type) {
    case "scene-heading":
    case "shot":
      return { bold: true, gapAfter: 10, gapBefore: 14, width: page.width, x: page.left };
    case "character":
      return { align: "center", gapAfter: 2, gapBefore: 10, width: 250, x: 306 };
    case "dialogue":
      return { gapAfter: 10, gapBefore: 0, width: 280, x: 166 };
    case "parenthetical":
      return { gapAfter: 2, gapBefore: 0, width: 220, x: 196 };
    case "transition":
      return { align: "right", gapAfter: 10, gapBefore: 12, width: 300, x: 540 };
    case "general-text-centered":
      return { align: "center", gapAfter: 10, gapBefore: 10, width: page.width, x: 306 };
    default:
      return { gapAfter: 10, gapBefore: 4, width: page.width, x: page.left };
  }
}

function formatPdfText(text: string, type: FountainBlockType) {
  if (type === "scene-heading" || type === "character" || type === "transition" || type === "shot") {
    return text.toUpperCase();
  }

  return text;
}
