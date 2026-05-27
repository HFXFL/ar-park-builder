import * as THREE from 'three'

export type GamePhase =
  | 'landing'
  | 'place-entrance'
  | 'building'
  | 'running'

export type TrackPieceType =
  | 'entrance'
  | 'straight'
  | 'curve-left'
  | 'curve-right'
  | 'incline'
  | 'decline'
  | 'station'

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
