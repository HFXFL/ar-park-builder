import { create } from 'zustand'
import * as THREE from 'three'
import type { GamePhase, PlacedPiece, TrackPieceType, ChainExit } from '../types/game'
import {
  computeChainExit,
  INITIAL_CHAIN_EXIT,
  nextPiecePlacement,
} from '../systems/trackChain'
import { TRACK_TEMPLATES } from '../systems/trackTemplates'

interface GameStore {
  phase: GamePhase
  selectedTool: TrackPieceType | null
  placedPieces: PlacedPiece[]
  chainExit: ChainExit
  isARMode: boolean
  parkOrigin: THREE.Vector3 | null

  setPhase: (p: GamePhase) => void
  setSelectedTool: (t: TrackPieceType | null) => void
  setParkOrigin: (v: THREE.Vector3) => void
  placeNextPiece: (type: TrackPieceType) => void
  undoLastPiece: () => void
  resetTrack: () => void
  setARMode: (v: boolean) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'landing',
  selectedTool: null,
  placedPieces: [],
  chainExit: INITIAL_CHAIN_EXIT,
  isARMode: false,
  parkOrigin: null,

  setPhase: (phase) => set({ phase }),

  setSelectedTool: (selectedTool) => set({ selectedTool }),

  setParkOrigin: (origin) => {
    const entrance = TRACK_TEMPLATES['entrance']
    const initQuat = new THREE.Quaternion()
    const exitQ = new THREE.Quaternion().setFromEuler(entrance.exitEuler)
    const firstExit: ChainExit = {
      position: origin.clone().add(entrance.exitOffset.clone()),
      quaternion: initQuat.clone().multiply(exitQ),
    }
    const firstPiece: PlacedPiece = {
      id: crypto.randomUUID(),
      type: 'entrance',
      position: [origin.x, origin.y, origin.z],
      quaternion: [initQuat.x, initQuat.y, initQuat.z, initQuat.w],
    }
    set({
      parkOrigin: origin,
      placedPieces: [firstPiece],
      chainExit: firstExit,
      phase: 'building',
      selectedTool: 'straight',
    })
  },

  placeNextPiece: (type) => {
    const { chainExit, placedPieces } = get()
    const placement = nextPiecePlacement(chainExit)
    const newPiece: PlacedPiece = {
      id: crypto.randomUUID(),
      type,
      ...placement,
    }
    const updated = [...placedPieces, newPiece]
    set({
      placedPieces: updated,
      chainExit: computeChainExit(updated),
    })
  },

  undoLastPiece: () => {
    const { placedPieces } = get()
    if (placedPieces.length <= 1) return
    const trimmed = placedPieces.slice(0, -1)
    set({
      placedPieces: trimmed,
      chainExit: computeChainExit(trimmed),
    })
  },

  resetTrack: () => {
    const { parkOrigin } = get()
    if (!parkOrigin) {
      set({
        placedPieces: [],
        chainExit: INITIAL_CHAIN_EXIT,
        phase: 'place-entrance',
        selectedTool: null,
      })
      return
    }
    get().setParkOrigin(parkOrigin)
  },

  setARMode: (isARMode) => set({ isARMode }),
}))
