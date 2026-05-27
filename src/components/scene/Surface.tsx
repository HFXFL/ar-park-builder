import { useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  onHit: (point: THREE.Vector3) => void
  active: boolean
}

// Desktop fallback: a semi-visible ground grid the user taps on
export function DesktopSurface({ onHit, active }: Props) {
  const planeRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()

  const handlePointerDown = useCallback(
    (e: THREE.Event & { point: THREE.Vector3 }) => {
      if (!active) return
      e.stopPropagation()
      onHit((e as any).point)
    },
    [active, onHit]
  )

  return (
    <>
      {/* Invisible hit target */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown as any}
      >
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Visual grid */}
      <gridHelper
        args={[20, 40, '#3d2200', '#1c1c1c']}
        position={[0, 0.001, 0]}
      />
    </>
  )
}

// Reticle — shows where the next piece will land
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
