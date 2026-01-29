import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Frown } from 'lucide-react'

type TotemMood = 'happy' | 'neutral' | 'hungry' | 'sick'

interface TotemAvatarProps {
    mood: TotemMood
    level: number
    size?: 'sm' | 'md' | 'lg'
}

export function TotemAvatar({ level, size = 'lg' }: TotemAvatarProps) {
    // 0-5 Mapping for Gradient (Gloomy Grey -> Bright Golden)
    // 0: Gloomy Grey
    // 1: Dark Orange-Grey
    // 2: Neutral Blue
    // 3: Optimistic Yellow-Green
    // 4: Winding Up Yellow
    // 5: Radiant Golden

    const getColor = (lvl: number) => {
        if (lvl <= 0) return { bg: 'bg-zinc-600', shadow: 'shadow-zinc-900/50', icon: 'text-zinc-400' }
        if (lvl === 1) return { bg: 'bg-orange-800', shadow: 'shadow-orange-900/50', icon: 'text-orange-400' }
        if (lvl === 2) return { bg: 'bg-blue-500', shadow: 'shadow-blue-900/50', icon: 'text-blue-200' }
        if (lvl === 3) return { bg: 'bg-yellow-500', shadow: 'shadow-yellow-600/50', icon: 'text-yellow-100' }
        if (lvl === 4) return { bg: 'bg-amber-400', shadow: 'shadow-amber-500/50', icon: 'text-amber-50' }
        return { bg: 'bg-yellow-300', shadow: 'shadow-yellow-400/80', icon: 'text-white' }
    }



    const current = getColor(level)

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
                    animate={{ scale: [1, 1.2, 1], opacity: level >= 5 ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3] }}
                    transition={{ duration: level >= 5 ? 1.5 : 4, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute inset-0 rounded-full ${current.bg} opacity-50 ${s.glow}`}
                />

                {/* The Core Totem */}
                <motion.div
                    animate={{
                        y: [0, -5 - level, 0],
                        rotate: level <= 0 ? [-2, 2, -2] : 0, // Shiver if 0 (Gloomy)
                        scale: level >= 5 ? [1, 1.1, 1] : 1
                    }}
                    transition={{
                        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 0.15, repeat: Infinity, repeatDelay: 3 }, // Shiver burst
                        scale: { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 } // Heartbeat if MAX
                    }}
                    className={`relative z-10 ${s.totem} rounded-full ${current.bg} ${current.shadow} shadow-lg flex items-center justify-center transition-colors duration-1000`}
                >
                    {/* Face Logic */}
                    <Face level={level} className={s.icon} />
                </motion.div>
            </div>

            {size === 'lg' && (
                <div className="mt-8 text-center space-y-1">
                    <h2 className={`text-2xl font-bold tracking-widest font-mono uppercase transition-colors duration-500 ${level >= 5 ? 'text-yellow-400' : 'text-foreground'}`}>
                        {level === 0 ? 'Depressed' :
                            level === 1 ? 'Hungry' :
                                level === 2 ? 'Neutral' :
                                    level === 3 ? 'Happy' :
                                        level === 4 ? 'Winding Up' : 'RADIANT'}
                    </h2>
                    <p className="text-muted-foreground text-sm">Level {Math.max(1, level)}</p>
                </div>
            )}
        </div>
    )
}

function Face({ level, className }: { level: number, className?: string }) {
    if (level <= 0) return <Frown className={`${className} opacity-50`} />
    if (level === 1) return <AlertCircle className={`${className} opacity-70`} />
    if (level === 2) return <div className={`w-1/2 h-[10%] bg-white/30 rounded-full`} /> // Neutral Line
    if (level >= 5) return <CheckCircle2 className={`${className}`} />
    return <div className={`w-1/2 h-[10%] bg-white/60 rounded-full rotate-3`} /> // Smile
}


