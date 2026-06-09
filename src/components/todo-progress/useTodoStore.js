import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/**
 * Per-session todo_write state.
 *
 * Backend is the source of truth — this store mirrors it from:
 *   1. Initial GET /api/sessions/{id} on session load (hydrateFromSession)
 *   2. Pusher `todo_update` events during the session (setTodos)
 *
 * `hasEverHadTodos` is used for empty-state behavior — once the agent calls
 * todo_write at least once, the panel keeps rendering an empty state instead
 * of disappearing, preserving visual continuity.
 *
 * `autoExpandPending` is set true on the FIRST todo_write of a session so the
 * panel briefly expands; consumers reset it after applying the auto-expand.
 */
const useTodoStore = create()(
  immer((set) => ({
    sessionId: null,
    todos: [],
    updatedAt: 0,
    hasEverHadTodos: false,
    autoExpandPending: false,

    hydrateFromSession: (sessionId, todos, updatedAt) => {
      set((state) => {
        state.sessionId = sessionId
        state.todos = Array.isArray(todos) ? todos : []
        state.updatedAt = updatedAt || 0
        state.hasEverHadTodos = state.todos.length > 0
        state.autoExpandPending = false
      })
    },

    setTodos: (todos, updatedAt) => {
      set((state) => {
        const wasEmpty = !state.hasEverHadTodos
        state.todos = Array.isArray(todos) ? todos : []
        state.updatedAt = updatedAt || Date.now()
        if (state.todos.length > 0) {
          if (wasEmpty) {
            state.autoExpandPending = true
          }
          state.hasEverHadTodos = true
        }
      })
    },

    consumeAutoExpand: () => {
      set((state) => {
        state.autoExpandPending = false
      })
    },

    reset: () => {
      set((state) => {
        state.sessionId = null
        state.todos = []
        state.updatedAt = 0
        state.hasEverHadTodos = false
        state.autoExpandPending = false
      })
    },
  }))
)

export default useTodoStore
