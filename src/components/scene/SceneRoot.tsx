import { Suspense, useCallback } from 'react'
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
  const { phase, placedPieces, buildMode, pathChainExit, rideChainExit, setParkOrigin, selectedTool } =
    useGameStore(
      useShallow((s) => ({
        phase: s.phase,
        placedPieces: s.placedPieces,
        buildMode: s.buildMode,
        pathChainExit: s.pathChainExit,
        rideChainExit: s.rideChainExit,
        setParkOrigin: s.setParkOrigin,
        selectedTool: s.selectedTool,
      }))
    )

  const handleSurfaceHit = useCallback(
    (point: THREE.Vector3) => {
      if (phase === 'place-park-entrance') {
        setParkOrigin(point)
      }
    },
    [phase, setParkOrigin]
  )

  const activeExit = buildMode === 'ride' ? rideChainExit : pathChainExit
  const ghostPosition: [number, number, number] = [
    activeExit.position.x,
    activeExit.position.y,
    activeExit.position.z,
  ]
  const ghostQuaternion: [number, number, number, number] = [
    activeExit.quaternion.x,
    activeExit.quaternion.y,
    activeExit.quaternion.z,
    activeExit.quaternion.w,
  ]

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.45} color="#ffe8c8" />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#fff5e0"
      />
      <hemisphereLight args={['#ffe0a0', '#303050', 0.35]} />

      {/* Ground */}
      <DesktopSurface
        onHit={handleSurfaceHit}
        active={phase === 'place-park-entrance'}
      />

      {/* Soft shadow blob under park */}
      {placedPieces.length > 0 && (
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.3}
          scale={12}
          blur={2}
          far={1.5}
        />
      )}

      {/* Placed track pieces */}
      {placedPieces.map((piece) => (
        <TrackPiece
          key={piece.id}
          type={piece.type}
          position={piece.position}
          quaternion={piece.quaternion}
        />
      ))}

      {/* Ghost preview for next piece */}
      {phase === 'building' && selectedTool && (
        <TrackPiece
          type={selectedTool}
          position={ghostPosition}
          quaternion={ghostQuaternion}
          ghost
        />
      )}

      {/* Placement reticle */}
      {phase === 'place-park-entrance' && (
        <PlacementReticle
          position={new THREE.Vector3(0, 0.01, 0)}
          visible
        />
      )}

      {/* Coaster cart */}
      <CoasterCart pieces={placedPieces} running={running} />

      {/* Camera controls (desktop only) */}
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
      camera={{ position: [0, 4, 7], fov: 55 }}
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0d0d16' }}
    >
      <Suspense fallback={null}>
        <ParkScene running={running} />
      </Suspense>
    </Canvas>
  )
}
