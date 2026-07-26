import { z } from 'zod'

export const sessionStatusSchema = z.enum(['live', 'completed', 'cancelled'])

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  platform: z.string().trim().min(1).max(100),
  status: sessionStatusSchema,
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional()
})
export type CreateSessionInput = z.infer<typeof createSessionSchema>

export const streamSessionSchema = createSessionSchema.extend({
  id: z.string(),
  durationSeconds: z.number().nullable()
})
export type StreamSession = z.infer<typeof streamSessionSchema>

export const startSessionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  platform: z.string().trim().min(1).max(100)
})
export type StartSessionInput = z.infer<typeof startSessionSchema>

export const endSessionSchema = z.object({ id: z.string() })
export type EndSessionInput = z.infer<typeof endSessionSchema>

export const createGoalSchema = z.object({
  metric: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(200),
  target: z.number().positive(),
  unit: z.string().trim().max(20).default(''),
  period: z.string().trim().min(1).max(50),
  currentValue: z.number().nonnegative().default(0)
})
export type CreateGoalInput = z.infer<typeof createGoalSchema>

export const goalSchema = createGoalSchema.extend({ id: z.string() })
export type Goal = z.infer<typeof goalSchema>

export const contentItemStatusSchema = z.enum([
  'idea',
  'captured',
  'drafting',
  'ready-for-review',
  'approved',
  'published'
])

export const createContentItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(100),
  status: contentItemStatusSchema,
  draft: z.string().trim().max(5000).optional(),
  dueAt: z.string().datetime().optional(),
  sourceSessionId: z.string().optional()
})
export type CreateContentItemInput = z.infer<typeof createContentItemSchema>

export const updateContentItemStatusSchema = z.object({ id: z.string(), status: contentItemStatusSchema })
export type UpdateContentItemStatusInput = z.infer<typeof updateContentItemStatusSchema>

export const contentItemSchema = createContentItemSchema.extend({ id: z.string() })
export type ContentItem = z.infer<typeof contentItemSchema>

export const activityLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  category: z.string(),
  action: z.string(),
  status: z.enum(['success', 'warning', 'danger', 'live', 'neutral']),
  detail: z.string().nullable(),
  correlationId: z.string().nullable()
})
export type ActivityLogEntry = z.infer<typeof activityLogEntrySchema>

export const obsStatusValueSchema = z.enum(['offline', 'connecting', 'connected', 'auth-required', 'errored'])
export type ObsStatusValue = z.infer<typeof obsStatusValueSchema>

export const obsStatusSchema = z.object({
  status: obsStatusValueSchema,
  sceneName: z.string().nullable(),
  streaming: z.boolean(),
  recording: z.boolean(),
  streamStartedAt: z.string().nullable(),
  message: z.string().nullable()
})
export type ObsStatus = z.infer<typeof obsStatusSchema>

export const obsSettingsSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  hasPassword: z.boolean()
})
export type ObsSettings = z.infer<typeof obsSettingsSchema>

export const saveObsSettingsSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  password: z.string().max(500).optional()
})
export type SaveObsSettingsInput = z.infer<typeof saveObsSettingsSchema>

export const createChecklistItemSchema = z.object({
  label: z.string().trim().min(1).max(200)
})
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>

export const checklistItemSchema = createChecklistItemSchema.extend({
  id: z.string(),
  sortOrder: z.number()
})
export type ChecklistItem = z.infer<typeof checklistItemSchema>

export const deleteChecklistItemSchema = z.object({ id: z.string() })
export type DeleteChecklistItemInput = z.infer<typeof deleteChecklistItemSchema>

export const createMetricSnapshotSchema = z.object({
  sessionId: z.string(),
  platform: z.string().trim().min(1).max(100),
  metricName: z.string().trim().min(1).max(100),
  value: z.number()
})
export type CreateMetricSnapshotInput = z.infer<typeof createMetricSnapshotSchema>

export const metricSnapshotSchema = createMetricSnapshotSchema.extend({
  id: z.string(),
  capturedAt: z.string()
})
export type MetricSnapshot = z.infer<typeof metricSnapshotSchema>

export const listMetricSnapshotsSchema = z.object({ sessionId: z.string() })
export type ListMetricSnapshotsInput = z.infer<typeof listMetricSnapshotsSchema>
