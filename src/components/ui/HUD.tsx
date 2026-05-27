import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'

interface Props {
  onRun: () => void
  onStop: () => void
  isRunning: boolean
}

export function HUD({ onRun, onStop, isRunning }: Props) {
  const { phase, placedPieces, isARMode, resetTrack } = useGameStore(
    useShallow((s) => ({
      phase: s.phase,
      placedPieces: s.placedPieces,
      isARMode: s.isARMode,
      resetTrack: s.resetTrack,
    }))
  )

  const pieceCount = Math.max(0, placedPieces.length - 1) // exclude entrance

  return (
    <div className="hud">
      <div className="hud-left">
        <span className={`hud-badge ${isARMode ? 'active' : ''}`}>
          {isARMode ? '📷 AR' : '🖥 3D'}
        </span>
        {phase === 'building' && (
          <span className="hud-badge">
            🧩 {pieceCount}
          </span>
        )}
      </div>

      <div className="hud-right">
        {phase === 'building' && pieceCount >= 3 && !isRunning && (
          <button className="btn-run" onPointerDown={onRun}>
            ▶ Run
          </button>
        )}
        {isRunning && (
          <button
            className="btn-run"
            style={{ background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)', boxShadow: '0 0 20px rgba(255,68,68,0.3)' }}
            onPointerDown={onStop}
          >
            ■ Stop
          </button>
        )}
        {phase === 'building' && (
          <button className="hud-btn danger" onPointerDown={resetTrack} title="Reset park">
            ↺
          </button>
        )}
      </div>
    </div>
  )
}
