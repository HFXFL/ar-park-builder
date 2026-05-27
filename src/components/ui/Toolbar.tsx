import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { TRACK_TEMPLATES, TOOLBAR_ORDER } from '../../systems/trackTemplates'

interface Props {
  onPlace: () => void
}

export function Toolbar({ onPlace }: Props) {
  const { selectedTool, setSelectedTool, placeNextPiece, undoLastPiece } =
    useGameStore(
      useShallow((s) => ({
        selectedTool: s.selectedTool,
        setSelectedTool: s.setSelectedTool,
        placeNextPiece: s.placeNextPiece,
        undoLastPiece: s.undoLastPiece,
      }))
    )

  const handleToolSelect = (type: typeof TOOLBAR_ORDER[number]) => {
    if (selectedTool === type) {
      placeNextPiece(type)
      onPlace()
    } else {
      setSelectedTool(type)
    }
  }

  const handlePlace = () => {
    if (selectedTool && selectedTool !== 'entrance') {
      placeNextPiece(selectedTool)
      onPlace()
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-track">
        {TOOLBAR_ORDER.map((type) => {
          const t = TRACK_TEMPLATES[type]
          const isSelected = selectedTool === type
          return (
            <button
              key={type}
              className={`tool-btn${isSelected ? ' selected' : ''}`}
              onPointerDown={() => handleToolSelect(type)}
            >
              <span className="tool-btn-icon">{t.icon}</span>
              <span className="tool-btn-label">{t.label}</span>
            </button>
          )
        })}

        <div className="toolbar-divider" />

        <button
          className="toolbar-action-btn"
          style={{ background: selectedTool ? 'var(--accent-dim)' : undefined }}
          onPointerDown={handlePlace}
        >
          <span className="toolbar-action-icon">＋</span>
          <span className="toolbar-action-label">Place</span>
        </button>

        <button
          className="toolbar-action-btn undo"
          onPointerDown={undoLastPiece}
        >
          <span className="toolbar-action-icon">↩</span>
          <span className="toolbar-action-label">Undo</span>
        </button>
      </div>
    </div>
  )
}
