import { parseFountain } from "./fountain";
import { getFountainFilename } from "./exportFountain";

export function exportScreenplayPdf(source: string) {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    window.alert("Please allow pop-ups to export the screenplay as a PDF.");
    return;
  }

  printWindow.opener = null;
  const documentTitle = getFountainFilename(source).replace(/\.fountain$/i, "");
  const screenplay = parseFountain(source)
    .map((block) => `<p class="${block.type}">${escapeHtml(block.text)}</p>`)
    .join("");

  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${escapeHtml(documentTitle)}</title>
    <style>
      @page { size: letter; margin: 1in; }
      * { box-sizing: border-box; }
      body {
        margin: 0 auto;
        max-width: 6.5in;
        color: #000;
        font-family: "Courier New", Courier, monospace;
        font-size: 12pt;
        line-height: 1.25;
      }
      p {
        margin: 0 0 12pt;
        white-space: pre-wrap;
        orphans: 2;
        widows: 2;
      }
      .scene-heading, .shot {
        margin-top: 18pt;
        font-weight: bold;
        text-transform: uppercase;
        break-after: avoid;
      }
      .action, .general-text { width: 100%; }
      .character {
        width: 3.5in;
        margin: 12pt auto 0;
        text-align: center;
        text-transform: uppercase;
        break-after: avoid;
      }
      .dialogue {
        width: 3.5in;
        margin: 0 auto 12pt;
      }
      .parenthetical {
        width: 2.75in;
        margin: 0 auto;
        break-after: avoid;
      }
      .transition {
        margin-left: auto;
        text-align: right;
        text-transform: uppercase;
      }
      .general-text-centered {
        text-align: center;
      }
    </style>
  </head>
  <body>${screenplay}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 150);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}
