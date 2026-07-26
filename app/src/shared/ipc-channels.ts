export const IPC = {
  dbListSessions: 'db:listSessions',
  dbCreateSession: 'db:createSession',
  dbStartSession: 'db:startSession',
  dbEndSession: 'db:endSession',
  dbListGoals: 'db:listGoals',
  dbCreateGoal: 'db:createGoal',
  dbListContentItems: 'db:listContentItems',
  dbCreateContentItem: 'db:createContentItem',
  dbListActivity: 'db:listActivity',
  dbListChecklistItems: 'db:listChecklistItems',
  dbCreateChecklistItem: 'db:createChecklistItem',
  dbDeleteChecklistItem: 'db:deleteChecklistItem',
  obsGetStatus: 'obs:getStatus',
  obsStatusChanged: 'obs:status-changed',
  obsGetSettings: 'obs:getSettings',
  obsSaveSettings: 'obs:saveSettings'
} as const
