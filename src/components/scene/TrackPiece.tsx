import { useMemo } from 'react'
import * as THREE from 'three'
import type { TrackPieceType } from '../../types/game'
import { TRACK_TEMPLATES } from '../../systems/trackTemplates'

const RAIL_RADIUS = 0.022
const RAIL_SEGMENTS = 8
const TRACK_HALF_WIDTH = 0.24
const TIE_WIDTH = 0.56
const TIE_DEPTH = 0.09
const TIE_HEIGHT = 0.05
const COLORS = {
  rail: '#a0a8b0',
  tie: '#4a2e18',
  support: '#555e66',
  entrance_frame: '#ff8c00',
  entrance_arch: '#cc6a00',
  station_roof: '#2a5fa8',
  station_wall: '#e8dcc8',
}

interface RailsProps {
  path: THREE.Vector3[]
  ghost?: boolean
}

function Rails({ path, ghost }: RailsProps) {
  const { leftCurve, rightCurve, tiePositions } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(path)
    const numTies = Math.max(3, Math.round(path.length * 2))

    const leftPts: THREE.Vector3[] = []
    const rightPts: THREE.Vector3[] = []
    const ties: { position: THREE.Vector3; quaternion: THREE.Quaternion }[] = []

    for (let i = 0; i <= numTies; i++) {
      const t = i / numTies
      const pt = curve.getPoint(t)
      const tan = curve.getTangent(t).normalize()

      // right = tangent cross up, then re-normalize
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize()
      if (right.lengthSq() < 0.001) right.set(1, 0, 0)

      leftPts.push(pt.clone().addScaledVector(right, -TRACK_HALF_WIDTH))
      rightPts.push(pt.clone().addScaledVector(right, TRACK_HALF_WIDTH))

      if (i % 2 === 0) {
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          tan
        )
        ties.push({ position: pt.clone(), quaternion: q })
      }
    }

    return {
      leftCurve: new THREE.CatmullRomCurve3(leftPts),
      rightCurve: new THREE.CatmullRomCurve3(rightPts),
      tiePositions: ties,
    }
  }, [path])

  const opacity = ghost ? 0.45 : 1

  return (
    <group>
      {/* Left rail */}
      <mesh>
        <tubeGeometry args={[leftCurve, 24, RAIL_RADIUS, RAIL_SEGMENTS, false]} />
        <meshStandardMaterial
          color={COLORS.rail}
          metalness={0.85}
          roughness={0.2}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Right rail */}
      <mesh>
        <tubeGeometry args={[rightCurve, 24, RAIL_RADIUS, RAIL_SEGMENTS, false]} />
        <meshStandardMaterial
          color={COLORS.rail}
          metalness={0.85}
          roughness={0.2}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Ties */}
      {tiePositions.map((t, i) => (
        <mesh key={i} position={t.position} quaternion={t.quaternion}>
          <boxGeometry args={[TIE_WIDTH, TIE_HEIGHT, TIE_DEPTH]} />
          <meshStandardMaterial
            color={COLORS.tie}
            roughness={0.85}
            transparent={ghost}
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
  )
}

function EntranceGate({ ghost }: { ghost?: boolean }) {
  const opacity = ghost ? 0.45 : 1
  return (
    <group>
      {/* Two pillars */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.4]}>
          <boxGeometry args={[0.1, 1.2, 0.1]} />
          <meshStandardMaterial color={COLORS.entrance_frame} transparent={ghost} opacity={opacity} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* Arch beam */}
      <mesh position={[0, 1.25, 0.4]}>
        <boxGeometry args={[0.9, 0.1, 0.12]} />
        <meshStandardMaterial color={COLORS.entrance_arch} transparent={ghost} opacity={opacity} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 1.4, 0.36]}>
        <boxGeometry args={[0.72, 0.22, 0.04]} />
        <meshStandardMaterial color="#1a1a2a" transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Path rails through entrance */}
      <Rails
        path={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.6), new THREE.Vector3(0, 0, 1.2)]}
        ghost={ghost}
      />
    </group>
  )
}

function StationPiece({ ghost }: { ghost?: boolean }) {
  const opacity = ghost ? 0.45 : 1
  return (
    <group>
      {/* Platform */}
      <mesh position={[0, 0.06, 1]}>
        <boxGeometry args={[0.8, 0.12, 1.6]} />
        <meshStandardMaterial color={COLORS.station_wall} roughness={0.8} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.72, 1]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.0, 0.08, 1.8]} />
        <meshStandardMaterial color={COLORS.station_roof} metalness={0.1} roughness={0.6} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Support pillars */}
      {[[-0.42, 0.1], [0.42, 0.1], [-0.42, 1.9], [0.42, 1.9]].map(([x, z], i) => (
        <mesh key={i} position={[x as number, 0.35, z as number]}>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          <meshStandardMaterial color={COLORS.entrance_frame} metalness={0.5} transparent={ghost} opacity={opacity} />
        </mesh>
      ))}
      <Rails
        path={[
          new THREE.Vector3(0, 0.12, 0),
          new THREE.Vector3(0, 0.12, 0.5),
          new THREE.Vector3(0, 0.12, 1),
          new THREE.Vector3(0, 0.12, 1.5),
          new THREE.Vector3(0, 0.12, 2),
        ]}
        ghost={ghost}
      />
    </group>
  )
}

// Scaffolding renders support columns in LOCAL piece space.
// path should be the template's local centerPath.
function Scaffolding({ path }: { path: THREE.Vector3[] }) {
  const supports = useMemo(() => {
    return path
      .filter((p) => p.y > 0.12)
      .map((p, i) => ({ key: i, x: p.x, z: p.z, height: p.y }))
  }, [path])

  return (
    <>
      {supports.map((s) => (
        <mesh key={s.key} position={[s.x, s.height / 2, s.z]}>
          <cylinderGeometry args={[0.025, 0.03, s.height, 6]} />
          <meshStandardMaterial color={COLORS.support} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </>
  )
}

interface TrackPieceProps {
  type: TrackPieceType
  position: [number, number, number]
  quaternion: [number, number, number, number]
  ghost?: boolean
}

export function TrackPiece({ type, position, quaternion, ghost }: TrackPieceProps) {
  const template = TRACK_TEMPLATES[type]

  return (
    <group position={position} quaternion={quaternion}>
      {type === 'entrance' ? (
        <EntranceGate ghost={ghost} />
      ) : type === 'station' ? (
        <StationPiece ghost={ghost} />
      ) : (
        <>
          <Rails path={template.centerPath} ghost={ghost} />
          {!ghost && <Scaffolding path={template.centerPath} />}
        </>
      )}
    </group>
  )
}
