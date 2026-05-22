type EditorProps = {
  value: string;
  onChange: (value: string) => void;
};

function Editor({ value, onChange }: EditorProps) {
  return (
    <div className="pane editor-pane">
      <div className="pane-header">
        <h2>Editor</h2>
        <span>Fountain</span>
      </div>
      <textarea
        aria-label="Fountain screenplay editor"
        spellCheck="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default Editor;
