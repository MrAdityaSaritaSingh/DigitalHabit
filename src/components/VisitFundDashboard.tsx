import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Trophy, AlertCircle, Wallet, CalendarDays, Percent } from 'lucide-react'
import { useTribeStore } from '../store/useTribeStore'
import { TotemAvatar } from './TotemAvatar'
import { cn } from '../lib/utils'

interface VisitFundDashboardProps {
    onBack: () => void
}

export function VisitFundDashboard({ onBack }: VisitFundDashboardProps) {
    const { members } = useTribeStore()

    // Calculate Stats for Current Month
    const currentDate = new Date()
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

    const stats = useMemo(() => {
        const memberStats = Object.values(members).map(member => {
            const historyDates = Object.keys(member.history)

            // Filter for current month only
            const monthlyDates = historyDates.filter(date => date.startsWith(currentMonthKey))
            const daysTracked = monthlyDates.length

            let totalHabits = 0
            let completedHabits = 0
            let totalPenalty = 0

            monthlyDates.forEach(date => {
                const dayStatus = member.history[date]
                const dailyCompleted = dayStatus.filter(Boolean).length

                // Priority: Use Sheet Data (historyFunds) -> Fallback: Calculate
                let dailyPenalty = 0
                if (member.historyFunds && member.historyFunds[date] !== undefined) {
                    dailyPenalty = member.historyFunds[date]
                } else {
                    dailyPenalty = (5 - dailyCompleted) * 10
                }

                totalHabits += 5
                completedHabits += dailyCompleted
                totalPenalty += dailyPenalty
            })

            const completionRate = daysTracked > 0 ? (completedHabits / totalHabits) * 100 : 0
            const avgDaily = daysTracked > 0 ? (completedHabits / daysTracked) : 0

            return {
                ...member,
                totalPenalty,
                daysTracked,
                completionRate,
                avgDaily
            }
        })

        // Sort by Total Penalty (Descending) - Most penalty = Top Investor
        const sorted = memberStats.sort((a, b) => b.totalPenalty - a.totalPenalty)
        const grandTotal = sorted.reduce((sum, m) => sum + m.totalPenalty, 0)

        return { members: sorted, grandTotal }
    }, [members, currentMonthKey]) // Recalculate if members or month changes

    return (
        <div className="min-h-screen bg-black text-white p-4 animate-in fade-in slide-in-from-bottom-8 duration-500 font-sans">
            <div className="max-w-md mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Visit Fund</h1>
                    <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full font-medium ml-auto">
                        {monthName}
                    </span>
                </div>

                {/* Hero Card - Total Fund */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-red-600 to-red-900 p-8 shadow-2xl shadow-red-900/20"
                >
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="relative z-10 text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-white/80 uppercase tracking-widest text-xs font-bold">
                            <Wallet className="w-4 h-4" />
                            <span>Total Pool</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-4xl font-black text-white/50">₹</span>
                            <span className="text-7xl font-black tracking-tighter text-white drop-shadow-sm">
                                {stats.grandTotal.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-sm text-white/60 font-medium max-w-[200px] mx-auto">
                            Collected from missed rituals.
                            <br />Paying for our future fun.
                        </p>
                    </div>
                </motion.div>

                {/* Info / Rule Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex gap-3 text-sm text-zinc-400">
                    <AlertCircle className="w-5 h-5 shrink-0 text-zinc-500" />
                    <p>
                        <strong className="text-zinc-200">Rule of the Totem:</strong> For every ritual missed, ₹10 is added to the fund. Consistency saves money.
                    </p>
                </div>

                {/* Leaderboard */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Top Investors</h2>

                    <div className="grid gap-4">
                        {stats.members.map((member, index) => {
                            const isTop = index === 0 && member.totalPenalty > 0

                            return (
                                <motion.div
                                    key={member.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        "bg-zinc-900 border rounded-2xl p-5 relative overflow-hidden transition-all group",
                                        isTop ? "border-red-500/50 bg-red-950/10 shadow-[0_0_30px_-10px_rgba(239,68,68,0.2)]" : "border-zinc-800 hover:border-zinc-700"
                                    )}
                                >
                                    {isTop && (
                                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
                                            <Trophy className="w-3 h-3" />
                                            TOP INVESTOR
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="relative">
                                            <div className="scale-75 origin-top-left">
                                                <TotemAvatar level={Math.round(member.avgDaily)} size="md" />
                                                {/* Using Avg Daily for avatar mood approximation in this view */}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-zinc-800 text-zinc-400 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-zinc-700">
                                                #{index + 1}
                                            </div>
                                        </div>

                                        <div className="flex-1 pt-1">
                                            <h3 className={cn("text-xl font-bold", isTop ? "text-red-100" : "text-zinc-100")}>{member.name}</h3>
                                            <div className="flex items-baseline gap-1.5 mt-1">
                                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wide">Contribution</span>
                                                <span className={cn("text-2xl font-black", isTop ? "text-red-400" : "text-zinc-300")}>
                                                    ₹{member.totalPenalty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                                        <div className="bg-black/20 rounded-lg p-2 text-center space-y-0.5">
                                            <div className="flex items-center justify-center text-zinc-500 mb-1">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="text-sm font-bold text-zinc-300">{member.daysTracked}</div>
                                            <div className="text-[10px] text-zinc-600 uppercase font-medium">Days</div>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-2 text-center space-y-0.5">
                                            <div className="flex items-center justify-center text-zinc-500 mb-1">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="text-sm font-bold text-zinc-300">{member.avgDaily.toFixed(1)}</div>
                                            <div className="text-[10px] text-zinc-600 uppercase font-medium">Avg/Day</div>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-2 text-center space-y-0.5">
                                            <div className="flex items-center justify-center text-zinc-500 mb-1">
                                                <Percent className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="text-sm font-bold text-zinc-300">{Math.round(member.completionRate)}%</div>
                                            <div className="text-[10px] text-zinc-600 uppercase font-medium">Rate</div>
                                        </div>
                                    </div>

                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
