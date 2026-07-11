import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '../api'
import ExperimentalFeatures from '../components/my-profile/components/ExperimentalFeatures'

export default function ExperimentsPage() {
  const isPetavue = (getCurrentUser()?.email || '').endsWith('@petavue.com')

  if (!isPetavue) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-grey-50)]">
      <div className="bg-white border-b border-[var(--color-grey-200)] px-6 h-[64px] flex items-center">
        <h1 className="text-base font-medium text-[var(--color-text-primary)]">
          Experiments
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg p-6 max-w-2xl">
          <ExperimentalFeatures />
        </div>
      </div>
    </div>
  )
}
