import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { parseFountain, type FountainBlock, type FountainBlockType } from "../utils/fountain";

type WritingCanvasProps = {
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

const elementLabels: Record<FountainBlockType, string> = {
  "scene-heading": "Scene Heading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
};

function WritingCanvas({ value, onChange }: WritingCanvasProps) {
  const canvasRef = useRef<HTMLElement | null>(null);
  const latestSourceRef = useRef(value);
  const [currentType, setCurrentType] = useState<FountainBlockType>("action");

  useEffect(() => {
    if (!canvasRef.current || latestSourceRef.current === value) {
      return;
    }

    renderSource(canvasRef.current, value);
    latestSourceRef.current = value;
    updateCurrentType();
  }, [value]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    renderSource(canvasRef.current, value);
    latestSourceRef.current = value;
    updateCurrentType();

    document.addEventListener("selectionchange", updateCurrentType);

    return () => {
      document.removeEventListener("selectionchange", updateCurrentType);
    };
  }, []);

  function syncSource() {
    if (!canvasRef.current) {
      return;
    }

    ensureCanvasHasBlock(canvasRef.current);
    normalizeBlockTypes(canvasRef.current);

    const nextSource = serializeCanvas(canvasRef.current);
    latestSourceRef.current = nextSource;
    onChange(nextSource);
    updateCurrentType();
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
      insertNewLine();
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

    const currentIndex = elementTypes.indexOf(getBlockType(block));
    const nextIndex = (currentIndex + direction + elementTypes.length) % elementTypes.length;
    setBlockType(block, elementTypes[nextIndex]);
    setCurrentType(elementTypes[nextIndex]);
  }

  function insertNewLine() {
    const block = getCurrentBlock();

    if (!block || !canvasRef.current) {
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
      setCurrentType("action");
      syncSource();
      return;
    }

    const nextType = getNextBlockType(currentType);
    const nextBlock = createBlock({ type: nextType, text: afterText });

    block.textContent = beforeText;
    block.after(nextBlock);
    placeCaretAtStart(nextBlock);
    setCurrentType(nextType);
    syncSource();
  }

  function updateCurrentType() {
    const block = getCurrentBlock();

    if (block) {
      setCurrentType(getBlockType(block));
    }
  }

  function getCurrentBlock() {
    const selection = window.getSelection();
    const node = selection?.anchorNode;

    if (!node || !canvasRef.current?.contains(node)) {
      return null;
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    return element?.closest<HTMLElement>("[data-block-type]") ?? null;
  }

  return (
    <div className="writing-panel">
      <div className="canvas-toolbar">
        <div>
          <h2>Writing Canvas</h2>
          <p>Fountain source saved locally</p>
        </div>
        <span className="element-status">Current Element: {elementLabels[currentType]}</span>
      </div>

      <article
        className="screenplay writing-canvas"
        aria-label="Screenplay writing canvas"
        contentEditable
        onFocus={updateCurrentType}
        onInput={syncSource}
        onKeyDown={handleKeyDown}
        onKeyUp={updateCurrentType}
        onMouseUp={updateCurrentType}
        onPaste={handlePaste}
        ref={canvasRef}
        spellCheck="true"
        suppressContentEditableWarning
      />
    </div>
  );
}

function renderSource(canvas: HTMLElement, source: string) {
  const blocks = parseFountain(source);
  const visibleBlocks = blocks.length > 0 ? blocks : [{ type: "action", text: "" } satisfies FountainBlock];

  canvas.replaceChildren(...visibleBlocks.map(createBlock));
}

function createBlock(block: FountainBlock) {
  const paragraph = document.createElement("p");
  paragraph.textContent = block.text;
  setBlockType(paragraph, block.type);
  return paragraph;
}

function setBlockType(block: HTMLElement, type: FountainBlockType) {
  block.dataset.blockType = type;
  block.className = `screenplay-block ${type}`;
}

function getBlockType(block: HTMLElement): FountainBlockType {
  return (block.dataset.blockType as FountainBlockType | undefined) ?? "action";
}

function ensureCanvasHasBlock(canvas: HTMLElement) {
  if (getCanvasBlocks(canvas).length === 0) {
    const block = createBlock({ type: "action", text: "" });
    canvas.append(block);
    placeCaretAtStart(block);
  }
}

function normalizeBlockTypes(canvas: HTMLElement) {
  for (const block of getCanvasBlocks(canvas)) {
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

function serializeCanvas(canvas: HTMLElement) {
  const blocks = getCanvasBlocks(canvas)
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

function getCanvasBlocks(canvas: HTMLElement) {
  return Array.from(canvas.querySelectorAll<HTMLElement>("[data-block-type]"));
}

function getNextBlockType(type: FountainBlockType): FountainBlockType {
  if (type === "character" || type === "parenthetical") {
    return "dialogue";
  }

  return "action";
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

export default WritingCanvas;
