import OutputCard from './OutputCard';

export default function OutputsPanel({
  outputs,
  sessionId,
  onOpenArtifact,
  selectedPath,
  loadingPaths = [],
}) {
  if (!outputs || outputs.length === 0) {
    return null;
  }

  return (
    <div className="outputs-panel">
      <div className="outputs-panel__card">
        <div className="outputs-panel__list">
          {outputs.map((o) => (
            <OutputCard
              key={o.path}
              path={o.path}
              title={o.title}
              sessionId={sessionId}
              isSelected={selectedPath === o.path}
              isLoading={loadingPaths.includes(o.path)}
              onOpen={onOpenArtifact}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
