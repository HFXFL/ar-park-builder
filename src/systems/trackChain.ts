import * as THREE from 'three'
import type { PlacedPiece, ChainExit } from '../types/game'
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

export function buildWorldPath(pieces: PlacedPiece[]): THREE.Vector3[] {
  const allPoints: THREE.Vector3[] = []

  for (const piece of pieces) {
    const template = TRACK_TEMPLATES[piece.type]
    const piecePos = new THREE.Vector3(...piece.position)
    const pieceQuat = new THREE.Quaternion(...piece.quaternion)

    const localPoints = template.centerPath
    const worldPoints = localPoints.map((lp) =>
      lp.clone().applyQuaternion(pieceQuat).add(piecePos)
    )

    if (allPoints.length > 0) {
      // skip the first point of each subsequent piece (duplicate of previous exit)
      allPoints.push(...worldPoints.slice(1))
    } else {
      allPoints.push(...worldPoints)
    }
  }

  return allPoints
}

export function isLoopClosable(pieces: PlacedPiece[], threshold = 0.3): boolean {
  if (pieces.length < 4) return false
  const exit = computeChainExit(pieces)
  const start = new THREE.Vector3(...pieces[0].position)
  return exit.position.distanceTo(start) < threshold
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
