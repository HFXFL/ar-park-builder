import * as THREE from 'three'

export type GamePhase =
  | 'landing'
  | 'place-park-entrance'
  | 'building'
  | 'running'

export type BuildMode = 'path' | 'ride'

export type TrackPieceType =
  // Park-level pieces
  | 'park-entrance'
  // Footpath pieces
  | 'path-straight'
  | 'path-curve-left'
  | 'path-curve-right'
  // Ride connection
  | 'ride-entrance'
  // Coaster track pieces
  | 'straight'
  | 'curve-left'
  | 'curve-right'
  | 'incline'
  | 'decline'
  | 'station'

export const PATH_TYPES: TrackPieceType[] = [
  'path-straight',
  'path-curve-left',
  'path-curve-right',
  'ride-entrance',
]

export const RIDE_TRACK_TYPES: TrackPieceType[] = [
  'ride-entrance',
  'straight',
  'curve-left',
  'curve-right',
  'incline',
  'decline',
  'station',
]

export interface PlacedPiece {
  id: string
  type: TrackPieceType
  position: [number, number, number]
  quaternion: [number, number, number, number]
}

export interface ChainExit {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

export interface HitPoint {
  position: THREE.Vector3
  normal: THREE.Vector3
}
