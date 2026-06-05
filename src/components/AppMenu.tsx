import { useEffect, useRef, useState } from "react";

type AppMenuProps = {
  onExportFountain: () => Promise<void>;
  onExportPdf: () => Promise<void>;
};

function AppMenu({ onExportFountain, onExportPdf }: AppMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"main" | "export">("main");

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
        if (view === "export") {
          setView("main");
        } else {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, view]);

  async function runExport(exportAction: () => Promise<void>) {
    setIsOpen(false);
    setView("main");

    try {
      await exportAction();
    } catch {
      window.alert("OpenDraft could not export this file. Please try again.");
    }
  }

  return (
    <div className="app-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Open application menu"
        className="app-menu-trigger"
        onClick={() => {
          setIsOpen((open) => !open);
          setView("main");
        }}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen && (
        <div className="app-menu-panel">
          {view === "main" ? (
            <>
              <button onClick={() => setView("export")} role="menuitem" type="button">
                <strong>Export</strong>
                <span>Choose a file format</span>
                <span className="menu-arrow" aria-hidden="true">
                  &gt;
                </span>
              </button>
            </>
          ) : (
            <>
              <button className="menu-back" onClick={() => setView("main")} type="button">
                &lt; Back
              </button>
              <div className="app-menu-heading">
                <strong>Export</strong>
                <span>Choose a format and save location</span>
              </div>
              <button onClick={() => runExport(onExportFountain)} role="menuitem" type="button">
                <strong>Fountain</strong>
                <span>Portable screenplay source</span>
              </button>
              <button onClick={() => runExport(onExportPdf)} role="menuitem" type="button">
                <strong>PDF</strong>
                <span>Formatted screenplay document</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AppMenu;
