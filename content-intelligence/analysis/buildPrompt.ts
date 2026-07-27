// Pure: turns a stored transcript into the user-turn prompt for the Claude clip-analysis call.
// No network or DB access; testable with plain input/output. The transcript's per-segment
// [m:ss–m:ss] timestamps (from formatTranscript.ts) are what let Claude anchor its
// startSeconds/endSeconds picks to real points in the recording.
export function buildAnalysisPrompt(transcript: string): string {
  return `You are reviewing a timestamped transcript of a streamer's recording to find moments \
worth cutting into short standalone clips — funny reactions, exciting plays, surprising \
turns, or anything a viewer would want to watch out of context.

Transcript (each line is "[start–end] spoken text"):
${transcript}

Pick up to 8 of the strongest candidate moments. For each one, return the start and end time \
in seconds (based on the transcript's timestamps), a short punchy draft title, and a one-sentence \
reason it would make a good clip. If nothing in the transcript stands out, return an empty list \
rather than forcing weak picks.`
}
