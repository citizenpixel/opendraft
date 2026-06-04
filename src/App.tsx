import { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import WritingCanvas from "./components/WritingCanvas";
import { sampleScript } from "./sampleScript";

const draftStorageKey = "opendraft-draft";

function App() {
  const [script, setScript] = useState(() => localStorage.getItem(draftStorageKey) ?? sampleScript);

  useEffect(() => {
    localStorage.setItem(draftStorageKey, script);
  }, [script]);

  return (
    <AppLayout>
      <WritingCanvas value={script} onChange={setScript} />
    </AppLayout>
  );
}

export default App;
