import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getTodayKey(hourOffset: number = 0, timezone?: string) {
    const d = new Date()
    d.setHours(d.getHours() - hourOffset)
    if (timezone) {
        try {
            return d.toLocaleDateString("en-CA", { timeZone: timezone })
        } catch (e) {
            console.error("Invalid timezone", timezone)
        }
    }
    return d.toISOString().split('T')[0]
}

export function calculateStreak(history: { [date: string]: boolean[] }): number {
    let streak = 0
    const today = new Date()

    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]

        const dayHabits = history[key]

        // If no data for this day, stop streak (unless it's today and empty, then check yesterday)
        if (!dayHabits) {
            if (i === 0) continue // Skip today if empty, might be start of day
            break
        }

        if (dayHabits.every(Boolean)) {
            streak++
        } else {
            // If today is incomplete, don't break streak yet (it's in progress)
            if (i === 0) continue
            break
        }
    }
    return streak
}
