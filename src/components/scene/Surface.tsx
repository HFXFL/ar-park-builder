import { useRef, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  /** Called when user taps/clicks the ground (place-entrance phase or path building) */
  onHit: (point: THREE.Vector3) => void
  /** Called every pointermove — drives the ghost preview in build mode */
  onHover?: (point: THREE.Vector3) => void
  active: boolean
  /** Show the grass + grid (true during building phase) */
  showGrid?: boolean
}

export function DesktopSurface({ onHit, onHover, active, showGrid = true }: Props) {
  const planeRef = useRef<THREE.Mesh>(null)

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!active) return
      e.stopPropagation()
      onHit(e.point)
    },
    [active, onHit]
  )

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!onHover) return
      onHover(e.point)
    },
    [onHover]
  )

  return (
    <>
      {/* Grass ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#3a6b28" roughness={1} />
      </mesh>

      {/* Invisible large hit target (pointer events) */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Build grid — 1-unit cells, RCT tile feel */}
      {showGrid && (
        <gridHelper
          args={[20, 20, 0x2a5020, 0x2a5020]}
          position={[0, 0.003, 0]}
        />
      )}
    </>
  )
}

// ── Placement reticle ────────────────────────────────────────────────────────
interface ReticleProps {
  position: THREE.Vector3
  visible: boolean
}

export function PlacementReticle({ position, visible }: ReticleProps) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.8
    ref.current.scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 3) * 0.05)
  })

  if (!visible) return null

  return (
    <group position={position}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.25, 32]} />
        <meshBasicMaterial color="#ff8c00" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.09, 32]} />
        <meshBasicMaterial color="#fff" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
