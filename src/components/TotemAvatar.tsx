import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Frown } from 'lucide-react'

type TotemMood = 'happy' | 'neutral' | 'hungry' | 'sick'

interface TotemAvatarProps {
    mood: TotemMood
    level: number
    size?: 'sm' | 'md' | 'lg'
}

export function TotemAvatar({ mood, size = 'lg' }: TotemAvatarProps) {
    // Visual config based on mood
    const config = {
        happy: { color: 'bg-yellow-400', shadow: 'shadow-yellow-400/50', scale: 1.1, pulse: 2 },
        neutral: { color: 'bg-blue-400', shadow: 'shadow-blue-400/50', scale: 1, pulse: 4 },
        hungry: { color: 'bg-orange-500', shadow: 'shadow-orange-500/50', scale: 0.9, pulse: 0.5 },
        sick: { color: 'bg-gray-400', shadow: 'shadow-gray-400/50', scale: 0.8, pulse: 0 },
    }

    const current = config[mood]

    // Size config
    const sizes = {
        sm: { container: 'p-2', glow: 'blur-lg', totem: 'w-12 h-12', icon: 'w-6 h-6' },
        md: { container: 'p-4', glow: 'blur-xl', totem: 'w-20 h-20', icon: 'w-8 h-8' },
        lg: { container: 'p-8', glow: 'blur-3xl', totem: 'w-32 h-32', icon: 'w-12 h-12' }
    }
    const s = sizes[size]

    return (
        <div className={`flex flex-col items-center justify-center ${s.container}`}>
            <div className="relative">
                {/* Glow effect */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: current.pulse, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute inset-0 rounded-full ${current.color} opacity-50 ${s.glow}`}
                />

                {/* The Core Totem */}
                <motion.div
                    animate={{
                        y: [0, size === 'sm' ? -2 : -10, 0],
                        rotate: mood === 'hungry' ? [-1, 1, -1] : 0
                    }}
                    transition={{
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 0.2, repeat: Infinity, repeatDelay: 1 } // Shiver if hungry
                    }}
                    className={`relative z-10 ${s.totem} rounded-full ${current.color} ${current.shadow} shadow-lg flex items-center justify-center`}
                >
                    {/* Simple Face */}
                    <Face mood={mood} className={s.icon} />
                </motion.div>
            </div>

            {size === 'lg' && (
                <div className="mt-8 text-center">
                    <h2 className="text-2xl font-bold text-foreground capitalize tracking-widest font-mono">
                        {mood === 'happy' ? 'RADIANT' : mood}
                    </h2>
                    <p className="text-muted-foreground text-sm">Level 1 (Egg)</p>
                </div>
            )}
        </div>
    )
}

function Face({ mood, className }: { mood: string, className?: string }) {
    if (mood === 'happy') return <CheckCircle2 className={`${className} text-white/50`} />
    if (mood === 'hungry') return <AlertCircle className={`${className} text-white/50`} />
    if (mood === 'sick') return <Frown className={`${className} text-white/50`} />
    return <div className={`w-1/2 h-[10%] bg-white/30 rounded-full`} />
}
