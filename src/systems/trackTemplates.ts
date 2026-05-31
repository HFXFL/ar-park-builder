import * as THREE from 'three'
import type { TrackPieceType } from '../types/game'

export interface TrackTemplate {
  type: TrackPieceType
  label: string
  icon: string
  exitOffset: THREE.Vector3
  exitEuler: THREE.Euler
  centerPath: THREE.Vector3[]
  length: number
}

const INCLINE = Math.PI / 6

function arc(
  cx: number,
  cz: number,
  r: number,
  aStart: number,
  aEnd: number,
  segs = 8
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segs; i++) {
    const a = aStart + (aEnd - aStart) * (i / segs)
    pts.push(new THREE.Vector3(cx + r * Math.cos(a), 0, cz + r * Math.sin(a)))
  }
  return pts
}

export const TRACK_TEMPLATES: Record<TrackPieceType, TrackTemplate> = {

  // ── Park gate ───────────────────────────────────────────────────────────
  'park-entrance': {
    type: 'park-entrance',
    label: 'Park Gate',
    icon: '🎪',
    exitOffset: new THREE.Vector3(0, 0, 1.4),
    exitEuler: new THREE.Euler(0, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.7),
      new THREE.Vector3(0, 0, 1.4),
    ],
    length: 1.4,
  },

  // ── Footpath pieces ─────────────────────────────────────────────────────
  'path-straight': {
    type: 'path-straight',
    label: 'Path',
    icon: '▬',
    exitOffset: new THREE.Vector3(0, 0, 1),
    exitEuler: new THREE.Euler(0, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.5),
      new THREE.Vector3(0, 0, 1),
    ],
    length: 1,
  },
  'path-curve-left': {
    type: 'path-curve-left',
    label: 'Path L',
    icon: '↰',
    exitOffset: new THREE.Vector3(-1, 0, 1),
    exitEuler: new THREE.Euler(0, -Math.PI / 2, 0),
    centerPath: arc(-1, 0, 1, 0, Math.PI / 2),
    length: Math.PI / 2,
  },
  'path-curve-right': {
    type: 'path-curve-right',
    label: 'Path R',
    icon: '↱',
    exitOffset: new THREE.Vector3(1, 0, 1),
    exitEuler: new THREE.Euler(0, Math.PI / 2, 0),
    centerPath: arc(1, 0, 1, Math.PI, Math.PI / 2),
    length: Math.PI / 2,
  },

  // ── Ride entrance — bridges path → coaster track ─────────────────────
  'ride-entrance': {
    type: 'ride-entrance',
    label: 'Ride Gate',
    icon: '🎢',
    exitOffset: new THREE.Vector3(0, 0, 1.6),
    exitEuler: new THREE.Euler(0, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.5),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 1.3),
      new THREE.Vector3(0, 0, 1.6),
    ],
    length: 1.6,
  },

  // ── Coaster track ────────────────────────────────────────────────────
  straight: {
    type: 'straight',
    label: 'Straight',
    icon: '⬆',
    exitOffset: new THREE.Vector3(0, 0, 1),
    exitEuler: new THREE.Euler(0, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.25),
      new THREE.Vector3(0, 0, 0.5),
      new THREE.Vector3(0, 0, 0.75),
      new THREE.Vector3(0, 0, 1),
    ],
    length: 1,
  },
  'curve-left': {
    type: 'curve-left',
    label: 'Curve L',
    icon: '↰',
    exitOffset: new THREE.Vector3(-1, 0, 1),
    exitEuler: new THREE.Euler(0, -Math.PI / 2, 0),
    centerPath: arc(-1, 0, 1, 0, Math.PI / 2),
    length: Math.PI / 2,
  },
  'curve-right': {
    type: 'curve-right',
    label: 'Curve R',
    icon: '↱',
    exitOffset: new THREE.Vector3(1, 0, 1),
    exitEuler: new THREE.Euler(0, Math.PI / 2, 0),
    centerPath: arc(1, 0, 1, Math.PI, Math.PI / 2),
    length: Math.PI / 2,
  },
  incline: {
    type: 'incline',
    label: 'Incline',
    icon: '↗',
    exitOffset: new THREE.Vector3(0, Math.sin(INCLINE), Math.cos(INCLINE)),
    exitEuler: new THREE.Euler(-INCLINE, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, Math.sin(INCLINE) * 0.5, Math.cos(INCLINE) * 0.5),
      new THREE.Vector3(0, Math.sin(INCLINE), Math.cos(INCLINE)),
    ],
    length: 1,
  },
  decline: {
    type: 'decline',
    label: 'Decline',
    icon: '↘',
    exitOffset: new THREE.Vector3(0, -Math.sin(INCLINE), Math.cos(INCLINE)),
    exitEuler: new THREE.Euler(INCLINE, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -Math.sin(INCLINE) * 0.5, Math.cos(INCLINE) * 0.5),
      new THREE.Vector3(0, -Math.sin(INCLINE), Math.cos(INCLINE)),
    ],
    length: 1,
  },
  station: {
    type: 'station',
    label: 'Station',
    icon: '🏠',
    exitOffset: new THREE.Vector3(0, 0, 2),
    exitEuler: new THREE.Euler(0, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.5),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 1.5),
      new THREE.Vector3(0, 0, 2),
    ],
    length: 2,
  },
}

export const PATH_TOOLBAR: TrackPieceType[] = [
  'path-straight',
  'path-curve-left',
  'path-curve-right',
  'ride-entrance',
]

export const RIDE_TOOLBAR: TrackPieceType[] = [
  'straight',
  'curve-left',
  'curve-right',
  'incline',
  'decline',
  'station',
]
