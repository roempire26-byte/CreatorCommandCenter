import { z } from 'zod'

export const clipCandidateSuggestionSchema = z.object({
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  title: z.string().min(1).max(120),
  reason: z.string().min(1).max(300)
})

export const clipCandidateSuggestionsSchema = z.object({
  candidates: z.array(clipCandidateSuggestionSchema).max(8)
})

export type ClipCandidateSuggestion = z.infer<typeof clipCandidateSuggestionSchema>
