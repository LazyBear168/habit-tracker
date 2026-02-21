// File: src/components/ProgressBar.jsx
// Description: Simple progress bar with optional percent label.

export default function ProgressBar({
  percent = 0,
  height = 8,
  trackColor = '#dfeee0',
  fillColor = '#4caf50',
  showLabel = false,
  labelColor = '#666'
}) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div>
      <div
        style={{
          height,
          background: trackColor,
          borderRadius: 999,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${safe}%`,
            height: '100%',
            background: fillColor,
            transition: 'width 0.25s'
          }}
        />
      </div>

      {showLabel && (
        <div style={{ marginTop: '2px', fontSize: '11px', color: labelColor, textAlign: 'right' }}>
          {safe}%
        </div>
      )}
    </div>
  );
}
