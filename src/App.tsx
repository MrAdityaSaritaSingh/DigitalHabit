import { useState } from 'react'
import { Check, PlusCircle, Plane, RefreshCw, LogOut, Wallet } from 'lucide-react'
import { useTribeStore } from './store/useTribeStore'
import { TotemAvatar } from './components/TotemAvatar'
import { IntroScreen } from './components/IntroScreen'
import { getTodayKey, cn, calculateStreak } from './lib/utils'

export default function App() {
  const { tribeUrl, connectTribe, localUserId } = useTribeStore()

  // If no tribe, show intro
  if (!tribeUrl) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans selection:bg-yellow-500/30">
        <IntroScreen
          onJoin={(url) => connectTribe(url)}
          onCreate={() => { }}
          isLoading={useTribeStore(s => s.isLoading)}
          error={useTribeStore(s => s.error)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans selection:bg-yellow-500/30">
      <div className="w-full max-w-md space-y-8">
        {/* If we have a tribe but no local user identity yet, we need to pick/create one */}
        {/* For MVP let's assume if you join a mock, you pick one, or create new */}
        {!localUserId ? <UserSelect /> : <Dashboard />}
      </div>
    </div>
  )
}

function UserSelect() {
  const { members } = useTribeStore() // We need a way to selecting existing member too if we are logging back in
  // But for simple "Join" flow, let's just create a new member for now or pick from list

  // To keep it simple: "Who are you?"
  // List existing members to "Claim" or "Create New"

  const setLocalUser = (id: string) => {
    // We need to expose a setLocalUserId action in store, but for now let's use a hack or update store
    // Ideally we add 'loginAs(id)' to store
    useTribeStore.setState({ localUserId: id })
  }

  const [isAdding, setIsAdding] = useState(false)
  const today = getTodayKey()

  if (isAdding) return <Onboarding onCancel={() => setIsAdding(false)} />

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter">Digital Totem</h1>
        <p className="text-muted-foreground">Who are you in this tribe?</p>
      </div>

      <div className="grid gap-3">
        {Object.values(members).map(member => {
          // Calc mini mood
          const todayStatus = member.history[today] || [false, false, false, false, false]
          const allDone = todayStatus.every(Boolean)
          const isMorning = new Date().getHours() < 12
          let mood: any = 'neutral'
          if (allDone) mood = 'happy'
          else if (!isMorning && todayStatus.filter(Boolean).length < 2) mood = 'hungry'

          return (
            <button
              key={member.id}
              onClick={() => setLocalUser(member.id)}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-secondary/50 transition-colors text-left group overflow-hidden relative"
            >
              {/* Mini Totem Preview */}
              <div className="shrink-0">
                <TotemAvatar mood={mood} level={1} size="sm" />
              </div>

              <div className="flex-1 z-10">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg group-hover:text-primary transition-colors capitalize">{member.name}</p>
                  {calculateStreak(member.history) > 1 && (
                    <span className="text-xs bg-orange-500/10 text-orange-500 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      🔥 {calculateStreak(member.history)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{mood === 'happy' ? 'Radiant' : mood}</p>
              </div>
            </button>
          )
        })}

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-secondary/20 transition-all text-left text-muted-foreground"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="font-medium">I'm New Here</span>
        </button>
      </div>

      <div className="text-center">
        <button onClick={() => useTribeStore.setState({ tribeUrl: null })} className="text-xs text-muted-foreground hover:text-red-400">
          Disconnect from Tribe
        </button>
      </div>
    </div>
  )
}

function Onboarding({ onCancel }: { onCancel?: () => void }) {
  const { createMember } = useTribeStore()
  const [name, setName] = useState('')
  const [habits, setHabits] = useState(['', '', '', '', ''])

  const handleHabitChange = (index: number, val: string) => {
    const newHabits = [...habits]
    newHabits[index] = val
    setHabits(newHabits)
  }

  const submit = () => {
    const validHabits = habits.filter(h => h.trim().length > 0)
    if (name && validHabits.length === 5) {
      createMember(name, validHabits)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter">Join Tribe</h1>
        <p className="text-muted-foreground">Set up your profile.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">What is your name?</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Your Name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Your 5 Daily Rituals</label>
          {habits.map((h, i) => (
            <input
              key={i}
              value={h}
              onChange={(e) => handleHabitChange(i, e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder={`Habit ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 bg-secondary text-secondary-foreground h-12 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
            >
              Cancel
            </button>
          )}
          <button
            onClick={submit}
            disabled={!name || habits.some(h => !h.trim())}
            className="flex-1 bg-primary text-primary-foreground h-12 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { getLocalMember, toggleHabit, syncTribe, members, isLoading } = useTribeStore()
  const user = getLocalMember()

  // Date State
  const [selectedDate, setSelectedDate] = useState(getTodayKey())

  if (!user) return null

  const { habits, history } = user
  // Use selected date instead of fixed today
  const dailyStatus = history[selectedDate] || [false, false, false, false, false]

  const isToday = selectedDate === getTodayKey()

  const changeDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  // Calculate Shared Fund
  const totalFund = Object.values(members).reduce((acc, u) => acc + u.visitFund, 0)
  const GOAL_AMOUNT = 8000
  const GOAL_NAME = "Flight Ticket"

  // Calculate Tribe Mood (Average of all members)
  // Logic: Calculate mood for each member, then assist 'Tribe Mood' based on worst performing? or average?
  // Let's go with: If ANYONE is hungry, Totem is hungry. If ALL are happy, Totem is Radiant.
  const todayKey = getTodayKey()
  const memberMoods = Object.values(members).map(m => {
    const s = m.history[todayKey] || [false, false, false, false, false]
    const doneCount = s.filter(Boolean).length
    // logic reuse
    const allDone = s.every(Boolean)
    const isMorning = new Date().getHours() < 12
    if (allDone) return 'happy'
    if (!isMorning && doneCount < 2) return 'hungry'
    return 'neutral'
  })

  let tribeMood: any = 'neutral'
  if (memberMoods.every(m => m === 'happy')) tribeMood = 'happy'
  else if (memberMoods.some(m => m === 'hungry')) tribeMood = 'hungry'


  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 capitalize">
            {user.name}
            {calculateStreak(user.history) > 1 && (
              <span className="text-xs bg-orange-500/10 text-orange-500 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                🔥 {calculateStreak(user.history)}
              </span>
            )}
            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {isLoading ? 'Syncing...' : 'Synced'}
            </span>
          </h2>
          {/* Date Navigator */}
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => changeDate(-1)} className="p-1 hover:bg-secondary rounded text-muted-foreground">
              <code className="text-xs">←</code>
            </button>
            <p className="text-muted-foreground text-sm font-medium">
              {isToday ? 'Today' : new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <button
              onClick={() => changeDate(1)}
              disabled={isToday}
              className="p-1 hover:bg-secondary rounded text-muted-foreground disabled:opacity-30"
            >
              <code className="text-xs">→</code>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-950/30 text-red-400 px-3 py-1 rounded-full border border-red-900/50">
            <Wallet className="w-4 h-4" />
            <span className="font-mono font-bold">₹{user.visitFund}</span>
          </div>
          <button
            onClick={() => useTribeStore.setState({ localUserId: null })}
            className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Shared Fund Goal Card */}
      <div className="bg-card border rounded-2xl p-5 space-y-3 relative overflow-hidden group">
        {/* Background pattern */}
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Plane className="w-24 h-24 rotate-12" />
        </div>

        <div className="flex justify-between items-end relative z-10">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Visit Fund Goal</p>
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-lg">{GOAL_NAME}</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black tracking-tighter">₹{totalFund}</span>
            <span className="text-sm text-muted-foreground font-medium"> / ₹{GOAL_AMOUNT}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min((totalFund / GOAL_AMOUNT) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Tribe Mood Indicator */}
      <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-xl border border-secondary/50">
        <div className="relative">
          <TotemAvatar mood={tribeMood} level={2} size="sm" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Tribe Vibe</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {tribeMood === 'happy' ? 'Radiant' : tribeMood === 'hungry' ? 'Hungry' : 'Chilling'}
          </p>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl">Your Rituals</h3>
          <button onClick={() => syncTribe(selectedDate)} disabled={isLoading} className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1.5">
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            {isLoading ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        <div className="grid gap-3">
          {habits.map((habit, index) => (
            <button
              key={habit.id}
              onClick={() => {
                toggleHabit(selectedDate, index)
                // OPTIONAL: Auto-sync on change (debounce ideally, but direct for now)
                // setTimeout(() => syncTribe(selectedDate), 500)
              }}
              className={cn(
                "relative group overflow-hidden w-full p-4 rounded-xl text-left border transition-all duration-300",
                dailyStatus[index]
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-card hover:bg-secondary/50 border-border"
              )}
            >
              <div className="flex items-center justify-between relative z-10">
                <span className={cn("font-medium text-lg", dailyStatus[index] && "font-bold")}>{habit.text}</span>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  dailyStatus[index] ? "border-primary-foreground bg-primary-foreground/20" : "border-muted-foreground/30"
                )}>
                  {dailyStatus[index] && <Check className="w-4 h-4" />}
                </div>
              </div>

              {/* Confetti effect background */}
              {dailyStatus[index] && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
