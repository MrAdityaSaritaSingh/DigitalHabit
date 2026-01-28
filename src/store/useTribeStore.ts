import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTodayKey } from '../lib/utils'

export type UserSettings = {
    dayEndOffset: number
    timezone?: string
}

export type TribeMember = {
    id: string
    name: string
    habits: { id: string, text: string }[]
    // Map of Date "YYYY-MM-DD" -> Map of Index (0-4) -> New Text
    overrides?: Record<string, Record<number, string>>
    history: { [date: string]: boolean[] }
    visitFund: number
    settings: UserSettings
}

interface TribeState {
    tribeUrl: string | null
    members: Record<string, TribeMember>
    localUserId: string | null
    lastSynced: number
    isLoading: boolean
    activeRequests: number
    error: string | null

    // Actions
    connectTribe: (url: string) => Promise<boolean>
    syncTribe: (dateKey?: string) => Promise<void>

    // Member Actions
    createMember: (name: string, habits: string[], dayEndOffset?: number) => void
    updateMemberSettings: (settings: Partial<UserSettings>) => void
    updateHabit: (index: number, text: string) => void
    updateHabitForDay: (date: string, index: number, text: string) => void
    toggleHabit: (date: string, index: number) => void
    calculatePenalties: () => void
    simulateHistory: () => void
    initializeDay: (date: string) => void
    deleteMember: (memberId: string) => Promise<void>
    getLocalMember: () => TribeMember | null
    getHabitsForDate: (date: string) => { id: string, text: string }[]
}

// Mock Data Generator
const generateMockData = (url: string) => {
    // If URL contains 'mock', return dummy data
    if (!url.includes('mock')) return null

    return {
        'member-1': {
            id: 'member-1',
            name: 'Alice',
            habits: Array(5).fill(null).map((_, i) => ({ id: `${i}`, text: `Habit ${i + 1}` })),
            history: { [getTodayKey()]: [true, true, false, false, false] },
            visitFund: 150,
            settings: { dayEndOffset: 0 }
        },
        'member-2': {
            id: 'member-2',
            name: 'Bob',
            habits: Array(5).fill(null).map((_, i) => ({ id: `${i}`, text: `Habit ${i + 1}` })),
            history: { [getTodayKey()]: [false, false, false, false, false] },
            visitFund: 300,
            settings: { dayEndOffset: 0 }
        }
    }
}

export const useTribeStore = create<TribeState>()(
    persist(
        (set, get) => ({
            tribeUrl: null,
            members: {},
            localUserId: null,
            lastSynced: 0,
            isLoading: false,
            activeRequests: 0,
            error: null,

            connectTribe: async (url) => {
                set({ isLoading: true, error: null })
                console.log("Connecting to Tribe:", url)

                // Check for Mock Mode
                if (url.includes('mock')) {
                    await new Promise(r => setTimeout(r, 1000))
                    set({
                        tribeUrl: url,
                        members: generateMockData(url) || {},
                        isLoading: false,
                        lastSynced: Date.now()
                    })
                    return true
                }

                try {
                    // Real Fetch
                    const response = await fetch(url)
                    const json = await response.json()

                    if (json.status === 'success') {
                        // v2 API returns members map directly!
                        const parsedMembers: Record<string, TribeMember> = json.data || {}

                        // Backward Compatibility: Ensure defaults
                        const defaults = {
                            dayEndOffset: 0,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        }

                        Object.values(parsedMembers).forEach(m => {
                            m.settings = { ...defaults, ...(m.settings || {}) }
                        })

                        console.log("Tribe Connected (v2):", Object.keys(parsedMembers).length, "members")

                        set({
                            tribeUrl: url,
                            members: parsedMembers,
                            isLoading: false,
                            lastSynced: Date.now()
                        })



                        return true
                    } else {
                        throw new Error("Invalid response from Tribe")
                    }
                } catch (e) {
                    console.error("Fusion failed:", e)
                    set({ isLoading: false, error: "Could not connect to Tribe. Check URL." })
                    return false
                }
            },

            syncTribe: async (dateKey) => {
                const { tribeUrl, localUserId, members } = get()
                if (!tribeUrl || !localUserId || tribeUrl.includes('mock')) return

                set(state => ({
                    activeRequests: (state.activeRequests || 0) + 1,
                    isLoading: true
                }))

                try {
                    const localMember = members[localUserId]

                    // Send our data to the sheet
                    const offset = localMember.settings.dayEndOffset || 0
                    const timezone = localMember.settings.timezone
                    const targetDate = dateKey || getTodayKey(offset, timezone)
                    const dayLog = localMember.history[targetDate] || [false, false, false, false, false]

                    // User Request Update: Done -> 1, Not Done -> 0
                    const sheetHabits = dayLog.map(done => done ? 1 : 0)

                    await fetch(tribeUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'text/plain;charset=utf-8',
                        },
                        body: JSON.stringify({
                            // v2 Payload
                            userName: localMember.name,
                            userId: localUserId,
                            date: targetDate,
                            habits: sheetHabits,
                            habitNames: localMember.habits.map(h => h.text),
                            visitFund: localMember.visitFund,
                            settings: localMember.settings
                        })
                    })

                    set(state => {
                        const newCount = Math.max(0, (state.activeRequests || 1) - 1)
                        return {
                            activeRequests: newCount,
                            isLoading: newCount > 0,
                            lastSynced: Date.now()
                        }
                    })
                    console.log("Tribe Synced")
                } catch (e) {
                    console.error("Sync failed:", e)
                    set(state => {
                        const newCount = Math.max(0, (state.activeRequests || 1) - 1)
                        return {
                            activeRequests: newCount,
                            isLoading: newCount > 0
                        }
                    })
                }
            },

            createMember: (name, habits, dayEndOffset = 0) => {
                const newId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 9)
                const newMember: TribeMember = {
                    id: newId,
                    name,
                    habits: habits.map((h, i) => ({ id: `${i}`, text: h })),
                    history: {},
                    visitFund: 0,
                    settings: {
                        dayEndOffset,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                }

                set(state => ({
                    members: { ...state.members, [newId]: newMember },
                    localUserId: newId
                }))

                // Immediately sync to create the sheet
                get().syncTribe()
            },

            updateMemberSettings: (settingsUpdates) => {
                const { localUserId, members } = get()
                if (!localUserId || !members[localUserId]) return

                set(state => ({
                    members: {
                        ...state.members,
                        [localUserId]: {
                            ...state.members[localUserId],
                            settings: {
                                ...state.members[localUserId].settings,
                                ...settingsUpdates
                            }
                        }
                    }
                }))

                // Trigger sync to save settings if supported by backend later, 
                // for now it's local first.
                // get().syncTribe() 
            },

            updateHabit: (index, text) => {
                const { localUserId, members } = get()
                if (!localUserId || !members[localUserId]) return

                const member = members[localUserId]
                const newHabits = [...member.habits]
                newHabits[index] = { ...newHabits[index], text }

                set(state => ({
                    members: {
                        ...state.members,
                        [localUserId]: {
                            ...member,
                            habits: newHabits
                        }
                    }
                }))
                get().syncTribe()
            },

            updateHabitForDay: (date, index, text) => {
                const { localUserId, members } = get()
                if (!localUserId || !members[localUserId]) return

                const member = members[localUserId]
                // Initialize overrides if missing
                const overrides = member.overrides || {}
                const dayOverrides = overrides[date] || {}

                // If text matches default, strictly we could remove the override, but let's just set it for now.
                set(state => ({
                    members: {
                        ...state.members,
                        [localUserId]: {
                            ...member,
                            overrides: {
                                ...overrides,
                                [date]: {
                                    ...dayOverrides,
                                    [index]: text
                                }
                            }
                        }
                    }
                }))
                // We might want to sync immediately or just wait for toggle/sync button
            },

            getHabitsForDate: (date) => {
                const { localUserId, members } = get()
                if (!localUserId || !members[localUserId]) return []

                const member = members[localUserId]
                const overrides = member.overrides?.[date] || {}

                return member.habits.map((h, i) => ({
                    ...h,
                    text: overrides[i] !== undefined ? overrides[i] : h.text
                }))
            },

            toggleHabit: (date, index) => {
                const { localUserId, members } = get()
                if (!localUserId || !members[localUserId]) return

                const member = members[localUserId]
                const dayLog = member.history[date] || [false, false, false, false, false]
                const newLog = [...dayLog]
                newLog[index] = !newLog[index]

                set(state => ({
                    members: {
                        ...state.members,
                        [localUserId]: {
                            ...member,
                            history: {
                                ...member.history,
                                [date]: newLog
                            }
                        }
                    }
                }))

                // Trigger background sync for the specific date modified
                get().syncTribe(date)
            },

            calculatePenalties: () => {
                const { localUserId, members } = get()
                if (!localUserId || !members[localUserId]) return

                const member = members[localUserId]
                const offset = member.settings.dayEndOffset || 0
                const timezone = member.settings.timezone
                const today = getTodayKey(offset, timezone)
                const knownDays = Object.keys(member.history).sort()

                let penalty = 0

                // Calculate penalty for all past days
                // Formula: (5 - CompletedTasks) * 10
                knownDays.forEach(day => {
                    if (day < today) {
                        const habits = member.history[day]
                        const completedCount = habits.filter(Boolean).length

                        // Add 10 per missed habit (Max 50)
                        const dailyPenalty = (5 - completedCount) * 10
                        if (dailyPenalty > 0) {
                            penalty += dailyPenalty
                        }
                    }
                })

                if (penalty !== member.visitFund) {
                    set(state => ({
                        members: {
                            ...state.members,
                            [localUserId]: {
                                ...member,
                                visitFund: penalty
                            }
                        }
                    }))
                    get().syncTribe() // Sync the new penalty
                }
            },

            simulateHistory: async () => {
                const { localUserId, members, tribeUrl } = get()
                if (!localUserId || !members[localUserId] || !tribeUrl) return

                const member = members[localUserId]
                const newHistory = { ...member.history }
                const today = new Date()

                set({ isLoading: true })

                // Generate and Sync 5 days of history
                for (let i = 1; i <= 5; i++) {
                    const d = new Date(today)
                    d.setDate(d.getDate() - i)
                    const dateKey = d.toISOString().split('T')[0]

                    // Random completion
                    const dailyHabits = Array(5).fill(false).map(() => Math.random() > 0.2)
                    newHistory[dateKey] = dailyHabits

                    // Specific Sync for this day (v2 feature)
                    // We manually fire the fetch here to avoid spamming the generic syncTribe which calculates 'today'
                    try {
                        const penalty = dailyHabits.every(Boolean) ? 0 : 50 // simplistic per-day penalty calc for sim
                        // Note: Real penalty calc happens in calculatePenalties, but we just want to push ROW data here.
                        // Actually, the Script just records what we send.
                        // Let's send a specific payload for this day.

                        await fetch(tribeUrl, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                userName: member.name,
                                userId: localUserId,
                                date: dateKey,
                                habits: dailyHabits,
                                habitNames: member.habits.map(h => h.text),
                                visitFund: member.visitFund + (penalty * i) // Rough simulation of accumulation logic not strictly needed for row test
                            })
                        })
                        // fast delay
                        await new Promise(r => setTimeout(r, 200))
                    } catch (e) {
                        console.error("Sim sync failed", e)
                    }
                }

                // Update Local State finally
                set(state => ({
                    members: {
                        ...state.members,
                        [localUserId]: {
                            ...member,
                            history: newHistory
                        }
                    },
                    isLoading: false
                }))

                // Recalculate penalties fully locally
                get().calculatePenalties()
            },

            initializeDay: (date) => {
                const { localUserId, members } = get()
                if (!localUserId || !members[localUserId]) return

                const member = members[localUserId]

                // If already initialized, do nothing
                if (member.history[date]) return

                set(state => ({
                    members: {
                        ...state.members,
                        [localUserId]: {
                            ...member,
                            history: {
                                ...member.history,
                                [date]: [false, false, false, false, false]
                            }
                        }
                    }
                }))

                // Sync to push the 0s to sheet
                get().syncTribe(date)


            },

            deleteMember: async (memberId) => {
                const { tribeUrl, members } = get()
                const member = members[memberId]
                if (!tribeUrl || !member) return

                set({ isLoading: true })

                // 1. Send Delete Request
                try {
                    await fetch(tribeUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({
                            action: 'DELETE',
                            userId: memberId,
                            userName: member.name, // Needed to find sheet
                        })
                    })
                    console.log("Member deleted from Tribe")
                } catch (e) {
                    console.error("Delete failed:", e)
                    // We might still want to delete locally? Let's assume yes.
                }

                // 2. Delete Locally
                const newMembers = { ...members }
                delete newMembers[memberId]

                set(state => ({
                    members: newMembers,
                    isLoading: false,
                    // If we deleted ourselves, logout
                    localUserId: state.localUserId === memberId ? null : state.localUserId
                }))
            },

            getLocalMember: () => {
                const { localUserId, members } = get()
                if (!localUserId) return null
                return members[localUserId] || null
            }
        }),
        {
            name: 'tribe-storage',
            partialize: (state) => ({
                tribeUrl: state.tribeUrl,
                members: state.members,
                localUserId: state.localUserId,
                lastSynced: state.lastSynced
            })
        }
    )
)
