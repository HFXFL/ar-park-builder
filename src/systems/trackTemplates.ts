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
  entrance: {
    type: 'entrance',
    label: 'Entrance',
    icon: '🎪',
    exitOffset: new THREE.Vector3(0, 0, 1.2),
    exitEuler: new THREE.Euler(0, 0, 0),
    centerPath: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0.6),
      new THREE.Vector3(0, 0, 1.2),
    ],
    length: 1.2,
  },
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
    length: (Math.PI / 2) * 1,
  },
  'curve-right': {
    type: 'curve-right',
    label: 'Curve R',
    icon: '↱',
    exitOffset: new THREE.Vector3(1, 0, 1),
    exitEuler: new THREE.Euler(0, Math.PI / 2, 0),
    centerPath: arc(1, 0, 1, Math.PI, Math.PI / 2),
    length: (Math.PI / 2) * 1,
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

export const TOOLBAR_ORDER: TrackPieceType[] = [
  'straight',
  'curve-left',
  'curve-right',
  'incline',
  'decline',
  'station',
]
