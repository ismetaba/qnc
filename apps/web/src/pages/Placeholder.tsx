export function Placeholder({ title }: { title: string }): JSX.Element {
  return (
    <div className="page">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p className="muted">Coming up in a later task.</p>
      </div>
    </div>
  );
}
