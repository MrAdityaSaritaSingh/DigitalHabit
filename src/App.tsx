import { useState, useMemo, useEffect } from 'react'
import { Check, PlusCircle, RefreshCw, Settings as SettingsIcon, LogOut, Pencil } from 'lucide-react'
import { useTribeStore } from './store/useTribeStore'
import { TotemAvatar, getMoodLabel } from './components/TotemAvatar'
import { IntroScreen } from './components/IntroScreen'
import { getTodayKey, cn, calculateStreak } from './lib/utils'

export default function App() {
  const { tribeUrl, connectTribe, localUserId } = useTribeStore()
  const isLoading = useTribeStore(s => s.isLoading)
  const error = useTribeStore(s => s.error)

  // If no tribe, show intro
  if (!tribeUrl) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans selection:bg-yellow-500/30">
        <IntroScreen
          onJoin={(url) => connectTribe(url)}
          onCreate={() => { }}
          isLoading={isLoading}
          error={error}
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

  if (isAdding) return <Onboarding onCancel={() => setIsAdding(false)} />

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter">Habitude</h1>
        <p className="text-muted-foreground">Who are you in this tribe?</p>
      </div>

      <div className="grid gap-3">
        {Object.values(members).map(member => {
          // Calc mini mood
          const memberOffset = member.settings.dayEndOffset || 0
          const memberTimezone = member.settings.timezone
          const memberToday = getTodayKey(memberOffset, memberTimezone)
          const todayStatus = member.history[memberToday] || [false, false, false, false, false]

          const doneCount = todayStatus.filter(Boolean).length

          const moodLabel = getMoodLabel(doneCount)

          return (
            <button
              key={member.id}
              onClick={() => setLocalUser(member.id)}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-secondary/50 transition-colors text-left group overflow-hidden relative"
            >
              {/* Mini Totem Preview */}
              <div className="shrink-0">
                <TotemAvatar level={doneCount} size="sm" />
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
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{moodLabel}</p>
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
  const { toggleHabit, syncTribe, updateMemberSettings, initializeDay, deleteMember, isLoading } = useTribeStore()

  // Select user via selector to ensure reactivity
  const user = useTribeStore(s => s.localUserId ? s.members[s.localUserId] : null)

  const [showSettings, setShowSettings] = useState(false)

  // Precompute timezones
  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone')
    } catch (e) {
      return ["UTC"]
    }
  }, [])

  // Date State with Offset & Timezone
  const offset = user?.settings?.dayEndOffset || 0
  const timezone = user?.settings?.timezone
  const todayKey = getTodayKey(offset, timezone)

  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [isEditing, setIsEditing] = useState(false)

  // Memoize effective habits to avoid unstable references
  const effectiveHabits = useMemo(() => {
    if (!user) return []
    const overrides = user.overrides?.[selectedDate] || {}
    return user.habits.map((h, i) => ({
      ...h,
      text: overrides[i] !== undefined ? overrides[i] : h.text
    }))
  }, [user, selectedDate])

  // Sync date if today changes (e.g. crossing midnight with offset)
  if (selectedDate === todayKey && getTodayKey(offset, timezone) !== todayKey) {
    setSelectedDate(getTodayKey(offset, timezone))
  }

  // Effect: Auto-initialize day if missing
  // We check against 'todayKey' because we want to ensure the *current* real day is initialized
  useEffect(() => {
    if (user && !user.history[todayKey]) {
      initializeDay(todayKey)
    }
  }, [todayKey, user?.history, initializeDay])

  if (!user) return null

  const { history } = user
  // Use selected date instead of fixed today
  const dailyStatus = history[selectedDate] || [false, false, false, false, false]

  const isToday = selectedDate === todayKey

  const changeDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  // Calculate User Mood
  const doneCount = dailyStatus.filter(Boolean).length

  const statusLabel = getMoodLabel(doneCount)

  const streak = calculateStreak(user.history)

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 relative">
      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border shadow-xl rounded-2xl w-full max-w-sm p-6 space-y-6 animate-in zoom-in-95">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-muted-foreground text-sm">Personalize your day</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Day Ends At</label>
                <select
                  value={user.settings?.dayEndOffset || 0}
                  onChange={(e) => updateMemberSettings({ dayEndOffset: Number(e.target.value) })}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value={0}>Midnight (12:00 AM)</option>
                  <option value={1}>1:00 AM</option>
                  <option value={2}>2:00 AM</option>
                  <option value={3}>3:00 AM</option>
                  <option value={4}>4:00 AM</option>
                  <option value={5}>5:00 AM</option>
                  <option value={6}>6:00 AM</option>
                  <option value={7}>7:00 AM</option>
                  <option value={8}>8:00 AM</option>
                </select>
                <p className="text-xs text-muted-foreground">Tasks reset after this time.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <select
                  value={user.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                  onChange={(e) => updateMemberSettings({ timezone: e.target.value })}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-medium">My Habits</label>
                {user.habits.map((habit, index) => (
                  <div key={habit.id} className="flex gap-2">
                    <input
                      value={habit.text}
                      onChange={(e) => useTribeStore.getState().updateHabit(index, e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder={`Habit ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm("Are you sure? This will delete your profile and history permanently.")) {
                    deleteMember(user.id)
                  }
                }}
                className="flex-1 bg-red-100 text-red-600 h-12 rounded-xl font-bold hover:bg-red-200"
              >
                Delete Profile
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-primary text-primary-foreground h-12 rounded-xl font-bold hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Header with Date Nav */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
            <code className="text-lg">←</code>
          </button>
          <div className="text-center">
            <p className="font-bold text-lg leading-none">
              {isToday ? 'Today' : new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
            </p>
            {!isToday && (
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
                {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long' })}
              </p>
            )}
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="p-2 hover:bg-secondary rounded-full text-muted-foreground disabled:opacity-30 transition-colors"
          >
            <code className="text-lg">→</code>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => useTribeStore.setState({ localUserId: null })}
            className="text-muted-foreground hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Status Card */}
      <div className="bg-card border rounded-3xl p-6 relative overflow-hidden ring-1 ring-border/50 shadow-sm">
        <div className="flex items-center gap-5 relative z-10">
          {/* Avatar */}
          <div className="shrink-0 relative group cursor-help">
            <TotemAvatar level={doneCount} size="lg" />
            {doneCount === 5 && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-yellow-200 shadow-sm">
                MAX
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h2 className="text-2xl font-black tracking-tight truncate">{user.name}</h2>
              <p className="text-muted-foreground font-medium text-xs flex items-center gap-1.5 uppercase tracking-wider">
                {statusLabel}
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                {isLoading ? <span className="animate-pulse text-primary">Syncing...</span> : 'Synced'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-orange-500/5 text-orange-600 px-3 py-1.5 rounded-xl border border-orange-500/10 flex flex-col leading-none flex-1">
                <span className="text-[10px] uppercase font-bold text-orange-600/50 mb-1">Streak</span>
                <span className="font-black text-xl">🔥 {streak}</span>
              </div>
              <div className="bg-red-500/5 text-red-600 px-3 py-1.5 rounded-xl border border-red-500/10 flex flex-col leading-none flex-1">
                <span className="text-[10px] uppercase font-bold text-red-600/50 mb-1">Fund</span>
                <span className="font-black text-xl">₹{user.visitFund}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 relative">
        {/* ... Settings Modal ... */}

        {/* ... Header ... */}

        {/* ... Hero Status Card ... */}

        {/* Habits List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-muted-foreground">
                {isEditing ? `Editing for ${isToday ? 'Today' : new Date(selectedDate).toLocaleDateString()}` : 'Daily Rituals'}
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={cn("p-1.5 rounded-full transition-colors", isEditing ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => syncTribe(selectedDate)} disabled={isLoading} className="text-xs bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 font-medium">
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              Sync
            </button>
          </div>

          <div className="grid gap-3">
            {effectiveHabits.map((habit, index) => (
              isEditing ? (
                <div key={habit.id} className="relative group overflow-hidden w-full p-3 rounded-2xl text-left border bg-card/50 ring-2 ring-primary/20 animate-in fade-in">
                  <input
                    value={habit.text}
                    onChange={(e) => useTribeStore.getState().updateHabitForDay(selectedDate, index, e.target.value)}
                    className="w-full bg-transparent border-none text-lg font-medium focus:ring-0 placeholder:text-muted-foreground/50"
                    placeholder="Override habit for today..."
                    autoFocus={index === 0}
                  />
                </div>
              ) : (
                <button
                  key={habit.id}
                  onClick={() => {
                    toggleHabit(selectedDate, index)
                  }}
                  /* ... existing button formatting ... */
                  className={cn(
                    "relative group overflow-hidden w-full p-4 rounded-2xl text-left border transition-all duration-300",
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
              )))}
          </div>
        </div>
      </div >
    </div>
  )
}

