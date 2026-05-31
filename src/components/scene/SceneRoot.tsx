import { Suspense, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { DesktopSurface, PlacementReticle } from './Surface'
import { TrackPiece } from './TrackPiece'
import { CoasterCart } from './CoasterCart'

interface SceneProps {
  running: boolean
}

function ParkScene({ running }: SceneProps) {
  const {
    phase,
    buildMode,
    placedPieces,
    pathChainExit,
    rideChainExit,
    hoverGridPos,
    selectedTool,
    setParkOrigin,
    setHoverGridPos,
    placePathAtPoint,
  } = useGameStore(
    useShallow((s) => ({
      phase: s.phase,
      buildMode: s.buildMode,
      placedPieces: s.placedPieces,
      pathChainExit: s.pathChainExit,
      rideChainExit: s.rideChainExit,
      hoverGridPos: s.hoverGridPos,
      selectedTool: s.selectedTool,
      setParkOrigin: s.setParkOrigin,
      setHoverGridPos: s.setHoverGridPos,
      placePathAtPoint: s.placePathAtPoint,
    }))
  )

  // Throttle hover updates (~20 fps max) to avoid re-renders on every pixel
  const lastHoverTime = useRef(0)
  const handleHover = useCallback(
    (point: THREE.Vector3) => {
      const now = performance.now()
      if (now - lastHoverTime.current < 50) return
      lastHoverTime.current = now
      setHoverGridPos(point)
    },
    [setHoverGridPos]
  )

  const handleSurfaceHit = useCallback(
    (point: THREE.Vector3) => {
      if (phase === 'place-park-entrance') {
        setParkOrigin(point)
        return
      }
      // Path mode: tapping ground places tile at that position
      if (phase === 'building' && buildMode === 'path' && selectedTool) {
        placePathAtPoint(point)
      }
    },
    [phase, buildMode, selectedTool, setParkOrigin, placePathAtPoint]
  )

  // Ghost position: path mode follows pointer on ground, ride mode snaps to chain exit
  const activeExit = buildMode === 'ride' ? rideChainExit : pathChainExit
  const ghostSource =
    buildMode === 'path' && hoverGridPos ? hoverGridPos : activeExit.position

  const ghostPosition: [number, number, number] = [
    ghostSource.x,
    ghostSource.y,
    ghostSource.z,
  ]
  const ghostQuaternion: [number, number, number, number] = [
    activeExit.quaternion.x,
    activeExit.quaternion.y,
    activeExit.quaternion.z,
    activeExit.quaternion.w,
  ]

  const isBuilding = phase === 'building'

  return (
    <>
      {/* Lighting — warm daylight over green grass */}
      <ambientLight intensity={0.6} color="#ffe8d0" />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        color="#fff8e8"
      />
      <hemisphereLight args={['#c8f0c8', '#1a3a0a', 0.5]} />

      {/* Grass ground + build grid */}
      <DesktopSurface
        onHit={handleSurfaceHit}
        onHover={handleHover}
        active={phase === 'place-park-entrance' || (isBuilding && buildMode === 'path')}
        showGrid={isBuilding}
      />

      {/* Soft shadows */}
      {placedPieces.length > 0 && (
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={0.3}
          scale={14}
          blur={2.5}
          far={2}
        />
      )}

      {/* Placed pieces */}
      {placedPieces.map((piece) => (
        <TrackPiece
          key={piece.id}
          type={piece.type}
          position={piece.position}
          quaternion={piece.quaternion}
        />
      ))}

      {/* Ghost preview — path mode follows pointer, ride mode follows chain */}
      {isBuilding && selectedTool && (
        <TrackPiece
          type={selectedTool}
          position={ghostPosition}
          quaternion={ghostQuaternion}
          ghost
        />
      )}

      {/* Reticle during park-entrance placement */}
      {phase === 'place-park-entrance' && (
        <PlacementReticle position={new THREE.Vector3(0, 0.01, 0)} visible />
      )}

      {/* Cart only visible while running */}
      <CoasterCart pieces={placedPieces} running={running} />

      {/* Camera */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={1}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={
          placedPieces.length > 0
            ? new THREE.Vector3(...placedPieces[0].position)
            : new THREE.Vector3(0, 0, 0)
        }
      />
    </>
  )
}

interface Props {
  running: boolean
}

export function SceneRoot({ running }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 5, 9], fov: 52 }}
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a3a0a' }}
    >
      <Suspense fallback={null}>
        <ParkScene running={running} />
      </Suspense>
    </Canvas>
  )
}
