import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildWorldPath } from '../../systems/trackChain'
import type { PlacedPiece } from '../../types/game'

interface Props {
  pieces: PlacedPiece[]
  running: boolean
}

const CART_SPEED = 0.12

export function CoasterCart({ pieces, running }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const tRef = useRef(0)
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null)

  // Build curve when pieces change
  const path = buildWorldPath(pieces)
  if (path.length >= 2) {
    curveRef.current = new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.5)
  }

  useFrame((_state, delta) => {
    if (!running || !groupRef.current || !curveRef.current) return

    tRef.current += delta * CART_SPEED
    if (tRef.current > 1) tRef.current = 0

    const pos = curveRef.current.getPoint(tRef.current)
    const ahead = curveRef.current.getPoint(Math.min(tRef.current + 0.01, 1))
    const tan = ahead.clone().sub(pos).normalize()

    if (tan.lengthSq() > 0.0001) {
      const up = new THREE.Vector3(0, 1, 0)
      const q = new THREE.Quaternion()
      const mx = new THREE.Matrix4()
      mx.lookAt(pos, ahead, up)
      q.setFromRotationMatrix(mx)
      groupRef.current.quaternion.copy(q)
    }

    groupRef.current.position.copy(pos).add(new THREE.Vector3(0, 0.12, 0))
  })

  if (!running || !curveRef.current || path.length < 2) return null

  return (
    <group ref={groupRef}>
      {/* Cart body */}
      <mesh>
        <boxGeometry args={[0.22, 0.14, 0.38]} />
        <meshStandardMaterial color="#e8240e" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Front panel (slightly lighter) */}
      <mesh position={[0, 0.04, 0.19]}>
        <boxGeometry args={[0.2, 0.06, 0.02]} />
        <meshStandardMaterial color="#ff5533" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Headlights */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.04, 0.2]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#fffbe6" emissive="#ffe066" emissiveIntensity={2} />
        </mesh>
      ))}
      {/* Wheels */}
      {[
        [-0.12, -0.06, 0.12],
        [0.12, -0.06, 0.12],
        [-0.12, -0.06, -0.12],
        [0.12, -0.06, -0.12],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
          <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Headlight glow */}
      <pointLight color="#ffe066" intensity={0.8} distance={1.2} decay={2} position={[0, 0.04, 0.22]} />
    </group>
  )
}
