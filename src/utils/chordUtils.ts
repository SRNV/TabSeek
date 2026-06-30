import { Note } from 'tonal'

export function romanToDegree(roman: string): { degree: number; isMajor: boolean; base: string; alteration: number; stripped: string } {
  let alteration = 0
  let stripped = roman
  if (stripped.startsWith('b')) { alteration = -1; stripped = stripped.slice(1) }
  else if (stripped.startsWith('#')) { alteration = 1; stripped = stripped.slice(1) }

  const upper: Record<string, number> = { 'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7 }
  const lower: Record<string, number> = { 'i':1,'ii':2,'iii':3,'iv':4,'v':5,'vi':6,'vii':7 }
  const base    = stripped.match(/^([IVXivx]+)/)?.[1] ?? ''
  const isMajor = base === base.toUpperCase()
  const degree  = (isMajor ? upper : lower)[base] ?? 1
  return { degree, isMajor, base, alteration, stripped }
}

function applyAlteration(notePc: string, alteration: number): string {
  if (alteration === 0) return notePc
  const midi = Note.midi(notePc + '4')
  if (midi === null || midi === undefined) return notePc
  return Note.pitchClass(Note.fromMidi(midi + alteration))
}

export function getMajorScaleNotes(rootPc: string): string[] {
  return ['1P','2M','3M','4P','5P','6M','7M'].map(iv =>
    Note.pitchClass(Note.transpose(rootPc, iv))
  )
}

export function numeralToChordName(numeral: string, scalePc: string): string {
  const scaleNotes = getMajorScaleNotes(scalePc)
  const { degree, isMajor, base, alteration, stripped } = romanToDegree(numeral)
  const root = applyAlteration(scaleNotes[(degree - 1) % 7], alteration)
  const mods = stripped.slice(base.length)
  let name = root
  if (mods.includes('°') || mods.includes('dim'))                       name += 'dim'
  else if (mods.includes('+') || mods.includes('aug'))                  name += 'aug'
  else if (mods.includes('maj7'))                                        name += isMajor ? 'maj7' : 'mMaj7'
  else if (mods.includes('m7b5') || mods.includes('ø') || mods.includes('Ø')) name += 'm7b5'
  else if (mods.includes('7'))                                           name += isMajor ? '7' : 'm7'
  else if (mods.includes('6'))                                           name += isMajor ? '6' : 'm6'
  else if (!isMajor)                                                     name += 'm'
  return name
}
