import { create } from 'zustand'
import * as THREE from 'three'
import type { GamePhase, BuildMode, PlacedPiece, TrackPieceType, ChainExit } from '../types/game'
import {
  computeChainExit,
  INITIAL_CHAIN_EXIT,
  nextPiecePlacement,
} from '../systems/trackChain'
import { TRACK_TEMPLATES } from '../systems/trackTemplates'

/** Snap a world coordinate to the nearest 0.5-unit grid cell */
function snapToGrid(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    Math.round(v.x * 2) / 2,
    0,
    Math.round(v.z * 2) / 2
  )
}

interface GameStore {
  phase: GamePhase
  buildMode: BuildMode
  selectedTool: TrackPieceType | null
  placedPieces: PlacedPiece[]

  // Two separate chain exits — footpath and ride track
  pathChainExit: ChainExit
  rideChainExit: ChainExit

  // Hover position on the ground grid (drives ghost preview in path mode)
  hoverGridPos: THREE.Vector3 | null

  // Unlocks RIDE toolbar tab
  hasRideEntrance: boolean

  isARMode: boolean
  parkOrigin: THREE.Vector3 | null

  setPhase: (p: GamePhase) => void
  setBuildMode: (m: BuildMode) => void
  setSelectedTool: (t: TrackPieceType | null) => void
  setParkOrigin: (v: THREE.Vector3) => void
  setHoverGridPos: (v: THREE.Vector3 | null) => void

  /** Place selected path piece wherever the user tapped on the ground */
  placePathAtPoint: (worldPoint: THREE.Vector3) => void

  /** Place ride-track piece at chain exit (classic chain snapping) */
  placeNextPiece: (type: TrackPieceType) => void

  undoLastPiece: () => void
  resetTrack: () => void
  setARMode: (v: boolean) => void
}

function computeExitForPieces(pieces: PlacedPiece[]): ChainExit {
  return pieces.length > 0 ? computeChainExit(pieces) : INITIAL_CHAIN_EXIT
}

const PATH_PIECE_TYPES = ['park-entrance', 'path-straight', 'path-curve-left', 'path-curve-right'] as const

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'landing',
  buildMode: 'path',
  selectedTool: null,
  placedPieces: [],
  pathChainExit: INITIAL_CHAIN_EXIT,
  rideChainExit: INITIAL_CHAIN_EXIT,
  hoverGridPos: null,
  hasRideEntrance: false,
  isARMode: false,
  parkOrigin: null,

  setPhase: (phase) => set({ phase }),
  setBuildMode: (buildMode) => set({ buildMode }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setHoverGridPos: (hoverGridPos) => set({ hoverGridPos }),

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

  // ── Free path placement (tap anywhere on ground) ─────────────────────────
  placePathAtPoint: (worldPoint) => {
    const { buildMode, selectedTool, placedPieces, pathChainExit, hasRideEntrance } = get()
    if (buildMode !== 'path' || !selectedTool) return

    const type = selectedTool
    const snapped = snapToGrid(worldPoint)

    if (type === 'ride-entrance') {
      // Ride entrance bridges path→track: place at snapped ground pos, seed ride chain
      const template = TRACK_TEMPLATES['ride-entrance']
      // Inherit path chain orientation but teleport to tapped position
      const pieceQuat = pathChainExit.quaternion.clone()
      const exitQuat = new THREE.Quaternion().setFromEuler(template.exitEuler)
      const newPiece: PlacedPiece = {
        id: crypto.randomUUID(),
        type,
        position: [snapped.x, snapped.y, snapped.z],
        quaternion: [pieceQuat.x, pieceQuat.y, pieceQuat.z, pieceQuat.w],
      }
      const newRideExit: ChainExit = {
        position: snapped.clone().add(
          template.exitOffset.clone().applyQuaternion(pieceQuat)
        ),
        quaternion: pieceQuat.clone().multiply(exitQuat),
      }
      const updated = [...placedPieces, newPiece]
      set({
        placedPieces: updated,
        pathChainExit: computeExitForPieces(
          updated.filter((p) => PATH_PIECE_TYPES.includes(p.type as typeof PATH_PIECE_TYPES[number]))
        ),
        rideChainExit: newRideExit,
        hasRideEntrance: true,
        buildMode: 'ride',
        selectedTool: 'straight',
      })
      return
    }

    // Regular footpath piece — place at snapped position, maintain chain direction
    const template = TRACK_TEMPLATES[type]
    const pieceQuat = pathChainExit.quaternion.clone()
    const exitQuat = new THREE.Quaternion().setFromEuler(template.exitEuler)

    const newPiece: PlacedPiece = {
      id: crypto.randomUUID(),
      type,
      position: [snapped.x, snapped.y, snapped.z],
      quaternion: [pieceQuat.x, pieceQuat.y, pieceQuat.z, pieceQuat.w],
    }

    const newPathExit: ChainExit = {
      position: snapped.clone().add(
        template.exitOffset.clone().applyQuaternion(pieceQuat)
      ),
      quaternion: pieceQuat.clone().multiply(exitQuat),
    }

    set({
      placedPieces: [...placedPieces, newPiece],
      pathChainExit: newPathExit,
    })
  },

  // ── Ride track chain placement (unchanged RCT-style snap) ─────────────────
  placeNextPiece: (type) => {
    const { buildMode, pathChainExit, rideChainExit, placedPieces } = get()

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
          updated.filter((p) => PATH_PIECE_TYPES.includes(p.type as typeof PATH_PIECE_TYPES[number]))
        ),
        rideChainExit: newRideExit,
        hasRideEntrance: true,
        buildMode: 'ride',
        selectedTool: 'straight',
      })
    } else if (buildMode === 'path') {
      const pathPieces = updated.filter((p) =>
        PATH_PIECE_TYPES.includes(p.type as typeof PATH_PIECE_TYPES[number])
      )
      set({
        placedPieces: updated,
        pathChainExit: computeExitForPieces(pathPieces),
      })
    } else {
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
    if (placedPieces.length <= 1) return

    const last = placedPieces[placedPieces.length - 1]
    const trimmed = placedPieces.slice(0, -1)

    if (last.type === 'ride-entrance') {
      const pathPieces = trimmed.filter((p) =>
        PATH_PIECE_TYPES.includes(p.type as typeof PATH_PIECE_TYPES[number])
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
        PATH_PIECE_TYPES.includes(p.type as typeof PATH_PIECE_TYPES[number])
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
        hoverGridPos: null,
      })
      return
    }
    get().setParkOrigin(parkOrigin)
  },

  setARMode: (isARMode) => set({ isARMode }),
}))
