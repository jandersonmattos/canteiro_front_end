'use client'

import Sidebar from '../../components/Sidebar'
import ProjectDashboardPanel from '../../components/ProjectDashboardPanel'

export default function DashboardPage() {

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-10">
          <ProjectDashboardPanel />
        </div>
      </main>
    </div>
  )
}
