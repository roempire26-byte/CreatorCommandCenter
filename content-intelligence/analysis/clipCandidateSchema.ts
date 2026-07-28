import { z } from 'zod'

export const clipCandidateSuggestionSchema = z.object({
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  title: z.string().min(1).max(120),
  reason: z.string().min(1).max(300),
  hookStrength: z.number().min(0).max(1),
  emotionalIntensity: z.number().min(0).max(1),
  contextCompleteness: z.number().min(0).max(1),
  replayValue: z.number().min(0).max(1)
})

export const clipCandidateSuggestionsSchema = z.object({
  candidates: z.array(clipCandidateSuggestionSchema).max(8)
})

export type ClipCandidateSuggestion = z.infer<typeof clipCandidateSuggestionSchema>
