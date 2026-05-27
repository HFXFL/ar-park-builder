import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from './store/gameStore'
import { LandingScreen } from './components/ui/LandingScreen'
import { EntranceOverlay } from './components/ui/EntranceOverlay'
import { Toolbar } from './components/ui/Toolbar'
import { HUD } from './components/ui/HUD'
import { SceneRoot } from './components/scene/SceneRoot'

export default function App() {
  const { phase, isARMode } = useGameStore(
    useShallow((s) => ({ phase: s.phase, isARMode: s.isARMode }))
  )

  const [running, setRunning] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2600)
  }

  const handleRun = () => {
    setRunning(true)
    showToast('🎢 Ride running!')
  }

  const handleStop = () => {
    setRunning(false)
  }

  const handlePiecePlaced = () => {
    showToast('Track piece placed')
  }

  if (phase === 'landing') {
    return <LandingScreen />
  }

  return (
    <>
      {/* 3D scene always renders once we leave landing */}
      <SceneRoot running={running} />

      {/* Entrance placement overlay */}
      {phase === 'place-entrance' && <EntranceOverlay isARMode={isARMode} />}

      {/* HUD (top bar) */}
      {(phase === 'building' || running) && (
        <HUD onRun={handleRun} onStop={handleStop} isRunning={running} />
      )}

      {/* Toolbar (bottom) */}
      {phase === 'building' && !running && (
        <Toolbar onPlace={handlePiecePlaced} />
      )}

      {/* Toast */}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  )
}
