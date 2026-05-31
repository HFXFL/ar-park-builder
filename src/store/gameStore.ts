import { create } from 'zustand'
import * as THREE from 'three'
import type { GamePhase, BuildMode, PlacedPiece, TrackPieceType, ChainExit } from '../types/game'
import {
  computeChainExit,
  INITIAL_CHAIN_EXIT,
  nextPiecePlacement,
} from '../systems/trackChain'
import { TRACK_TEMPLATES } from '../systems/trackTemplates'

interface GameStore {
  phase: GamePhase
  buildMode: BuildMode
  selectedTool: TrackPieceType | null
  placedPieces: PlacedPiece[]

  // Two separate chain exits — footpath and ride track
  pathChainExit: ChainExit
  rideChainExit: ChainExit

  // Unlocks RIDE toolbar tab
  hasRideEntrance: boolean

  isARMode: boolean
  parkOrigin: THREE.Vector3 | null

  setPhase: (p: GamePhase) => void
  setBuildMode: (m: BuildMode) => void
  setSelectedTool: (t: TrackPieceType | null) => void
  setParkOrigin: (v: THREE.Vector3) => void
  placeNextPiece: (type: TrackPieceType) => void
  undoLastPiece: () => void
  resetTrack: () => void
  setARMode: (v: boolean) => void
}

function computeExitForPieces(pieces: PlacedPiece[]): ChainExit {
  return pieces.length > 0 ? computeChainExit(pieces) : INITIAL_CHAIN_EXIT
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'landing',
  buildMode: 'path',
  selectedTool: null,
  placedPieces: [],
  pathChainExit: INITIAL_CHAIN_EXIT,
  rideChainExit: INITIAL_CHAIN_EXIT,
  hasRideEntrance: false,
  isARMode: false,
  parkOrigin: null,

  setPhase: (phase) => set({ phase }),
  setBuildMode: (buildMode) => set({ buildMode }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),

  setParkOrigin: (origin) => {
    const template = TRACK_TEMPLATES['park-entrance']
    const initQuat = new THREE.Quaternion()
    const exitQ = new THREE.Quaternion().setFromEuler(template.exitEuler)
    const pathExit: ChainExit = {
      position: origin.clone().add(template.exitOffset.clone()),
      quaternion: initQuat.clone().multiply(exitQ),
    }
    const gatePiece: PlacedPiece = {
      id: crypto.randomUUID(),
      type: 'park-entrance',
      position: [origin.x, origin.y, origin.z],
      quaternion: [initQuat.x, initQuat.y, initQuat.z, initQuat.w],
    }
    set({
      parkOrigin: origin,
      placedPieces: [gatePiece],
      pathChainExit: pathExit,
      rideChainExit: INITIAL_CHAIN_EXIT,
      hasRideEntrance: false,
      buildMode: 'path',
      phase: 'building',
      selectedTool: 'path-straight',
    })
  },

  placeNextPiece: (type) => {
    const { buildMode, pathChainExit, rideChainExit, placedPieces } = get()

    // Ride-entrance is always placed from the path chain exit
    const usePathChain = buildMode === 'path' || type === 'ride-entrance'
    const chainExit = usePathChain ? pathChainExit : rideChainExit

    const placement = nextPiecePlacement(chainExit)
    const newPiece: PlacedPiece = {
      id: crypto.randomUUID(),
      type,
      ...placement,
    }
    const updated = [...placedPieces, newPiece]

    if (type === 'ride-entrance') {
      // Placing ride-entrance: update path chain AND seed the ride chain from its exit
      const template = TRACK_TEMPLATES['ride-entrance']
      const pieceQuat = new THREE.Quaternion(...newPiece.quaternion)
      const exitQuat = new THREE.Quaternion().setFromEuler(template.exitEuler)
      const newRideExit: ChainExit = {
        position: new THREE.Vector3(...newPiece.position)
          .add(template.exitOffset.clone().applyQuaternion(pieceQuat)),
        quaternion: pieceQuat.clone().multiply(exitQuat),
      }
      set({
        placedPieces: updated,
        pathChainExit: computeExitForPieces(
          updated.filter((p) =>
            ['park-entrance', 'path-straight', 'path-curve-left', 'path-curve-right'].includes(p.type)
          )
        ),
        rideChainExit: newRideExit,
        hasRideEntrance: true,
        buildMode: 'ride',
        selectedTool: 'straight',
      })
    } else if (buildMode === 'path') {
      // Extending footpath
      const pathPieces = updated.filter((p) =>
        ['park-entrance', 'path-straight', 'path-curve-left', 'path-curve-right'].includes(p.type)
      )
      set({
        placedPieces: updated,
        pathChainExit: computeExitForPieces(pathPieces),
      })
    } else {
      // Extending ride track
      const ridePieces = updated.filter((p) =>
        ['ride-entrance', 'straight', 'curve-left', 'curve-right', 'incline', 'decline', 'station'].includes(p.type)
      )
      set({
        placedPieces: updated,
        rideChainExit: computeExitForPieces(ridePieces),
      })
    }
  },

  undoLastPiece: () => {
    const { placedPieces, buildMode } = get()
    // Can't undo the park entrance
    if (placedPieces.length <= 1) return

    const last = placedPieces[placedPieces.length - 1]
    const trimmed = placedPieces.slice(0, -1)

    // If undoing ride-entrance, switch back to path mode and lock ride tab
    if (last.type === 'ride-entrance') {
      const pathPieces = trimmed.filter((p) =>
        ['park-entrance', 'path-straight', 'path-curve-left', 'path-curve-right'].includes(p.type)
      )
      set({
        placedPieces: trimmed,
        pathChainExit: computeExitForPieces(pathPieces),
        rideChainExit: INITIAL_CHAIN_EXIT,
        hasRideEntrance: false,
        buildMode: 'path',
        selectedTool: 'path-straight',
      })
      return
    }

    if (buildMode === 'path') {
      const pathPieces = trimmed.filter((p) =>
        ['park-entrance', 'path-straight', 'path-curve-left', 'path-curve-right'].includes(p.type)
      )
      set({ placedPieces: trimmed, pathChainExit: computeExitForPieces(pathPieces) })
    } else {
      const ridePieces = trimmed.filter((p) =>
        ['ride-entrance', 'straight', 'curve-left', 'curve-right', 'incline', 'decline', 'station'].includes(p.type)
      )
      set({ placedPieces: trimmed, rideChainExit: computeExitForPieces(ridePieces) })
    }
  },

  resetTrack: () => {
    const { parkOrigin } = get()
    if (!parkOrigin) {
      set({
        placedPieces: [],
        pathChainExit: INITIAL_CHAIN_EXIT,
        rideChainExit: INITIAL_CHAIN_EXIT,
        hasRideEntrance: false,
        buildMode: 'path',
        phase: 'place-park-entrance',
        selectedTool: null,
      })
      return
    }
    get().setParkOrigin(parkOrigin)
  },

  setARMode: (isARMode) => set({ isARMode }),
}))
