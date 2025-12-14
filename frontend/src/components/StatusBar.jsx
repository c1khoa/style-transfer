export default function StatusBar({ progress }) {
  if (!progress) return null;

  return (
    <div className="status-bar">
      <div className="status-icon">●</div>
      <div className="status-text">{progress}</div>
    </div>
  );
}