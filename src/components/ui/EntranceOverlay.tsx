interface Props {
  isARMode: boolean
}

export function EntranceOverlay({ isARMode }: Props) {
  return (
    <div className="entrance-overlay">
      <div className="entrance-card">
        <h2>Place Your Park Entrance</h2>
        <p>
          {isARMode
            ? 'Point your camera at a flat surface — floor or table — then tap to place your park entrance.'
            : 'Tap anywhere on the ground grid to place your park entrance.'}
        </p>
        <div className="entrance-tap-hint">
          <div className="pulse-dot" />
          Tap to place entrance
        </div>
      </div>
    </div>
  )
}
