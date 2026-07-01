import { useState, useRef } from 'react'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { stopAllSounds, setMasterVolume, getMasterVolume } from '../hooks/useAudio'
import { BEATS_PER_MEAS } from '../utils/tabUtils'

export default function PlaybackFooter() {
  const {
    notes,
    isPlaying, playbackBeat, togglePlayback, setPlaybackBeat,
    tempo, setTempo, isLooping, setLooping, isFollowing, setFollowing,
  } = useTablatureR3FStore()

  const rawMaxBeat = notes.length > 0 ? Math.max(...notes.map(n => n.startBeat + n.duration)) : 0
  const maxBeat    = Math.ceil(rawMaxBeat / BEATS_PER_MEAS) * BEATS_PER_MEAS

  const [volPct, setVolPct] = useState(() => Math.round(getMasterVolume() * 100))
  const [muted, setMuted]   = useState(false)
  const prevVolRef = useRef(volPct || 100)

  function handleVolumeChange(v: number) {
    setVolPct(v)
    setMasterVolume(v / 100)
    if (v > 0) setMuted(false)
  }

  function toggleMute() {
    if (muted || volPct === 0) {
      const restore = prevVolRef.current || 100
      setVolPct(restore)
      setMasterVolume(restore / 100)
      setMuted(false)
    } else {
      prevVolRef.current = volPct
      setVolPct(0)
      setMasterVolume(0)
      setMuted(true)
    }
  }

  const volIcon = (muted || volPct === 0) ? 'volume_off' : volPct <= 50 ? 'volume_down' : 'volume_up'

  return (
    <div className="tab-playback-footer">
      <div className="playback-btns">
        <button className="ctrl-btn play-btn" onClick={() => {
          if (isPlaying) {
            stopAllSounds()
          } else {
            if (playbackBeat >= maxBeat - 0.01) setPlaybackBeat(0)
          }
          togglePlayback()
        }}>
          <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <button className="ctrl-btn stop-btn" onClick={() => {
          if (isPlaying) togglePlayback()
          stopAllSounds()
          setPlaybackBeat(0)
        }}>
          <span className="material-symbols-outlined">stop</span>
        </button>
        <button
          className={`ctrl-btn loop-btn${isLooping ? ' active' : ''}`}
          onClick={() => setLooping(!isLooping)}
          title="Loop"
        >
          <span className="material-symbols-outlined">repeat</span>
        </button>
        <button
          className={`ctrl-btn follow-btn${isFollowing ? ' active' : ''}`}
          onClick={() => setFollowing(!isFollowing)}
          title="Follow Playback"
        >
          <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
        </button>

        <div className="volume-ctrl">
          <button className="ctrl-btn" onClick={toggleMute} title="Volume">
            <span className="material-symbols-outlined">{volIcon}</span>
          </button>
          <div className="volume-slider-popup">
            <span className="vol-pct">{volPct}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volPct}
              onChange={e => handleVolumeChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="tempo-section">
        <input
          type="number"
          className="tempo-input"
          value={tempo}
          onChange={e => setTempo(Math.max(1, parseInt(e.target.value) || 1))}
        />
        <span className="bpm-label">BPM</span>
      </div>
    </div>
  )
}
