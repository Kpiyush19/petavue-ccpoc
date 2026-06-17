/*
 * Workbook History panel — shown in the open sidebar below nav items
 *
 * Props:
 *   groups — [{ label: "Today", items: [{ id, title, time }] }]
 *   onItemClick — callback(id)
 */

export function HistoryPanel({ groups = [], onItemClick }) {
  return (
    <div className="history-panel">
      <div className="history-panel__header">
        <span className="history-panel__title">Chat History</span>
      </div>

      <div className="history-panel__list">
        {groups.map((group) => (
          <div key={group.label} className="history-panel__group">
            <div className="history-panel__group-label">{group.label}</div>

            {group.items.map((item) =>
              item.clickable ? (
                <button
                  key={item.id}
                  className="history-panel__entry"
                  onClick={() => onItemClick && onItemClick(item.id)}
                >
                  <span className="history-panel__entry-title">{item.title}</span>
                  <span className="history-panel__entry-time">{item.time}</span>
                </button>
              ) : (
                <div
                  key={item.id}
                  className="history-panel__entry history-panel__entry--static"
                  aria-disabled="true"
                >
                  <span className="history-panel__entry-title">{item.title}</span>
                  <span className="history-panel__entry-time">{item.time}</span>
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* Fade-out gradient at the bottom of scrollable area */}
      <div className="history-panel__fade" />
    </div>
  );
}
