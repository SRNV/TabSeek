import { Note } from 'tonal'

export function romanToDegree(roman: string): { degree: number; isMajor: boolean; base: string } {
  const upper: Record<string, number> = { 'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7 }
  const lower: Record<string, number> = { 'i':1,'ii':2,'iii':3,'iv':4,'v':5,'vi':6,'vii':7 }
  const base    = roman.match(/^([IVXivx]+)/)?.[1] ?? ''
  const isMajor = base === base.toUpperCase()
  const degree  = (isMajor ? upper : lower)[base] ?? 1
  return { degree, isMajor, base }
}

export function getMajorScaleNotes(rootPc: string): string[] {
  return ['1P','2M','3M','4P','5P','6M','7M'].map(iv =>
    Note.pitchClass(Note.transpose(rootPc, iv))
  )
}

export function numeralToChordName(numeral: string, scalePc: string): string {
  const scaleNotes = getMajorScaleNotes(scalePc)
  const { degree, isMajor, base } = romanToDegree(numeral)
  const root = scaleNotes[(degree - 1) % 7]
  const mods = numeral.slice(base.length)
  let name = root
  if (mods.includes('°') || mods.includes('dim'))       name += 'dim'
  else if (mods.includes('+') || mods.includes('aug'))  name += 'aug'
  else if (mods.includes('maj7'))  name += isMajor ? 'maj7' : 'mMaj7'
  else if (mods.includes('m7b5') || mods.includes('Ø')) name += 'm7b5'
  else if (mods.includes('7'))     name += isMajor ? '7' : 'm7'
  else if (mods.includes('6'))     name += isMajor ? '6' : 'm6'
  else if (!isMajor)               name += 'm'
  return name
}
