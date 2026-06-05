import { useEffect, useRef, useState } from "react";

type AppMenuProps = {
  onExportFountain: () => void;
  onExportPdf: () => void;
};

function AppMenu({ onExportFountain, onExportPdf }: AppMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function runExport(exportAction: () => void) {
    setIsOpen(false);
    exportAction();
  }

  return (
    <div className="app-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Open application menu"
        className="menu-trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen && (
        <div className="menu-panel">
          <div className="menu-heading">
            <span>Export</span>
            <small>Download your screenplay</small>
          </div>
          <button onClick={() => runExport(onExportFountain)} type="button">
            <strong>Fountain</strong>
            <span>Portable screenplay source file</span>
          </button>
          <button onClick={() => runExport(onExportPdf)} type="button">
            <strong>PDF</strong>
            <span>Print or save a formatted screenplay</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AppMenu;
