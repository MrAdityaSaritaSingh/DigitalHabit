import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTodayKey } from '../lib/utils'

export type Habit = {
    id: string
    text: string
}

export type UserData = {
    id: string
    name: string
    habits: Habit[]
    history: DailyLog
    visitFund: number
    isOnboarded: boolean
}

type DailyLog = {
    // Map date string "YYYY-MM-DD" to array of boolean [true, false, ...] matching habit indices
    [date: string]: boolean[]
}

interface StoreState {
    // Multi-user state
    users: Record<string, UserData>
    activeUserId: string | null

    // Actions
    setOnboarding: (name: string, habits: string[]) => void
    switchUser: (userId: string) => void
    toggleHabit: (date: string, index: number) => void
    calculatePenalties: () => void
    resetProgress: () => void // Debug

    // Selectors
    getActiveUser: () => UserData | null
}

export const useHabitStore = create<StoreState>()(
    persist(
        (set, get) => ({
            users: {},
            activeUserId: null,

            getActiveUser: () => {
                const { users, activeUserId } = get()
                if (!activeUserId || !users[activeUserId]) return null
                return users[activeUserId]
            },

            setOnboarding: (name, habits) => {
                const habitObjects = habits.map((text, i) => ({ id: i.toString(), text }))
                const newUserId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4)

                const newUser: UserData = {
                    id: newUserId,
                    name,
                    habits: habitObjects,
                    history: { [getTodayKey()]: [false, false, false, false, false] },
                    visitFund: 0,
                    isOnboarded: true
                }

                set((state) => ({
                    users: { ...state.users, [newUserId]: newUser },
                    activeUserId: newUserId
                }))
            },

            switchUser: (userId) => {
                set({ activeUserId: userId })
            },

            toggleHabit: (date, index) => {
                set((state) => {
                    const activeUser = state.users[state.activeUserId!]
                    if (!activeUser) return {}

                    const dayLog = activeUser.history[date] || [false, false, false, false, false]
                    const newLog = [...dayLog]
                    newLog[index] = !newLog[index]

                    return {
                        users: {
                            ...state.users,
                            [state.activeUserId!]: {
                                ...activeUser,
                                history: {
                                    ...activeUser.history,
                                    [date]: newLog
                                }
                            }
                        }
                    }
                })
            },

            calculatePenalties: () => {
                const { users, activeUserId } = get()
                if (!activeUserId || !users[activeUserId]) return

                const activeUser = users[activeUserId]
                const today = getTodayKey()

                // Simple penalty calculation: check strictly past days
                // This logic needs to be idempotent or careful not to double count.
                // For MVP: We just recalculate total penalty from scratch based on history.

                const knownDays = Object.keys(activeUser.history).sort()
                let penalty = 0

                knownDays.forEach(day => {
                    if (day < today) {
                        const activities = activeUser.history[day]
                        const missedAny = activities.some(done => !done)
                        if (missedAny) {
                            penalty += 50
                        }
                    }
                })

                if (penalty !== activeUser.visitFund) {
                    set(state => ({
                        users: {
                            ...state.users,
                            [activeUserId]: {
                                ...state.users[activeUserId],
                                visitFund: penalty
                            }
                        }
                    }))
                }
            },

            resetProgress: () => {
                set((state) => {
                    if (!state.activeUserId) return {}
                    const activeUser = state.users[state.activeUserId]
                    return {
                        users: {
                            ...state.users,
                            [state.activeUserId]: {
                                ...activeUser,
                                history: {},
                                visitFund: 0,
                                isOnboarded: false // Actually this might weirdly delete the user conceptually?
                                // Let's just reset data but keep user
                            }
                        }
                    }
                })
            }
        }),
        {
            name: 'totem-storage-v2', // Changed name to avoid conflict with v1 and allow fresh start (or we could migrate)
            migrate: (persistedState: any) => {
                // simple migration attempt if we wanted to read v1
                // For now, let's start fresh or rely on manual recreation since it is a dev app
                return persistedState
            }
        }
    )
)
