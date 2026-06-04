export type WritingMode = "plain" | "preview" | "live";

type ModeToggleProps = {
  mode: WritingMode;
  onChange: (mode: WritingMode) => void;
};

const modes: Array<{ label: string; value: WritingMode }> = [
  { label: "Plain Text Mode", value: "plain" },
  { label: "Formatted Preview Mode", value: "preview" },
  { label: "Experimental Live Format Mode", value: "live" },
];

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" aria-label="Writing mode">
      {modes.map((option) => (
        <button
          className={option.value === mode ? "active" : ""}
          key={option.value}
          type="button"
          aria-pressed={option.value === mode}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ModeToggle;
