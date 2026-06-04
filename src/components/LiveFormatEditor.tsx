import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { parseFountain, type FountainBlock, type FountainBlockType } from "../utils/fountain";

type LiveFormatEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const elementTypes: FountainBlockType[] = [
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "scene-heading",
];

function LiveFormatEditor({ value, onChange }: LiveFormatEditorProps) {
  const editorRef = useRef<HTMLElement | null>(null);
  const latestSourceRef = useRef(value);

  useEffect(() => {
    if (!editorRef.current || latestSourceRef.current === value) {
      return;
    }

    renderSource(editorRef.current, value);
    latestSourceRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    renderSource(editorRef.current, value);
    latestSourceRef.current = value;
  }, []);

  function syncSource() {
    if (!editorRef.current) {
      return;
    }

    normalizeBlockTypes(editorRef.current);
    const nextSource = serializeEditor(editorRef.current);
    latestSourceRef.current = nextSource;
    onChange(nextSource);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      cycleCurrentBlock(event.shiftKey ? -1 : 1);
      syncSource();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleEnter();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLElement>) {
    event.preventDefault();
    insertPlainText(event.clipboardData.getData("text/plain"));
    syncSource();
  }

  function cycleCurrentBlock(direction: 1 | -1) {
    const block = getCurrentBlock();

    if (!block) {
      return;
    }

    const currentType = getBlockType(block);
    const currentIndex = elementTypes.indexOf(currentType);
    const nextIndex = (currentIndex + direction + elementTypes.length) % elementTypes.length;
    setBlockType(block, elementTypes[nextIndex]);
  }

  function handleEnter() {
    const block = getCurrentBlock();

    if (!block || !editorRef.current) {
      return;
    }

    const currentType = getBlockType(block);
    const currentText = block.textContent?.trim() ?? "";
    const caretOffset = getCaretOffset(block);
    const fullText = block.textContent ?? "";
    const beforeText = fullText.slice(0, caretOffset).trim();
    const afterText = fullText.slice(caretOffset).trim();

    if (currentType === "dialogue" && !currentText) {
      setBlockType(block, "action");
      syncSource();
      return;
    }

    const nextType = getNextBlockType(currentType);
    const nextBlock = createBlock({ type: nextType, text: afterText });

    block.textContent = beforeText;
    block.after(nextBlock);
    placeCaretAtStart(nextBlock);
    syncSource();
  }

  function getCurrentBlock() {
    const selection = window.getSelection();
    const node = selection?.anchorNode;

    if (!node || !editorRef.current?.contains(node)) {
      return null;
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    return element?.closest<HTMLElement>("[data-block-type]") ?? null;
  }

  return (
    <div className="pane live-format-pane">
      <div className="pane-header">
        <h2>Live Format</h2>
        <span>Experimental</span>
      </div>
      <div className="experimental-note">
        One editable screenplay surface. Fountain stays underneath; Tab changes element type.
      </div>
      <article
        className="screenplay live-screenplay"
        aria-label="Experimental live formatted editor"
        contentEditable
        onInput={syncSource}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        ref={editorRef}
        spellCheck="true"
        suppressContentEditableWarning
      />
    </div>
  );
}

function renderSource(editor: HTMLElement, source: string) {
  const blocks = parseFountain(source);
  const visibleBlocks = blocks.length > 0 ? blocks : [{ type: "action", text: "" } satisfies FountainBlock];

  editor.replaceChildren(...visibleBlocks.map(createBlock));
}

function createBlock(block: FountainBlock) {
  const paragraph = document.createElement("p");
  paragraph.textContent = block.text;
  setBlockType(paragraph, block.type);
  return paragraph;
}

function setBlockType(block: HTMLElement, type: FountainBlockType) {
  block.dataset.blockType = type;
  block.className = `screenplay-block editable-block ${type}`;
}

function getBlockType(block: HTMLElement): FountainBlockType {
  return (block.dataset.blockType as FountainBlockType | undefined) ?? "action";
}

function normalizeBlockTypes(editor: HTMLElement) {
  const blocks = getEditorBlocks(editor);

  for (const block of blocks) {
    const text = block.textContent?.trim() ?? "";
    const type = getBlockType(block);

    if (/^(INT\.|EXT\.)\s+/i.test(text)) {
      setBlockType(block, "scene-heading");
    } else if (/^[A-Z][A-Z0-9 .'-]* TO:$/.test(text)) {
      setBlockType(block, "transition");
    } else if (type === "action" && /[A-Z]/.test(text) && text === text.toUpperCase()) {
      setBlockType(block, "character");
    } else if (type === "dialogue" && text.startsWith("(")) {
      setBlockType(block, "parenthetical");
    }
  }
}

function serializeEditor(editor: HTMLElement) {
  const blocks = getEditorBlocks(editor)
    .map((block) => ({
      text: formatBlockText(block),
      type: getBlockType(block),
    }))
    .filter((block, index, lines) => block.text || index === lines.length - 1);

  return blocks.reduce((source, block, index) => {
    if (index === 0) {
      return block.text;
    }

    const previous = blocks[index - 1];
    const separator = shouldKeepDialogueTogether(previous.type, block.type) ? "\n" : "\n\n";
    return `${source}${separator}${block.text}`;
  }, "");
}

function formatBlockText(block: HTMLElement) {
  const text = block.textContent?.trim() ?? "";
  const type = getBlockType(block);

  if (type === "scene-heading" || type === "character" || type === "transition") {
    return text.toUpperCase();
  }

  return text;
}

function getEditorBlocks(editor: HTMLElement) {
  return Array.from(editor.querySelectorAll<HTMLElement>("[data-block-type]"));
}

function getNextBlockType(type: FountainBlockType): FountainBlockType {
  if (type === "scene-heading" || type === "action" || type === "transition") {
    return "action";
  }

  if (type === "character" || type === "parenthetical") {
    return "dialogue";
  }

  return "dialogue";
}

function shouldKeepDialogueTogether(previousType: FountainBlockType, nextType: FountainBlockType) {
  const dialogueFlow: FountainBlockType[] = ["character", "dialogue", "parenthetical"];
  return dialogueFlow.includes(previousType) && dialogueFlow.includes(nextType);
}

function placeCaretAtStart(element: HTMLElement) {
  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNodeContents(element);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function getCaretOffset(element: HTMLElement) {
  const selection = window.getSelection();

  if (!selection?.rangeCount) {
    return element.textContent?.length ?? 0;
  }

  const range = selection.getRangeAt(0);
  const measureRange = range.cloneRange();
  measureRange.selectNodeContents(element);
  measureRange.setEnd(range.endContainer, range.endOffset);

  return measureRange.toString().length;
}

function insertPlainText(text: string) {
  const selection = window.getSelection();

  if (!selection?.rangeCount) {
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

export default LiveFormatEditor;
