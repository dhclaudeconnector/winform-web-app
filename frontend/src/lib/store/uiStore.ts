import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Tab {
  id: string
  title: string
}

interface AppState {
  isAuthenticated: boolean
  currentUser: string | null
  mode: 'light' | 'dark'
  sidebarCollapsed: boolean
  openTabs: Tab[]
  activeTabId: string | null
  login: (username: string) => void
  logout: () => void
  toggleMode: () => void
  toggleSidebar: () => void
  openModule: (id: string, title: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      mode: 'light',
      sidebarCollapsed: false,
      openTabs: [],
      activeTabId: null,

      login: (username: string) => set({ isAuthenticated: true, currentUser: username }),

      logout: () => set({ isAuthenticated: false, currentUser: null, openTabs: [], activeTabId: null }),

  toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openModule: (id: string, title: string) =>
    set((state) => {
      const exists = state.openTabs.find((tab) => tab.id === id)
      if (exists) {
        return { activeTabId: id }
      }
      return {
        openTabs: [...state.openTabs, { id, title }],
        activeTabId: id,
      }
    }),

  closeTab: (id: string) =>
    set((state) => {
      const newTabs = state.openTabs.filter((tab) => tab.id !== id)
      const newActiveId = state.activeTabId === id ? (newTabs[0]?.id ?? null) : state.activeTabId
      return { openTabs: newTabs, activeTabId: newActiveId }
    }),

  setActiveTab: (id: string) => set({ activeTabId: id }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        mode: state.mode,
        sidebarCollapsed: state.sidebarCollapsed,
        openTabs: state.openTabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
)
