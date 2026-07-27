import { useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { Modal } from '@renderer/components/Modal'
import { buttonClassName } from '@renderer/components/Button'
import { clipCandidateTone, vodStatusLabel, vodTone } from '@renderer/lib/statusTones'
import { formatDateTime, formatTimestamp } from '@renderer/lib/format'
import type { ClipCandidate, Vod } from '@shared/schemas'
import formStyles from '@renderer/components/forms/Form.module.css'
import styles from './Clips.module.css'

export function Clips(): JSX.Element {
  const [vods, setVods] = useState<Vod[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [transcribingId, setTranscribingId] = useState<string | null>(null)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [reviewVod, setReviewVod] = useState<Vod | null>(null)
  const [candidates, setCandidates] = useState<ClipCandidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null)
  const [candidateError, setCandidateError] = useState<string | null>(null)

  useEffect(() => {
    window.commandCenter.vod.list().then((result) => {
      setVods(result)
      setLoading(false)
    })
  }, [])

  async function handleSelect(): Promise<void> {
    setSelecting(true)
    try {
      const vod = await window.commandCenter.vod.selectFile()
      if (vod) setVods((prev) => [vod, ...prev])
    } finally {
      setSelecting(false)
    }
  }

  async function handleExtract(id: string): Promise<void> {
    setExtractingId(id)
    try {
      const updated = await window.commandCenter.vod.extractAudio(id)
      setVods((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } finally {
      setExtractingId(null)
    }
  }

  async function handleTranscribe(id: string): Promise<void> {
    setTranscribingId(id)
    setTranscribeError(null)
    try {
      const updated = await window.commandCenter.vod.transcribe(id)
      setVods((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : "Couldn't transcribe — try again.")
    } finally {
      setTranscribingId(null)
    }
  }

  async function handleAnalyze(id: string): Promise<void> {
    setAnalyzingId(id)
    setAnalyzeError(null)
    try {
      const updated = await window.commandCenter.vod.analyze(id)
      setVods((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Couldn't analyze — try again.")
    } finally {
      setAnalyzingId(null)
    }
  }

  async function handleOpenReview(vod: Vod): Promise<void> {
    setReviewVod(vod)
    setCandidateError(null)
    setCandidatesLoading(true)
    try {
      const result = await window.commandCenter.clip.listForVod(vod.id)
      setCandidates(result)
    } finally {
      setCandidatesLoading(false)
    }
  }

  function handleCloseReview(): void {
    setReviewVod(null)
    setCandidates([])
  }

  async function handleCandidateStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    setUpdatingCandidateId(id)
    setCandidateError(null)
    try {
      const updated = await window.commandCenter.clip.updateStatus(id, status)
      setCandidates((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      setCandidateError(err instanceof Error ? err.message : "Couldn't update — try again.")
    } finally {
      setUpdatingCandidateId(null)
    }
  }

  return (
    <div className={styles.wrap}>
      <Card title="Select a recording" subtitle="Pick a local video file to add it to your VOD library">
        <p className={styles.hint}>
          Nothing is copied or uploaded — the app only remembers where the file already is on this machine.
        </p>
        <button type="button" className={buttonClassName('primary')} onClick={handleSelect} disabled={selecting}>
          {selecting ? 'Waiting for file…' : 'Select a VOD'}
        </button>
      </Card>

      <Card title="VOD library" subtitle="Every recording you've added">
        {transcribeError && <p className={formStyles.error}>{transcribeError}</p>}
        {analyzeError && <p className={formStyles.error}>{analyzeError}</p>}
        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : vods.length === 0 ? (
          <EmptyState icon="▶" title="No VODs yet" description="Select a local recording above to add it here." />
        ) : (
          <div className={styles.vodList}>
            {vods.map((vod) => (
              <div className={styles.vodRow} key={vod.id}>
                <div className={styles.vodLeft}>
                  <span className={styles.vodFilename}>{vod.filename}</span>
                  <span className={styles.vodMeta}>Added {formatDateTime(vod.createdAt)}</span>
                </div>
                <div className={styles.vodRight}>
                  {(vod.status === 'pending' || vod.status === 'failed') && (
                    <button
                      type="button"
                      className={buttonClassName('secondary')}
                      onClick={() => handleExtract(vod.id)}
                      disabled={extractingId === vod.id}
                    >
                      {extractingId === vod.id ? 'Extracting…' : vod.status === 'failed' ? 'Retry' : 'Extract audio'}
                    </button>
                  )}
                  {vod.status === 'processing' && vod.transcript == null && (
                    <button
                      type="button"
                      className={buttonClassName('secondary')}
                      onClick={() => handleTranscribe(vod.id)}
                      disabled={transcribingId === vod.id}
                    >
                      {transcribingId === vod.id ? 'Transcribing…' : 'Transcribe'}
                    </button>
                  )}
                  {vod.status === 'processing' && vod.transcript != null && (
                    <button
                      type="button"
                      className={buttonClassName('secondary')}
                      onClick={() => handleAnalyze(vod.id)}
                      disabled={analyzingId === vod.id}
                    >
                      {analyzingId === vod.id ? 'Analyzing…' : 'Analyze'}
                    </button>
                  )}
                  {vod.status === 'analyzed' && (
                    <button type="button" className={buttonClassName('secondary')} onClick={() => handleOpenReview(vod)}>
                      Review clips
                    </button>
                  )}
                  <StatusPill
                    tone={vodTone(vod.status)}
                    label={vodStatusLabel(vod)}
                    pulse={extractingId === vod.id || transcribingId === vod.id || analyzingId === vod.id}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {reviewVod && (
        <Modal title={`Clip candidates — ${reviewVod.filename}`} onClose={handleCloseReview}>
          {candidateError && <p className={formStyles.error}>{candidateError}</p>}
          {candidatesLoading ? (
            <p className={styles.hint}>Loading…</p>
          ) : candidates.length === 0 ? (
            <EmptyState icon="✂" title="No clip candidates" description="Claude didn't suggest any moments for this recording." />
          ) : (
            <div className={styles.candidateList}>
              {candidates.map((candidate) => (
                <div className={styles.candidateRow} key={candidate.id}>
                  <div className={styles.candidateLeft}>
                    <span className={styles.candidateTitle}>{candidate.title}</span>
                    {candidate.reason && <span className={styles.candidateReason}>{candidate.reason}</span>}
                    <span className={styles.candidateMeta}>
                      {formatTimestamp(candidate.startSeconds)}–{formatTimestamp(candidate.endSeconds)}
                    </span>
                  </div>
                  <div className={styles.candidateRight}>
                    {candidate.status === 'recommended' && (
                      <>
                        <button
                          type="button"
                          className={buttonClassName('secondary')}
                          onClick={() => handleCandidateStatus(candidate.id, 'approved')}
                          disabled={updatingCandidateId === candidate.id}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className={buttonClassName('danger')}
                          onClick={() => handleCandidateStatus(candidate.id, 'rejected')}
                          disabled={updatingCandidateId === candidate.id}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <StatusPill tone={clipCandidateTone(candidate.status)} label={candidate.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
