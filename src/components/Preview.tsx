import type { FountainBlock } from "../utils/fountain";

type PreviewProps = {
  blocks: FountainBlock[];
};

function Preview({ blocks }: PreviewProps) {
  return (
    <div className="pane preview-pane">
      <div className="pane-header">
        <h2>Preview</h2>
        <span>{blocks.length} blocks</span>
      </div>
      <article className="screenplay" aria-label="Formatted screenplay preview">
        {blocks.map((block, index) => (
          <p className={`screenplay-block ${block.type}`} key={`${block.text}-${index}`}>
            {block.text}
          </p>
        ))}
      </article>
    </div>
  );
}

export default Preview;
