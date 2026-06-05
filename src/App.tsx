import { useEffect, useRef, useState } from "react";
import AppLayout from "./components/AppLayout";
import WritingCanvas, { type SaveStatus } from "./components/WritingCanvas";
import { sampleScript } from "./sampleScript";
import { downloadFountain } from "./utils/exportFountain";
import { exportScreenplayPdf } from "./utils/exportPdf";

const draftStorageKey = "opendraft-draft";
const saveDelay = 600;

function App() {
  const [restoredDraft] = useState(readStoredDraft);
  const [script, setScript] = useState(restoredDraft ?? sampleScript);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    restoredDraft === null ? "Saved" : "Restored Draft",
  );
  const latestScriptRef = useRef(script);

  useEffect(() => {
    if (saveStatus !== "Saving...") {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      saveDraft(latestScriptRef.current);
      setSaveStatus("Saved");
    }, saveDelay);

    return () => window.clearTimeout(saveTimer);
  }, [script, saveStatus]);

  useEffect(() => {
    function saveBeforeUnload() {
      saveDraft(latestScriptRef.current);
    }

    window.addEventListener("beforeunload", saveBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", saveBeforeUnload);
    };
  }, []);

  function handleScriptChange(nextScript: string) {
    latestScriptRef.current = nextScript;
    setScript(nextScript);
    setSaveStatus("Saving...");
  }

  return (
    <AppLayout
      onExportFountain={() => downloadFountain(latestScriptRef.current)}
      onExportPdf={() => exportScreenplayPdf(latestScriptRef.current)}
    >
      <WritingCanvas value={script} onChange={handleScriptChange} saveStatus={saveStatus} />
    </AppLayout>
  );
}

function readStoredDraft() {
  try {
    return localStorage.getItem(draftStorageKey);
  } catch {
    return null;
  }
}

function saveDraft(script: string) {
  try {
    localStorage.setItem(draftStorageKey, script);
  } catch {
    // The editor remains usable if browser storage is unavailable.
  }
}

export default App;
