// Pure: turns a stored transcript into the user-turn prompt for the Claude clip-analysis call.
// No network or DB access; testable with plain input/output. The transcript's per-segment
// [m:ss–m:ss] timestamps (from formatTranscript.ts) are what let Claude anchor its
// startSeconds/endSeconds picks to real points in the recording. preferenceDigest is spliced in
// only when real approve/reject history exists (see buildPreferenceDigest) -- omitted entirely
// otherwise, rather than sending an empty or fabricated preference signal.
export function buildAnalysisPrompt(transcript: string, preferenceDigest?: string): string {
  return `You are reviewing a timestamped transcript of a streamer's recording to find moments \
worth cutting into short standalone clips — funny reactions, exciting plays, surprising \
turns, or anything a viewer would want to watch out of context.
${preferenceDigest ? `\n${preferenceDigest}\n` : ''}
Transcript (each line is "[start–end] spoken text"):
${transcript}

Pick up to 8 of the strongest candidate moments. For each one, return the start and end time \
in seconds (based on the transcript's timestamps), a short punchy draft title, and a one-sentence \
reason grounded in the four scores below. If nothing in the transcript stands out, return an \
empty list rather than forcing weak picks.

For each candidate, also score it from 0.0 to 1.0 on four dimensions:
- hookStrength: how quickly it grabs attention in the first couple seconds.
- emotionalIntensity: how strong the reaction, excitement, or surprise is.
- contextCompleteness: how well it stands alone without needing earlier context explained.
- replayValue: how likely a viewer is to want to watch it again or share it.`
}
