import { useEffect, useMemo, useState } from "react";
import { parseFountain } from "./fountain";
import { sampleScript } from "./sampleScript";

const draftStorageKey = "opendraft-draft";

function App() {
  const [script, setScript] = useState(() => localStorage.getItem(draftStorageKey) ?? sampleScript);
  const preview = useMemo(() => parseFountain(script), [script]);

  useEffect(() => {
    localStorage.setItem(draftStorageKey, script);
  }, [script]);

  return (
    <main className="app-shell">
      <header className="topbar" aria-label="OpenDraft project values">
        <div>
          <p className="eyebrow">OpenDraft</p>
          <h1>Local-first Fountain screenwriting.</h1>
        </div>
        <ul className="values" aria-label="Project values">
          <li>Free</li>
          <li>Open-source</li>
          <li>No accounts</li>
          <li>No tracking</li>
        </ul>
      </header>

      <section className="workspace" aria-label="Screenplay editor and preview">
        <div className="pane editor-pane">
          <div className="pane-header">
            <h2>Editor</h2>
            <span>Fountain</span>
          </div>
          <textarea
            aria-label="Fountain screenplay editor"
            spellCheck="true"
            value={script}
            onChange={(event) => setScript(event.target.value)}
          />
        </div>

        <div className="pane preview-pane">
          <div className="pane-header">
            <h2>Preview</h2>
            <span>{preview.length} blocks</span>
          </div>
          <article className="screenplay" aria-label="Formatted screenplay preview">
            {preview.map((block, index) => (
              <p className={`screenplay-block ${block.type}`} key={`${block.text}-${index}`}>
                {block.text}
              </p>
            ))}
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;
