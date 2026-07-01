import { useState, useRef, useEffect } from 'react'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useProjectAutoSave } from '../hooks/useProjectAutoSave'
import { ProjectSerializerService } from '../services/ProjectSerializerService'
import { TablaturePDFService } from '../services/TablaturePDFService'

export default function ProjectHeader() {
  const { projectName, isProjectDirty, importProject, setProjectName } = useTablatureR3FStore()
  const [renamingProject, setRenamingProject] = useState(false)
  const [nameInput, setNameInput]             = useState(projectName)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useProjectAutoSave()

  // Sync nameInput when projectName changes externally (load)
  useEffect(() => {
    if (!renamingProject) setNameInput(projectName)
  }, [projectName, renamingProject])

  // Sync document title
  useEffect(() => {
    document.title = `${isProjectDirty ? '● ' : ''}${projectName} — TabSeek`
  }, [projectName, isProjectDirty])

  function commitRename() {
    const trimmed = nameInput.trim()
    if (trimmed) setProjectName(trimmed)
    else setNameInput(projectName)
    setRenamingProject(false)
  }

  function handleSave() {
    const r3f    = useTablatureR3FStore.getState()
    const tuning = useTablatureStore.getState().tuning
    const data   = ProjectSerializerService.serialize(
      {
        notes:             r3f.notes,
        chordGroups:       r3f.chordGroups,
        progressionGroups: r3f.progressionGroups,
        rhythmModifiers:   r3f.rhythmModifiers,
        modeZones:         r3f.modeZones,
        tempo:             r3f.tempo,
        projectName:       r3f.projectName,
      },
      tuning
    )
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${r3f.projectName.replace(/[^a-z0-9_\-]/gi, '_')}.tabseek`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ProjectSerializerService.deserialize(ev.target?.result as string)
      if (result.ok) {
        importProject(result.data)
        if (result.data.settings.tuning) {
          useTablatureStore.setState({ tuning: result.data.settings.tuning })
        }
      } else {
        alert(`Impossible d'ouvrir le projet :\n${result.error}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="tab-project-header">
      <div className="project-toolbar">
        <button className="ctrl-btn" onClick={handleSave} title="Sauvegarder le projet (.tabseek)">
          <span className="material-symbols-outlined">save</span>
        </button>
        <button className="ctrl-btn" onClick={() => fileInputRef.current?.click()} title="Ouvrir un projet">
          <span className="material-symbols-outlined">folder_open</span>
        </button>
        <button
          className="ctrl-btn"
          title="Exporter en PDF"
          onClick={() => {
            const r3f = useTablatureR3FStore.getState()
            TablaturePDFService.generatePDF({
              version:           1,
              name:              r3f.projectName,
              createdAt:         new Date().toISOString(),
              updatedAt:         new Date().toISOString(),
              settings:          { tuning: useTablatureStore.getState().tuning, tempo: r3f.tempo },
              notes:             r3f.notes,
              chordGroups:       r3f.chordGroups,
              progressionGroups: r3f.progressionGroups,
              rhythmModifiers:   r3f.rhythmModifiers,
              modeZones:         r3f.modeZones,
            })
          }}
        >
          <span className="material-symbols-outlined">picture_as_pdf</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".tabseek,.json"
          style={{ display: 'none' }}
          onChange={handleFileLoad}
        />
        {renamingProject ? (
          <input
            ref={nameInputRef}
            className="project-name-input"
            value={nameInput}
            autoFocus
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitRename() }
              if (e.key === 'Escape') { setNameInput(projectName); setRenamingProject(false) }
            }}
          />
        ) : (
          <span
            className={`project-name${isProjectDirty ? ' dirty' : ''}`}
            title="Double-cliquer pour renommer"
            onDoubleClick={() => { setNameInput(projectName); setRenamingProject(true) }}
          >
            {isProjectDirty ? `● ${projectName}` : projectName}
          </span>
        )}
      </div>
    </div>
  )
}
