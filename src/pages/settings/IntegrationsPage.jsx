import { useNavigate } from 'react-router-dom'
import { Integrations } from '../../components/settings/integrations'

export default function IntegrationsPage() {
  const navigate = useNavigate()

  const handleNavigate = (path, state) => {
    navigate(path, { state })
  }

  return <Integrations onNavigate={handleNavigate} />
}
