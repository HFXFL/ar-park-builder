import { useMemo } from 'react'
import * as THREE from 'three'
import type { TrackPieceType } from '../../types/game'
import { TRACK_TEMPLATES } from '../../systems/trackTemplates'

// ── Shared constants ────────────────────────────────────────────────────────
const RAIL_RADIUS = 0.022
const RAIL_SEGMENTS = 8
const TRACK_HALF_WIDTH = 0.24
const TIE_WIDTH = 0.56
const TIE_DEPTH = 0.09
const TIE_HEIGHT = 0.05
const PATH_WIDTH = 0.88

const COLORS = {
  rail: '#a0a8b0',
  tie: '#4a2e18',
  support: '#555e66',
  path_surface: '#c4bcb0',
  path_edge: '#9e9488',
  path_line: '#d6d0c8',
  park_gate: '#ff8c00',
  park_gate_dark: '#cc6a00',
  ride_gate: '#2a5fa8',
  ride_gate_light: '#4a7fc8',
  station_roof: '#2a5fa8',
  station_wall: '#e8dcc8',
}

// ── Coaster Rails ───────────────────────────────────────────────────────────
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
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize()
      if (right.lengthSq() < 0.001) right.set(1, 0, 0)
      leftPts.push(pt.clone().addScaledVector(right, -TRACK_HALF_WIDTH))
      rightPts.push(pt.clone().addScaledVector(right, TRACK_HALF_WIDTH))
      if (i % 2 === 0) {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan)
        ties.push({ position: pt.clone(), quaternion: q })
      }
    }
    return {
      leftCurve: new THREE.CatmullRomCurve3(leftPts),
      rightCurve: new THREE.CatmullRomCurve3(rightPts),
      tiePositions: ties,
    }
  }, [path])

  const opacity = ghost ? 0.4 : 1
  return (
    <group>
      <mesh>
        <tubeGeometry args={[leftCurve, 24, RAIL_RADIUS, RAIL_SEGMENTS, false]} />
        <meshStandardMaterial color={COLORS.rail} metalness={0.85} roughness={0.2} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh>
        <tubeGeometry args={[rightCurve, 24, RAIL_RADIUS, RAIL_SEGMENTS, false]} />
        <meshStandardMaterial color={COLORS.rail} metalness={0.85} roughness={0.2} transparent={ghost} opacity={opacity} />
      </mesh>
      {tiePositions.map((t, i) => (
        <mesh key={i} position={t.position} quaternion={t.quaternion}>
          <boxGeometry args={[TIE_WIDTH, TIE_HEIGHT, TIE_DEPTH]} />
          <meshStandardMaterial color={COLORS.tie} roughness={0.85} transparent={ghost} opacity={opacity} />
        </mesh>
      ))}
    </group>
  )
}

// ── Footpath ────────────────────────────────────────────────────────────────
interface PathSegmentProps {
  path: THREE.Vector3[]
  ghost?: boolean
}

function PathSurface({ path, ghost }: PathSegmentProps) {
  const segments = useMemo(() => {
    const segs: { position: THREE.Vector3; quaternion: THREE.Quaternion; len: number }[] = []
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      const mid = a.clone().lerp(b, 0.5)
      const dir = b.clone().sub(a).normalize()
      const len = a.distanceTo(b)
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
      segs.push({ position: mid, quaternion: q, len })
    }
    return segs
  }, [path])

  const opacity = ghost ? 0.4 : 1
  return (
    <group>
      {segments.map((s, i) => (
        <group key={i} position={s.position} quaternion={s.quaternion}>
          {/* Main slab */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[PATH_WIDTH, 0.055, s.len + 0.01]} />
            <meshStandardMaterial color={COLORS.path_surface} roughness={0.9} transparent={ghost} opacity={opacity} />
          </mesh>
          {/* Left edge strip */}
          <mesh position={[-PATH_WIDTH / 2 + 0.025, 0.015, 0]}>
            <boxGeometry args={[0.05, 0.07, s.len + 0.01]} />
            <meshStandardMaterial color={COLORS.path_edge} roughness={0.8} transparent={ghost} opacity={opacity} />
          </mesh>
          {/* Right edge strip */}
          <mesh position={[PATH_WIDTH / 2 - 0.025, 0.015, 0]}>
            <boxGeometry args={[0.05, 0.07, s.len + 0.01]} />
            <meshStandardMaterial color={COLORS.path_edge} roughness={0.8} transparent={ghost} opacity={opacity} />
          </mesh>
          {/* Centre dashed line */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.04, 0.01, s.len * 0.6]} />
            <meshStandardMaterial color={COLORS.path_line} roughness={0.9} transparent={ghost} opacity={opacity * 0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Park Entrance Gate ──────────────────────────────────────────────────────
function ParkEntranceGate({ ghost }: { ghost?: boolean }) {
  const opacity = ghost ? 0.4 : 1
  return (
    <group>
      <PathSurface
        path={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.7), new THREE.Vector3(0, 0, 1.4)]}
        ghost={ghost}
      />
      {/* Pillars */}
      {([-0.55, 0.55] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.75, 0.5]}>
          <boxGeometry args={[0.12, 1.5, 0.12]} />
          <meshStandardMaterial color={COLORS.park_gate} metalness={0.3} roughness={0.5} transparent={ghost} opacity={opacity} />
        </mesh>
      ))}
      {/* Top arch beam */}
      <mesh position={[0, 1.55, 0.5]}>
        <boxGeometry args={[1.22, 0.12, 0.14]} />
        <meshStandardMaterial color={COLORS.park_gate_dark} metalness={0.3} roughness={0.5} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 1.72, 0.46]}>
        <boxGeometry args={[0.9, 0.26, 0.05]} />
        <meshStandardMaterial color="#1a1a2a" transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Decorative finials on pillars */}
      {([-0.55, 0.55] as number[]).map((x) => (
        <mesh key={x} position={[x, 1.56, 0.5]}>
          <coneGeometry args={[0.09, 0.2, 8]} />
          <meshStandardMaterial color={COLORS.park_gate} metalness={0.5} transparent={ghost} opacity={opacity} />
        </mesh>
      ))}
    </group>
  )
}

// ── Ride Entrance Gate ──────────────────────────────────────────────────────
function RideEntranceGate({ ghost }: { ghost?: boolean }) {
  const opacity = ghost ? 0.4 : 1
  return (
    <group>
      {/* Path slab leading in */}
      <PathSurface
        path={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.8)]}
        ghost={ghost}
      />
      {/* Gate pillars */}
      {([-0.38, 0.38] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.55, 0.75]}>
          <boxGeometry args={[0.1, 1.1, 0.1]} />
          <meshStandardMaterial color={COLORS.ride_gate} metalness={0.4} roughness={0.4} transparent={ghost} opacity={opacity} />
        </mesh>
      ))}
      {/* Top bar */}
      <mesh position={[0, 1.12, 0.75]}>
        <boxGeometry args={[0.88, 0.1, 0.12]} />
        <meshStandardMaterial color={COLORS.ride_gate_light} metalness={0.4} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Ride sign */}
      <mesh position={[0, 1.26, 0.72]}>
        <boxGeometry args={[0.68, 0.2, 0.04]} />
        <meshStandardMaterial color="#0a1628" transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Queue railings */}
      {([-0.3, 0.3] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0.35]}>
          <boxGeometry args={[0.03, 0.4, 0.6]} />
          <meshStandardMaterial color={COLORS.ride_gate} metalness={0.6} transparent={ghost} opacity={opacity * 0.8} />
        </mesh>
      ))}
      {/* Rails starting from exit */}
      <Rails
        path={[
          new THREE.Vector3(0, 0, 1.0),
          new THREE.Vector3(0, 0, 1.3),
          new THREE.Vector3(0, 0, 1.6),
        ]}
        ghost={ghost}
      />
    </group>
  )
}

// ── Station ─────────────────────────────────────────────────────────────────
function StationPiece({ ghost }: { ghost?: boolean }) {
  const opacity = ghost ? 0.4 : 1
  return (
    <group>
      <mesh position={[0, 0.06, 1]}>
        <boxGeometry args={[0.8, 0.12, 1.6]} />
        <meshStandardMaterial color={COLORS.station_wall} roughness={0.8} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.72, 1]}>
        <boxGeometry args={[1.0, 0.08, 1.8]} />
        <meshStandardMaterial color={COLORS.station_roof} metalness={0.1} roughness={0.6} transparent={ghost} opacity={opacity} />
      </mesh>
      {([[-0.42, 0.1], [0.42, 0.1], [-0.42, 1.9], [0.42, 1.9]] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          <meshStandardMaterial color={COLORS.park_gate} metalness={0.5} transparent={ghost} opacity={opacity} />
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

// ── Scaffolding ──────────────────────────────────────────────────────────────
function Scaffolding({ path }: { path: THREE.Vector3[] }) {
  const supports = useMemo(
    () => path.filter((p) => p.y > 0.12).map((p, i) => ({ key: i, x: p.x, z: p.z, height: p.y })),
    [path]
  )
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

// ── Main export ──────────────────────────────────────────────────────────────
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
      {type === 'park-entrance' ? (
        <ParkEntranceGate ghost={ghost} />
      ) : type === 'path-straight' || type === 'path-curve-left' || type === 'path-curve-right' ? (
        <PathSurface path={template.centerPath} ghost={ghost} />
      ) : type === 'ride-entrance' ? (
        <RideEntranceGate ghost={ghost} />
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
