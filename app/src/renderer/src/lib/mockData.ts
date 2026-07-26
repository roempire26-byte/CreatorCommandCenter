export interface GoalMock {
  id: string
  label: string
  current: number
  target: number
  unit: string
  tone: 'cyan' | 'violet'
}

export const MOCK_GOALS: GoalMock[] = [
  { id: 'hours', label: 'Hours streamed this month', current: 14, target: 40, unit: 'h', tone: 'cyan' },
  { id: 'followers', label: 'New followers this month', current: 186, target: 500, unit: '', tone: 'violet' },
  { id: 'content', label: 'Content pieces published', current: 3, target: 8, unit: '', tone: 'cyan' }
]

export interface RecentSessionMock {
  title: string
  platform: string
  status: 'completed'
  startedAt: string
  duration: string
  followersGained: number
  notes: string
}

export const MOCK_RECENT_SESSION: RecentSessionMock = {
  title: 'Ranked grind + community Q&A',
  platform: 'Twitch',
  status: 'completed',
  startedAt: 'Jul 24, 8:04 PM',
  duration: '2h 41m',
  followersGained: 23,
  notes: 'Strong retention through the Q&A segment. Clip the first 10 minutes.'
}

export interface TaskMock {
  id: string
  label: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  status: string
  due: string
}

export const MOCK_TASKS: TaskMock[] = [
  { id: 't1', label: 'Review Tuesday stream clips', tone: 'warning', status: 'Needs review', due: 'Today' },
  { id: 't2', label: 'Approve TikTok caption drafts', tone: 'warning', status: 'Needs review', due: 'Today' },
  { id: 't3', label: 'Publish weekly schedule post', tone: 'neutral', status: 'Scheduled', due: 'Tomorrow' },
  { id: 't4', label: 'Update stream overlay for sponsor', tone: 'success', status: 'Done', due: 'Completed' }
]

export interface ActivityMock {
  id: string
  time: string
  tone: 'success' | 'warning' | 'danger' | 'live' | 'neutral'
  message: string
}

export const MOCK_ACTIVITY: ActivityMock[] = [
  { id: 'a1', time: 'Jul 24, 8:04 PM', tone: 'live', message: 'Stream went live on Twitch' },
  { id: 'a2', time: 'Jul 24, 10:45 PM', tone: 'success', message: 'Session ended and saved — 2h 41m recorded' },
  { id: 'a3', time: 'Jul 25, 9:12 AM', tone: 'warning', message: 'Automation dry-run flagged 2 clips for manual review' },
  { id: 'a4', time: 'Jul 25, 9:15 AM', tone: 'danger', message: 'YouTube analytics import failed — retry available in Analytics' },
  { id: 'a5', time: 'Jul 25, 11:30 AM', tone: 'neutral', message: 'Weekly goal targets refreshed' }
]

export const MOCK_NEXT_ACTION = 'Review 2 clips flagged from yesterday’s automation run before they expire.'
