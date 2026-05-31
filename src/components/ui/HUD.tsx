import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'

interface Props {
  onRun: () => void
  onStop: () => void
  isRunning: boolean
}

export function HUD({ onRun, onStop, isRunning }: Props) {
  const { phase, placedPieces, isARMode, buildMode, hasRideEntrance, resetTrack } =
    useGameStore(
      useShallow((s) => ({
        phase: s.phase,
        placedPieces: s.placedPieces,
        isARMode: s.isARMode,
        buildMode: s.buildMode,
        hasRideEntrance: s.hasRideEntrance,
        resetTrack: s.resetTrack,
      }))
    )

  const pathCount = placedPieces.filter((p) =>
    ['path-straight', 'path-curve-left', 'path-curve-right'].includes(p.type)
  ).length

  const rideCount = placedPieces.filter((p) =>
    ['straight', 'curve-left', 'curve-right', 'incline', 'decline', 'station'].includes(p.type)
  ).length

  const canRun = hasRideEntrance && rideCount >= 2

  return (
    <div className="hud">
      <div className="hud-left">
        <span className={`hud-badge ${isARMode ? 'active' : ''}`}>
          {isARMode ? '📷 AR' : '🖥 3D'}
        </span>
        {phase === 'building' && buildMode === 'path' && (
          <span className="hud-badge">🚶 {pathCount}</span>
        )}
        {phase === 'building' && buildMode === 'ride' && (
          <span className="hud-badge" style={{ borderColor: 'rgba(42,95,168,0.5)', color: '#4a7fc8' }}>
            🎢 {rideCount}
          </span>
        )}
      </div>

      <div className="hud-right">
        {phase === 'building' && canRun && !isRunning && (
          <button className="btn-run" onPointerDown={onRun}>
            ▶ Run
          </button>
        )}
        {isRunning && (
          <button
            className="btn-run"
            style={{
              background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
              boxShadow: '0 0 20px rgba(255,68,68,0.3)',
            }}
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
