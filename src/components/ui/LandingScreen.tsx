import { useGameStore } from '../../store/gameStore'

export function LandingScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const setARMode = useGameStore((s) => s.setARMode)

  const startDesktop = () => {
    setARMode(false)
    setPhase('place-entrance')
  }

  const startAR = () => {
    setARMode(true)
    setPhase('place-entrance')
  }

  const isWebXRAvailable =
    typeof navigator !== 'undefined' && 'xr' in navigator

  return (
    <div className="landing">
      <div className="landing-glow" />
      <div className="landing-icon">🎢</div>

      <h1 className="landing-title">AR Park Builder</h1>
      <p className="landing-sub">
        Build a miniature theme park in your home.&nbsp;
        Scan real surfaces — your floor, table, sofa — and lay track anywhere.
      </p>

      {isWebXRAvailable ? (
        <button className="btn-primary" onPointerDown={startAR}>
          <span>📷</span>
          Start in AR
        </button>
      ) : (
        <button className="btn-primary" onPointerDown={startDesktop}>
          <span>🖥</span>
          Start Demo
        </button>
      )}

      {isWebXRAvailable && (
        <button
          style={{
            marginTop: 12,
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            padding: '12px 28px',
            borderRadius: 100,
            fontSize: 14,
            cursor: 'pointer',
          }}
          onPointerDown={startDesktop}
        >
          Desktop Preview
        </button>
      )}

      <p className="landing-note">
        AR requires Android Chrome · HTTPS
      </p>
    </div>
  )
}
