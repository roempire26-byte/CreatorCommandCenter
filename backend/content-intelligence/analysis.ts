import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { DbHandle } from '@database/db'
import { getVod, updateVodStatus } from '@database/repositories/vods'
import { createClipCandidate, listFeedbackHistory } from '@database/repositories/clip-candidates'
import type { Vod } from '@shared/schemas'
import { buildAnalysisPrompt } from '@content-intelligence/analysis/buildPrompt'
import {
  clipCandidateSuggestionsSchema,
  type ClipCandidateSuggestion
} from '@content-intelligence/analysis/clipCandidateSchema'
import { computeOverallScore } from '@content-intelligence/analysis/computeOverallScore'
import { buildPreferenceDigest } from '@content-intelligence/analysis/buildPreferenceDigest'
import { logActivity } from '../activity-log'

// Cheap/fast tier, not the general Opus default — this is a classification-style task
// (pick candidate moments from a transcript), and Sprint 1's own risk notes call out model
// tier as a real cost lever worth using deliberately, same rationale as picking Whisper over
// a heavier transcription option.
const MODEL = 'claude-haiku-4-5'

async function callClaude(
  transcript: string,
  apiKey: string,
  preferenceDigest?: string
): Promise<ClipCandidateSuggestion[]> {
  const client = new Anthropic({ apiKey })
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildAnalysisPrompt(transcript, preferenceDigest) }],
    output_format: betaZodOutputFormat(clipCandidateSuggestionsSchema)
  })

  if (!response.parsed_output) {
    throw new Error("Claude didn't return a parsable response.")
  }

  return response.parsed_output.candidates
}

// Mirrors transcription.ts's runTranscription shape: catches its own failures, persists them
// onto the entity's status plus the activity log, always returns the entity rather than
// throwing (except "VOD not found"/"no transcript"). Status moves to 'analyzed' on success —
// this is the first place in the pipeline that sets it, since it's the point where
// ClipCandidate rows actually exist to review. On failure, status moves to 'failed', same as
// every other stage; retrying always means re-running this step (the transcript is already
// there, so no earlier work is lost).
export async function runAnalysis(handle: DbHandle, vodId: string, apiKey: string): Promise<Vod> {
  const vod = getVod(handle, vodId)
  if (!vod) throw new Error('VOD not found')
  if (!vod.transcript) throw new Error('This VOD has no transcript yet.')

  try {
    const preferenceDigest = buildPreferenceDigest(
      listFeedbackHistory(handle).map((c) => ({
        status: c.status as 'approved' | 'rejected',
        overallScore: c.overallScore,
        feedbackNote: c.feedbackNote
      }))
    )
    const candidates = await callClaude(vod.transcript, apiKey, preferenceDigest)
    for (const candidate of candidates) {
      const overallScore = computeOverallScore(
        candidate.hookStrength,
        candidate.emotionalIntensity,
        candidate.contextCompleteness,
        candidate.replayValue
      )
      createClipCandidate(handle, {
        vodId,
        startSeconds: Math.round(candidate.startSeconds),
        endSeconds: Math.round(candidate.endSeconds),
        title: candidate.title,
        reason: candidate.reason,
        hookStrength: candidate.hookStrength,
        emotionalIntensity: candidate.emotionalIntensity,
        contextCompleteness: candidate.contextCompleteness,
        replayValue: candidate.replayValue,
        overallScore
      })
    }
    updateVodStatus(handle, vodId, 'analyzed')
    logActivity(handle, {
      category: 'vod',
      action: 'analyzed',
      status: 'success',
      detail: `${candidates.length} clip candidate(s) — ${vod.filename}`
    })
    return getVod(handle, vodId) ?? vod
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const failed = updateVodStatus(handle, vodId, 'failed')
    logActivity(handle, { category: 'vod', action: 'analysis-failed', status: 'danger', detail })
    return failed ?? vod
  }
}
