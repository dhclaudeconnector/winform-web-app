import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TabItem {
  id: string
  title: string
  path: string
  closable: boolean
  isDirty?: boolean
}

interface TabStore {
  tabs: TabItem[]
  activeTabId: string | null
  addTab: (tab: Omit<TabItem, 'id'>) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<TabItem>) => void
}

const MAX_TABS = 12

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

  addTab: (tab) => {
    const { tabs } = get()
    const existing = tabs.find((t) => t.path === tab.path)
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    if (tabs.length >= MAX_TABS) {
      alert(`Tối đa ${MAX_TABS} tabs`)
      return
    }
    const newTab: TabItem = { ...tab, id: `tab-${Date.now()}` }
    set({ tabs: [...tabs, newTab], activeTabId: newTab.id })
  },

  removeTab: (id) => {
    const { tabs, activeTabId } = get()
    const index = tabs.findIndex((t) => t.id === id)
    if (index === -1) return
    const newTabs = tabs.filter((t) => t.id !== id)
    let newActiveId = activeTabId
    if (activeTabId === id && newTabs.length > 0) {
      newActiveId = newTabs[Math.max(0, index - 1)].id
    } else if (newTabs.length === 0) {
      newActiveId = null
    }
    set({ tabs: newTabs, activeTabId: newActiveId })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, ...updates } : tab)),
    })),
    }),
    {
      name: 'tab-storage',
      version: 1,
    }
  )
)
