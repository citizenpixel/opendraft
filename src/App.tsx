import { useEffect, useMemo, useState } from "react";
import AppLayout from "./components/AppLayout";
import Editor from "./components/Editor";
import LiveFormatEditor from "./components/LiveFormatEditor";
import ModeToggle, { type WritingMode } from "./components/ModeToggle";
import Preview from "./components/Preview";
import { sampleScript } from "./sampleScript";
import { parseFountain } from "./utils/fountain";

const draftStorageKey = "opendraft-draft";

function App() {
  const [script, setScript] = useState(() => localStorage.getItem(draftStorageKey) ?? sampleScript);
  const [mode, setMode] = useState<WritingMode>("plain");
  const preview = useMemo(() => parseFountain(script), [script]);

  useEffect(() => {
    localStorage.setItem(draftStorageKey, script);
  }, [script]);

  return (
    <AppLayout>
      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "plain" && <Editor value={script} onChange={setScript} />}
      {mode === "preview" && <Preview blocks={preview} />}
      {mode === "live" && <LiveFormatEditor blocks={preview} onChange={setScript} />}
    </AppLayout>
  );
}

export default App;
