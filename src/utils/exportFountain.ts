import { createFileSaveTarget } from "./saveFile";

const fallbackFilename = "untitled.fountain";

export async function downloadFountain(source: string) {
  const filename = getFountainFilename(source);
  const saveTarget = await createFileSaveTarget(filename, {
    description: "Fountain screenplay",
    extension: ".fountain",
    mimeType: "text/plain",
  });

  if (!saveTarget) {
    return;
  }

  const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
  await saveTarget.write(blob);
}

export function getFountainFilename(source: string) {
  const titleLine = source
    .split(/\r?\n/)
    .find((line) => line.trim().toLowerCase().startsWith("title:"));

  if (!titleLine) {
    return fallbackFilename;
  }

  const title = titleLine.replace(/^title:\s*/i, "").trim();
  const safeTitle = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  return safeTitle ? `${safeTitle}.fountain` : fallbackFilename;
}
