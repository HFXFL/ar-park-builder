import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { TRACK_TEMPLATES, PATH_TOOLBAR, RIDE_TOOLBAR } from '../../systems/trackTemplates'
import type { TrackPieceType } from '../../types/game'

interface Props {
  onPlace: () => void
}

export function Toolbar({ onPlace }: Props) {
  const {
    selectedTool,
    buildMode,
    hasRideEntrance,
    setSelectedTool,
    setBuildMode,
    placeNextPiece,
    undoLastPiece,
  } = useGameStore(
    useShallow((s) => ({
      selectedTool: s.selectedTool,
      buildMode: s.buildMode,
      hasRideEntrance: s.hasRideEntrance,
      setSelectedTool: s.setSelectedTool,
      setBuildMode: s.setBuildMode,
      placeNextPiece: s.placeNextPiece,
      undoLastPiece: s.undoLastPiece,
    }))
  )

  const tools = buildMode === 'path' ? PATH_TOOLBAR : RIDE_TOOLBAR

  const handleToolSelect = (type: TrackPieceType) => {
    if (selectedTool === type) {
      placeNextPiece(type)
      onPlace()
    } else {
      setSelectedTool(type)
    }
  }

  const handlePlace = () => {
    if (selectedTool) {
      placeNextPiece(selectedTool)
      onPlace()
    }
  }

  const switchToPath = () => {
    setBuildMode('path')
    setSelectedTool('path-straight')
  }

  const switchToRide = () => {
    if (!hasRideEntrance) return
    setBuildMode('ride')
    setSelectedTool('straight')
  }

  return (
    <div className="toolbar">
      {/* Mode toggle tabs */}
      <div className="toolbar-tabs">
        <button
          className={`toolbar-tab${buildMode === 'path' ? ' active' : ''}`}
          onPointerDown={switchToPath}
        >
          🚶 Path
        </button>
        <button
          className={`toolbar-tab${buildMode === 'ride' ? ' active' : ''}${!hasRideEntrance ? ' locked' : ''}`}
          onPointerDown={switchToRide}
        >
          🎢 Ride {!hasRideEntrance && <span className="tab-lock">🔒</span>}
        </button>
      </div>

      {/* Tool buttons */}
      <div className="toolbar-track">
        {tools.map((type) => {
          const t = TRACK_TEMPLATES[type]
          const isSelected = selectedTool === type
          const isRideGate = type === 'ride-entrance'
          return (
            <button
              key={type}
              className={`tool-btn${isSelected ? ' selected' : ''}${isRideGate ? ' ride-gate' : ''}`}
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

        <button className="toolbar-action-btn undo" onPointerDown={undoLastPiece}>
          <span className="toolbar-action-icon">↩</span>
          <span className="toolbar-action-label">Undo</span>
        </button>
      </div>
    </div>
  )
}
