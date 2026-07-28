// Pure: composite score from the four Claude-reported subscores. Weighted locally rather than
// trusting the model's own arithmetic, so the formula can be recalibrated later without a new
// Claude call. Equal weights to start -- a configurable-weights UI is explicitly out of scope.
export function computeOverallScore(
  hookStrength: number,
  emotionalIntensity: number,
  contextCompleteness: number,
  replayValue: number
): number {
  return hookStrength * 0.25 + emotionalIntensity * 0.25 + contextCompleteness * 0.25 + replayValue * 0.25
}
