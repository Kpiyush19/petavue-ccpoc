import { create } from 'zustand'

const FILES_DEFAULT = 300
const ARTIFACT_DEFAULT = 550

const useSessionPanelStore = create((set) => ({
  filesWidth: FILES_DEFAULT,
  artifactWidth: ARTIFACT_DEFAULT,

  setFilesWidth: (width) => set({ filesWidth: width }),
  setArtifactWidth: (width) => set({ artifactWidth: width }),

  resetWidths: () => set({
    filesWidth: FILES_DEFAULT,
    artifactWidth: ARTIFACT_DEFAULT,
  }),
}))

export default useSessionPanelStore
