import type { ClipboardEvent, FormEvent } from "react";
import type { FountainBlock } from "../utils/fountain";

type LiveFormatEditorProps = {
  blocks: FountainBlock[];
  onChange: (value: string) => void;
};

function LiveFormatEditor({ blocks, onChange }: LiveFormatEditorProps) {
  function updateBlock(index: number, text: string) {
    const nextBlocks = blocks.map((block, blockIndex) =>
      blockIndex === index ? { ...block, text: text.trim() } : block,
    );

    onChange(nextBlocks.map((block) => block.text).join("\n\n"));
  }

  function handlePaste(event: ClipboardEvent<HTMLElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  return (
    <div className="pane live-format-pane">
      <div className="pane-header">
        <h2>Live Format</h2>
        <span>Experimental</span>
      </div>
      <div className="experimental-note">
        Edits are saved as Fountain text. This mode is an early prototype for inline screenplay writing.
      </div>
      <article className="screenplay live-screenplay" aria-label="Experimental live formatted editor">
        {blocks.map((block, index) => (
          <p
            className={`screenplay-block editable-block ${block.type}`}
            contentEditable
            key={`${block.type}-${index}`}
            onInput={(event: FormEvent<HTMLParagraphElement>) =>
              updateBlock(index, event.currentTarget.textContent ?? "")
            }
            onPaste={handlePaste}
            suppressContentEditableWarning
          >
            {block.text}
          </p>
        ))}
      </article>
    </div>
  );
}

export default LiveFormatEditor;
