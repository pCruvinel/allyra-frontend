const TECHNICAL_OPINION_HEADING = 'Parecer técnico:'
const RECOMMENDATIONS_HEADING = 'Recomendações para o próximo ciclo:'
const DEVOLUTIVA_NOTES_STORAGE_PREFIX = 'allyra:metas:devolutiva:'

export interface DevolutivaNotesContent {
  technicalOpinion: string
  recommendations: string
}

export function parseDevolutivaNotes(rawNotes?: string | null): DevolutivaNotesContent {
  const rawContent = rawNotes?.trim() || ''

  if (!rawContent) {
    return {
      technicalOpinion: '',
      recommendations: '',
    }
  }

  if (rawContent.startsWith(`${RECOMMENDATIONS_HEADING}\n`)) {
    return {
      technicalOpinion: '',
      recommendations: rawContent.slice(`${RECOMMENDATIONS_HEADING}\n`.length).trim(),
    }
  }

  let normalizedContent = rawContent

  if (normalizedContent.startsWith(`${TECHNICAL_OPINION_HEADING}\n`)) {
    normalizedContent = normalizedContent.slice(`${TECHNICAL_OPINION_HEADING}\n`.length)
  }

  const recommendationsMarker = `\n\n${RECOMMENDATIONS_HEADING}\n`
  const recommendationsIndex = normalizedContent.indexOf(recommendationsMarker)

  if (recommendationsIndex === -1) {
    return {
      technicalOpinion: normalizedContent.trim(),
      recommendations: '',
    }
  }

  return {
    technicalOpinion: normalizedContent.slice(0, recommendationsIndex).trim(),
    recommendations: normalizedContent
      .slice(recommendationsIndex + recommendationsMarker.length)
      .trim(),
  }
}

export function buildDevolutivaNotes({
  technicalOpinion,
  recommendations,
}: DevolutivaNotesContent): string | undefined {
  const normalizedTechnicalOpinion = technicalOpinion.trim()
  const normalizedRecommendations = recommendations.trim()

  if (!normalizedTechnicalOpinion && !normalizedRecommendations) {
    return undefined
  }

  const sections: string[] = []

  if (normalizedTechnicalOpinion) {
    sections.push(`${TECHNICAL_OPINION_HEADING}\n${normalizedTechnicalOpinion}`)
  }

  if (normalizedRecommendations) {
    sections.push(`${RECOMMENDATIONS_HEADING}\n${normalizedRecommendations}`)
  }

  return sections.join('\n\n')
}

export function getDevolutivaNotesStorageKey(planId: string): string {
  return `${DEVOLUTIVA_NOTES_STORAGE_PREFIX}${planId}`
}

export function readStoredDevolutivaNotes(planId: string): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const storedValue = window.localStorage.getItem(getDevolutivaNotesStorageKey(planId))
  return storedValue?.trim() || undefined
}

export function writeStoredDevolutivaNotes(planId: string, content?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const storageKey = getDevolutivaNotesStorageKey(planId)

  if (!content?.trim()) {
    window.localStorage.removeItem(storageKey)
    return
  }

  window.localStorage.setItem(storageKey, content)
}
