import { createAuthProvider } from '../components/google-auth'
import { PETAVUE_API_URL, GOOGLE_CLIENT_ID } from '../config'
import { queryClient } from '../lib/queryClient'
import PetavueSplash from '../components/PetavueSplash'

const { AuthProvider, useAuth } = createAuthProvider({
  apiUrl: PETAVUE_API_URL,
  googleClientId: GOOGLE_CLIENT_ID,
  storagePrefix: 'auth_',
  queryClient,
  LoaderComponent: PetavueSplash,
})

export { AuthProvider, useAuth }
