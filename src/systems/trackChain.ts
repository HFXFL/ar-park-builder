import * as THREE from 'three'
import type { PlacedPiece, ChainExit } from '../types/game'
import { RIDE_TRACK_TYPES } from '../types/game'
import { TRACK_TEMPLATES } from './trackTemplates'

export const INITIAL_CHAIN_EXIT: ChainExit = {
  position: new THREE.Vector3(0, 0, 0),
  quaternion: new THREE.Quaternion(),
}

export function computeChainExit(pieces: PlacedPiece[]): ChainExit {
  if (pieces.length === 0) return INITIAL_CHAIN_EXIT

  let pos = new THREE.Vector3(0, 0, 0)
  let quat = new THREE.Quaternion()

  for (const piece of pieces) {
    pos = new THREE.Vector3(...piece.position)
    quat = new THREE.Quaternion(...piece.quaternion)

    const template = TRACK_TEMPLATES[piece.type]
    const localExit = template.exitOffset.clone().applyQuaternion(quat)
    pos = pos.clone().add(localExit)

    const exitQ = new THREE.Quaternion().setFromEuler(template.exitEuler)
    quat = quat.clone().multiply(exitQ)
  }

  return { position: pos, quaternion: quat }
}

// Cart only follows coaster track — excludes footpath pieces
export function buildWorldPath(pieces: PlacedPiece[]): THREE.Vector3[] {
  const ridePieces = pieces.filter((p) => RIDE_TRACK_TYPES.includes(p.type))
  const allPoints: THREE.Vector3[] = []

  for (const piece of ridePieces) {
    const template = TRACK_TEMPLATES[piece.type]
    const piecePos = new THREE.Vector3(...piece.position)
    const pieceQuat = new THREE.Quaternion(...piece.quaternion)

    const worldPoints = template.centerPath.map((lp) =>
      lp.clone().applyQuaternion(pieceQuat).add(piecePos)
    )

    if (allPoints.length > 0) {
      allPoints.push(...worldPoints.slice(1))
    } else {
      allPoints.push(...worldPoints)
    }
  }

  return allPoints
}

export function nextPiecePlacement(
  chainExit: ChainExit
): { position: [number, number, number]; quaternion: [number, number, number, number] } {
  return {
    position: [chainExit.position.x, chainExit.position.y, chainExit.position.z],
    quaternion: [
      chainExit.quaternion.x,
      chainExit.quaternion.y,
      chainExit.quaternion.z,
      chainExit.quaternion.w,
    ],
  }
}
