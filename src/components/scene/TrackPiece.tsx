import { useMemo } from 'react'
import * as THREE from 'three'
import type { TrackPieceType } from '../../types/game'
import { TRACK_TEMPLATES } from '../../systems/trackTemplates'

// ── Shared constants ─────────────────────────────────────────────────────────
const RAIL_RADIUS = 0.022
const RAIL_SEGMENTS = 8
const TRACK_HALF_WIDTH = 0.24
const TIE_WIDTH = 0.56
const TIE_DEPTH = 0.09
const TIE_HEIGHT = 0.05

// RCT footpath is one tile wide — noticeably narrower than road-width
const PATH_WIDTH = 0.48
const PATH_HEIGHT = 0.04   // thin slab, like paving stones
const KERB_W = 0.045
const KERB_H = 0.055
const TILE_SPACING = 0.12  // grout-line interval

const COLORS = {
  // Coaster track
  rail: '#a0a8b0',
  tie: '#4a2e18',
  support: '#556066',
  // Footpath — stone / tarmac
  path_slab: '#b0a898',      // light stone
  path_grout: '#807870',     // darker grout lines
  path_kerb: '#908880',      // slightly lighter kerb edge
  // Park gate — warm stone with accent trim
  gate_stone: '#c8b898',
  gate_stone_dark: '#a09070',
  gate_trim: '#ff8c00',
  gate_trim_dark: '#cc6a00',
  gate_sign_bg: '#1a1228',
  // Balloon colors (park entrance decoration)
  balloon_r: '#ff3333',
  balloon_g: '#33cc55',
  balloon_b: '#3388ff',
  balloon_y: '#ffcc00',
  // Ride entrance
  ride_gate: '#1e4e9a',
  ride_gate_light: '#3a6fd0',
  ride_sign_bg: '#0a1020',
  ride_rope: '#8b6914',
  // Station
  station_roof: '#2a5fa8',
  station_wall: '#e8dcc8',
}

// ── Coaster Rails ────────────────────────────────────────────────────────────
function Rails({ path, ghost }: { path: THREE.Vector3[]; ghost?: boolean }) {
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

  const op = ghost ? 0.4 : 1
  return (
    <group>
      <mesh>
        <tubeGeometry args={[leftCurve, 24, RAIL_RADIUS, RAIL_SEGMENTS, false]} />
        <meshStandardMaterial color={COLORS.rail} metalness={0.85} roughness={0.2} transparent={ghost} opacity={op} />
      </mesh>
      <mesh>
        <tubeGeometry args={[rightCurve, 24, RAIL_RADIUS, RAIL_SEGMENTS, false]} />
        <meshStandardMaterial color={COLORS.rail} metalness={0.85} roughness={0.2} transparent={ghost} opacity={op} />
      </mesh>
      {tiePositions.map((t, i) => (
        <mesh key={i} position={t.position} quaternion={t.quaternion}>
          <boxGeometry args={[TIE_WIDTH, TIE_HEIGHT, TIE_DEPTH]} />
          <meshStandardMaterial color={COLORS.tie} roughness={0.85} transparent={ghost} opacity={op} />
        </mesh>
      ))}
    </group>
  )
}

// ── RCT-style tile footpath ──────────────────────────────────────────────────
//   Narrow stone slab with grout-line strips and kerb edges — NOT a road.
function TilePath({ path, ghost }: { path: THREE.Vector3[]; ghost?: boolean }) {
  const segments = useMemo(() => {
    const segs: { mid: THREE.Vector3; q: THREE.Quaternion; len: number }[] = []
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      const mid = a.clone().lerp(b, 0.5)
      const dir = b.clone().sub(a).normalize()
      const len = a.distanceTo(b)
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
      segs.push({ mid, q, len })
    }
    return segs
  }, [path])

  const op = ghost ? 0.4 : 1

  return (
    <group>
      {segments.map((s, i) => {
        // How many tile grout lines fit in this segment
        const lineCount = Math.max(0, Math.floor(s.len / TILE_SPACING) - 1)
        const lines = Array.from({ length: lineCount }, (_, idx) => {
          const offset = ((idx + 1) * TILE_SPACING) - s.len / 2
          return offset
        })

        return (
          <group key={i} position={s.mid} quaternion={s.q}>
            {/* Main stone slab */}
            <mesh>
              <boxGeometry args={[PATH_WIDTH, PATH_HEIGHT, s.len]} />
              <meshStandardMaterial color={COLORS.path_slab} roughness={0.95} transparent={ghost} opacity={op} />
            </mesh>

            {/* Grout lines running across path (perpendicular tile joints) */}
            {lines.map((zOff, li) => (
              <mesh key={li} position={[0, PATH_HEIGHT / 2 + 0.002, zOff]}>
                <boxGeometry args={[PATH_WIDTH - KERB_W * 2, 0.006, 0.008]} />
                <meshStandardMaterial color={COLORS.path_grout} roughness={1} transparent={ghost} opacity={op * 0.8} />
              </mesh>
            ))}

            {/* Left kerb */}
            <mesh position={[-(PATH_WIDTH / 2 - KERB_W / 2), KERB_H / 2 - PATH_HEIGHT / 2 + PATH_HEIGHT, 0]}>
              <boxGeometry args={[KERB_W, KERB_H, s.len + 0.01]} />
              <meshStandardMaterial color={COLORS.path_kerb} roughness={0.9} transparent={ghost} opacity={op} />
            </mesh>

            {/* Right kerb */}
            <mesh position={[(PATH_WIDTH / 2 - KERB_W / 2), KERB_H / 2 - PATH_HEIGHT / 2 + PATH_HEIGHT, 0]}>
              <boxGeometry args={[KERB_W, KERB_H, s.len + 0.01]} />
              <meshStandardMaterial color={COLORS.path_kerb} roughness={0.9} transparent={ghost} opacity={op} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ── Scaffolding ───────────────────────────────────────────────────────────────
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

// ── Park Entrance Gate ────────────────────────────────────────────────────────
//   Proper RCT-style theme park entrance: stone arch, flags, balloons
function ParkEntranceGate({ ghost }: { ghost?: boolean }) {
  const op = ghost ? 0.4 : 1
  const mat = (color: string, met = 0, rough = 0.8) => (
    <meshStandardMaterial color={color} metalness={met} roughness={rough} transparent={ghost} opacity={op} />
  )

  const balloons: [string, number, number][] = [
    [COLORS.balloon_r, -0.72, 2.05],
    [COLORS.balloon_y, -0.58, 2.22],
    [COLORS.balloon_g,  0.58, 2.22],
    [COLORS.balloon_b,  0.72, 2.05],
    [COLORS.balloon_y, -0.65, 2.38],
    [COLORS.balloon_r,  0.65, 2.38],
  ]

  return (
    <group>
      {/* Tile path underneath */}
      <TilePath
        path={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.7), new THREE.Vector3(0, 0, 1.4)]}
        ghost={ghost}
      />

      {/* Left stone pillar — wide at base, tapered slightly */}
      <mesh position={[-0.52, 0.7, 0.55]}>
        <boxGeometry args={[0.18, 1.4, 0.18]} />
        {mat(COLORS.gate_stone)}
      </mesh>
      {/* Left pillar cap */}
      <mesh position={[-0.52, 1.43, 0.55]}>
        <boxGeometry args={[0.22, 0.06, 0.22]} />
        {mat(COLORS.gate_stone_dark)}
      </mesh>

      {/* Right stone pillar */}
      <mesh position={[0.52, 0.7, 0.55]}>
        <boxGeometry args={[0.18, 1.4, 0.18]} />
        {mat(COLORS.gate_stone)}
      </mesh>
      {/* Right pillar cap */}
      <mesh position={[0.52, 1.43, 0.55]}>
        <boxGeometry args={[0.22, 0.06, 0.22]} />
        {mat(COLORS.gate_stone_dark)}
      </mesh>

      {/* Arch beam — orange accent */}
      <mesh position={[0, 1.56, 0.55]}>
        <boxGeometry args={[1.28, 0.18, 0.2]} />
        {mat(COLORS.gate_trim, 0.15, 0.5)}
      </mesh>
      {/* Arch under-rail (darker orange) */}
      <mesh position={[0, 1.44, 0.55]}>
        <boxGeometry args={[0.88, 0.08, 0.18]} />
        {mat(COLORS.gate_trim_dark, 0.1, 0.6)}
      </mesh>

      {/* Sign board */}
      <mesh position={[0, 1.68, 0.52]}>
        <boxGeometry args={[0.84, 0.22, 0.05]} />
        {mat(COLORS.gate_sign_bg)}
      </mesh>

      {/* Decorative finials on pillars */}
      {([-0.52, 0.52] as number[]).map((x) => (
        <mesh key={x} position={[x, 1.62, 0.55]}>
          <coneGeometry args={[0.07, 0.22, 8]} />
          {mat(COLORS.gate_trim, 0.3, 0.4)}
        </mesh>
      ))}

      {/* Flag poles */}
      {([-0.52, 0.52] as number[]).map((x) => (
        <group key={x}>
          <mesh position={[x, 1.92, 0.55]}>
            <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
            {mat('#888', 0.6, 0.3)}
          </mesh>
          {/* Flag banner */}
          <mesh position={[x + (x < 0 ? 0.09 : -0.09), 2.12, 0.55]}>
            <boxGeometry args={[0.18, 0.12, 0.02]} />
            {mat(x < 0 ? COLORS.balloon_r : COLORS.balloon_b)}
          </mesh>
        </group>
      ))}

      {/* Balloons */}
      {balloons.map(([color, x, y], i) => (
        <group key={i}>
          <mesh position={[x, y, 0.55]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color={color} roughness={0.4} transparent={ghost} opacity={op} />
          </mesh>
          {/* Balloon string */}
          <mesh position={[x, y - 0.14, 0.55]}>
            <cylinderGeometry args={[0.004, 0.004, 0.18, 4]} />
            {mat('#ccc', 0, 1)}
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Ride Queue Entrance ───────────────────────────────────────────────────────
//   RCT-style queue entrance: small booth, rope posts, ride sign
function RideEntranceGate({ ghost }: { ghost?: boolean }) {
  const op = ghost ? 0.4 : 1
  const mat = (color: string, met = 0, rough = 0.8) => (
    <meshStandardMaterial color={color} metalness={met} roughness={rough} transparent={ghost} opacity={op} />
  )

  // Queue rope posts: pairs of [x, z] positions
  const ropePosts: [number, number][] = [
    [-0.26, 0.2], [0.26, 0.2],
    [-0.26, 0.55], [0.26, 0.55],
  ]

  return (
    <group>
      {/* Path slab leading to queue */}
      <TilePath
        path={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.8)]}
        ghost={ghost}
      />

      {/* Gate pillars */}
      {([-0.32, 0.32] as number[]).map((x) => (
        <mesh key={x} position={[x, 0.52, 0.85]}>
          <boxGeometry args={[0.09, 1.04, 0.09]} />
          {mat(COLORS.ride_gate, 0.5, 0.4)}
        </mesh>
      ))}

      {/* Top bar */}
      <mesh position={[0, 1.07, 0.85]}>
        <boxGeometry args={[0.76, 0.09, 0.11]} />
        {mat(COLORS.ride_gate_light, 0.4, 0.4)}
      </mesh>

      {/* Ride sign */}
      <mesh position={[0, 1.2, 0.82]}>
        <boxGeometry args={[0.58, 0.18, 0.04]} />
        {mat(COLORS.ride_sign_bg)}
      </mesh>

      {/* Queue rope posts */}
      {ropePosts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, z]}>
          <cylinderGeometry args={[0.018, 0.018, 0.36, 6]} />
          {mat(COLORS.ride_gate_light, 0.5, 0.3)}
        </mesh>
      ))}

      {/* Rope between left posts */}
      <mesh position={[-0.26, 0.28, 0.375]}>
        <boxGeometry args={[0.02, 0.02, 0.37]} />
        {mat(COLORS.ride_rope)}
      </mesh>
      {/* Rope between right posts */}
      <mesh position={[0.26, 0.28, 0.375]}>
        <boxGeometry args={[0.02, 0.02, 0.37]} />
        {mat(COLORS.ride_rope)}
      </mesh>

      {/* Rails from gate exit (ride track begins here) */}
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

// ── Station ───────────────────────────────────────────────────────────────────
function StationPiece({ ghost }: { ghost?: boolean }) {
  const op = ghost ? 0.4 : 1
  return (
    <group>
      {/* Platform */}
      <mesh position={[0, 0.06, 1]}>
        <boxGeometry args={[0.8, 0.12, 1.6]} />
        <meshStandardMaterial color={COLORS.station_wall} roughness={0.8} transparent={ghost} opacity={op} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.72, 1]}>
        <boxGeometry args={[1.0, 0.08, 1.8]} />
        <meshStandardMaterial color={COLORS.station_roof} metalness={0.1} roughness={0.6} transparent={ghost} opacity={op} />
      </mesh>
      {/* Corner columns */}
      {([[-0.42, 0.1], [0.42, 0.1], [-0.42, 1.9], [0.42, 1.9]] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          <meshStandardMaterial color={COLORS.gate_trim} metalness={0.5} transparent={ghost} opacity={op} />
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

// ── Main export ───────────────────────────────────────────────────────────────
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
        <TilePath path={template.centerPath} ghost={ghost} />
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
