import { useEffect, useMemo, useState } from "react";
import AppLayout from "./components/AppLayout";
import Editor from "./components/Editor";
import Preview from "./components/Preview";
import { sampleScript } from "./sampleScript";
import { parseFountain } from "./utils/fountain";

const draftStorageKey = "opendraft-draft";

function App() {
  const [script, setScript] = useState(() => localStorage.getItem(draftStorageKey) ?? sampleScript);
  const preview = useMemo(() => parseFountain(script), [script]);

  useEffect(() => {
    localStorage.setItem(draftStorageKey, script);
  }, [script]);

  return (
    <AppLayout>
      <Editor value={script} onChange={setScript} />
      <Preview blocks={preview} />
    </AppLayout>
  );
}

export default App;
