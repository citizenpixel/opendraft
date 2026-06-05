const fallbackFilename = "untitled.fountain";

export function downloadFountain(source: string) {
  const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = getFountainFilename(source);
  link.click();
  URL.revokeObjectURL(downloadUrl);
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
