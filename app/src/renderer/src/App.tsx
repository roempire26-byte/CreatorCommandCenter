import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@renderer/components/AppShell'
import { MissionControl } from '@renderer/routes/MissionControl'
import { Streaming } from '@renderer/routes/Streaming'
import { Analytics } from '@renderer/routes/Analytics'
import { Content } from '@renderer/routes/Content'
import { Automations } from '@renderer/routes/Automations'
import { AIWorkspace } from '@renderer/routes/AIWorkspace'
import { Settings } from '@renderer/routes/Settings'

export function App(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<MissionControl />} />
          <Route path="/streaming" element={<Streaming />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/content" element={<Content />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/ai-workspace" element={<AIWorkspace />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
