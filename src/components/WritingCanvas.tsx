import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { parseFountain, type FountainBlock, type FountainBlockType } from "../utils/fountain";

type WritingCanvasProps = {
  value: string;
  onChange: (value: string) => void;
  saveStatus: SaveStatus;
};

export type SaveStatus = "Saving..." | "Saved" | "Restored Draft";

export type WritingCanvasHandle = {
  getSource: () => string;
};

const elementTypes: FountainBlockType[] = [
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "scene-heading",
  "shot",
  "general-text",
  "general-text-centered",
];

const pickerTypes: FountainBlockType[] = [
  "scene-heading",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
  "general-text",
  "general-text-centered",
];

const elementLabels: Record<FountainBlockType, string> = {
  "scene-heading": "Scene Heading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
  shot: "Shot",
  "general-text": "General Text",
  "general-text-centered": "General Text (Centered)",
};

type PickerPosition = {
  left: number;
  top: number;
};

const WritingCanvas = forwardRef<WritingCanvasHandle, WritingCanvasProps>(function WritingCanvas(
  { value, onChange, saveStatus },
  ref,
) {
  const canvasRef = useRef<HTMLElement | null>(null);
  const latestSourceRef = useRef(value);
  const currentBlockRef = useRef<HTMLElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const pickerBlockRef = useRef<HTMLElement | null>(null);
  const pendingPickerBlockRef = useRef<HTMLElement | null>(null);
  const pickerOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [currentType, setCurrentType] = useState<FountainBlockType>(() => {
    return parseFountain(value)[0]?.type ?? "scene-heading";
  });
  const [pickerIndex, setPickerIndex] = useState(0);
  const [pickerPosition, setPickerPosition] = useState<PickerPosition | null>(null);

  useImperativeHandle(ref, () => ({
    getSource() {
      if (!canvasRef.current) {
        return latestSourceRef.current;
      }

      return serializeCanvas(canvasRef.current);
    },
  }));

  useEffect(() => {
    if (!pickerPosition) {
      return;
    }

    pickerOptionRefs.current[pickerIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [pickerIndex, pickerPosition]);

  useEffect(() => {
    if (!pickerPosition) {
      return;
    }

    function handlePickerKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setPickerIndex((index) => (index + direction + pickerTypes.length) % pickerTypes.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        selectPickerType(pickerTypes[pickerIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closePicker();
      }
    }

    document.addEventListener("keydown", handlePickerKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handlePickerKeyDown, true);
    };
  }, [pickerIndex, pickerPosition]);

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
    const currentBlock = getCurrentBlock();

    if (currentBlock?.textContent?.trim()) {
      pendingPickerBlockRef.current = null;
    }

    latestSourceRef.current = nextSource;
    onChange(nextSource);
    updateCurrentType();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (pickerPosition) {
      return;
    }

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
    const block = getCurrentBlock() ?? currentBlockRef.current;

    if (!block) {
      return;
    }

    const currentIndex = elementTypes.indexOf(getBlockType(block));
    const nextIndex = (currentIndex + direction + elementTypes.length) % elementTypes.length;
    setBlockType(block, elementTypes[nextIndex]);
    setCurrentType(elementTypes[nextIndex]);
    pendingPickerBlockRef.current = null;
  }

  function handleElementChange(event: ChangeEvent<HTMLSelectElement>) {
    const block = currentBlockRef.current;
    const nextType = event.target.value as FountainBlockType;

    if (!block) {
      return;
    }

    setBlockType(block, nextType);
    setCurrentType(nextType);
    syncSource();
    restoreSelection();
  }

  function rememberSelection() {
    const selection = window.getSelection();
    const block = getCurrentBlock();

    if (block) {
      currentBlockRef.current = block;
    }

    if (selection?.rangeCount && canvasRef.current?.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const range = savedRangeRef.current;

    if (!range) {
      return;
    }

    requestAnimationFrame(() => {
      const selection = window.getSelection();
      canvasRef.current?.focus();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
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

    // The first Enter creates and remembers a blank line. Pressing Enter again
    // on that exact blank line opens the picker instead of creating another.
    if (!currentText && pendingPickerBlockRef.current === block) {
      openPicker(block);
      return;
    }

    const nextType = getNextBlockType(currentType);
    const nextBlock = createBlock({ type: nextType, text: afterText });

    block.textContent = beforeText;
    block.after(nextBlock);
    placeCaretAtStart(nextBlock);
    pendingPickerBlockRef.current = afterText ? null : nextBlock;
    setCurrentType(nextType);
    syncSource();
  }

  function openPicker(block: HTMLElement) {
    rememberSelection();
    pickerBlockRef.current = block;
    setPickerIndex(Math.max(0, pickerTypes.indexOf(getBlockType(block))));
    setPickerPosition(getPickerPosition(block, savedRangeRef.current));
  }

  function closePicker() {
    setPickerPosition(null);
    pickerBlockRef.current = null;
    pendingPickerBlockRef.current = null;
    restoreSelection();
  }

  function selectPickerType(type: FountainBlockType) {
    const block = pickerBlockRef.current;

    if (!block) {
      closePicker();
      return;
    }

    setBlockType(block, type);
    setCurrentType(type);
    syncSource();
    closePicker();
  }

  function updateCurrentType() {
    const block = getCurrentBlock();

    if (block) {
      currentBlockRef.current = block;
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
        <div className="canvas-statuses">
          <span className="save-status" aria-live="polite">
            {saveStatus}
          </span>
          <label className="element-status">
            <span>Current Element:</span>
            <select
              aria-label="Current screenplay element"
              onChange={handleElementChange}
              onPointerDown={rememberSelection}
              value={currentType}
            >
              {elementTypes.map((type) => (
                <option key={type} value={type}>
                  {elementLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
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

      {pickerPosition && (
        <div
          className="element-picker"
          role="listbox"
          aria-label="Choose screenplay element"
          style={{ left: pickerPosition.left, top: pickerPosition.top }}
        >
          {pickerTypes.map((type, index) => (
            <button
              aria-selected={index === pickerIndex}
              className={index === pickerIndex ? "active" : ""}
              key={type}
              onPointerDown={(event) => {
                event.preventDefault();
                selectPickerType(type);
              }}
              ref={(option) => {
                pickerOptionRefs.current[index] = option;
              }}
              role="option"
              type="button"
            >
              {elementLabels[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

function renderSource(canvas: HTMLElement, source: string) {
  const blocks = parseFountain(source);
  // A truly blank screenplay starts with a Scene Heading. Action remains the
  // safe default for subsequent lines and normal writing flow.
  const visibleBlocks =
    blocks.length > 0 ? blocks : [{ type: "scene-heading", text: "" } satisfies FountainBlock];

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
    const block = createBlock({ type: "scene-heading", text: "" });
    canvas.append(block);
    placeCaretAtStart(block);
  }
}

function normalizeBlockTypes(canvas: HTMLElement) {
  for (const block of getCanvasBlocks(canvas)) {
    const text = block.textContent?.trim() ?? "";
    const type = getBlockType(block);

    // Only unmistakable Fountain syntax changes a type while the writer is typing.
    // Action remains the safe default; uppercase text never implies Character.
    if (/^(INT\.|EXT\.)\s+/i.test(text)) {
      setBlockType(block, "scene-heading");
    } else if (/\bTO:$/i.test(text)) {
      setBlockType(block, "transition");
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

  if (type === "character") {
    return `@${text.toUpperCase()}`;
  }

  if (type === "action" && needsForcedAction(text)) {
    return `!${text}`;
  }

  if (type === "shot") {
    return `[[OpenDraft: Shot]] ${text}`;
  }

  if (type === "general-text") {
    return `[[OpenDraft: General Text]] ${text}`;
  }

  if (type === "general-text-centered") {
    return `>${text}<`;
  }

  if (type === "scene-heading" || type === "transition") {
    return text.toUpperCase();
  }

  return text;
}

function getCanvasBlocks(canvas: HTMLElement) {
  return Array.from(canvas.querySelectorAll<HTMLElement>("[data-block-type]"));
}

function getNextBlockType(type: FountainBlockType): FountainBlockType {
  // Enter follows a small, predictable screenplay flow. Tab remains the
  // explicit way to choose a different element without typing heuristics.
  if (type === "character" || type === "parenthetical") {
    return "dialogue";
  }

  return "action";
}

function needsForcedAction(text: string) {
  return (
    (/^[A-Z]/.test(text) && text === text.toUpperCase()) ||
    /^(INT\.|EXT\.)\s+/i.test(text) ||
    /\bTO:$/i.test(text) ||
    text.startsWith("@") ||
    text.startsWith("!")
  );
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

function getPickerPosition(block: HTMLElement, savedRange: Range | null): PickerPosition {
  const menuWidth = Math.min(280, window.innerWidth - 24);
  const menuHeight = Math.min(340, window.innerHeight - 24);
  const caretRect = getCaretRect(savedRange);
  const blockRect = block.getBoundingClientRect();
  const anchorRect = caretRect ?? blockRect;

  return {
    left: clamp(anchorRect.left, 12, window.innerWidth - menuWidth - 12),
    top: clamp(anchorRect.bottom + 6, 12, window.innerHeight - menuHeight - 12),
  };
}

function getCaretRect(savedRange: Range | null) {
  if (!savedRange) {
    return null;
  }

  const rangeRect = savedRange.getClientRects()[0];

  if (rangeRect && (rangeRect.width > 0 || rangeRect.height > 0)) {
    return rangeRect;
  }

  // Empty contenteditable lines often report a zero-size range. A temporary
  // marker gives us the real visual caret position without moving selection.
  const marker = document.createElement("span");
  marker.className = "caret-position-marker";
  const markerRange = savedRange.cloneRange();
  markerRange.insertNode(marker);
  const markerRect = marker.getBoundingClientRect();
  marker.remove();

  return markerRect;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export default WritingCanvas;
