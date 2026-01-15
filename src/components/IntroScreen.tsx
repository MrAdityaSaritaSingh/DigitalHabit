import { useState } from 'react'
import { PlusCircle, Link, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface IntroScreenProps {
    onJoin: (token: string) => void
    onCreate: () => void
}

export function IntroScreen({ onJoin }: IntroScreenProps) {
    const [mode, setMode] = useState<'welcome' | 'join' | 'create'>('welcome')
    const [token, setToken] = useState('')
    const [copied, setCopied] = useState(false)

    // Mock Template URL
    const SHEET_TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/your-template-id/copy"

    const copyTemplate = () => {
        navigator.clipboard.writeText(SHEET_TEMPLATE_URL)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-4xl font-bold tracking-tighter">Digital Totem</h1>
                <p className="text-muted-foreground">The shared habit tracker for your tribe.</p>
            </div>

            <div className="bg-card border rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <AnimatePresence mode='wait'>
                    {/* WELCOME MODE */}
                    {mode === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <button
                                onClick={() => setMode('join')}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Link className="w-5 h-5" />
                                Join a Tribe
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-muted/20" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setMode('create')}
                                className="w-full py-4 bg-secondary text-secondary-foreground rounded-xl font-bold text-lg hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Create New Tribe
                            </button>
                        </motion.div>
                    )}

                    {/* JOIN MODE */}
                    {mode === 'join' && (
                        <motion.div
                            key="join"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Paste your Tribe Token</label>
                                <input
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="https://script.google.com/..."
                                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <p className="text-xs text-muted-foreground">Get this URL from your tribe leader.</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setMode('welcome')}
                                    className="flex-1 bg-secondary text-secondary-foreground h-12 rounded-lg font-bold hover:opacity-90 transition-opacity"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => onJoin(token)}
                                    disabled={!token.startsWith('http')}
                                    className="flex-1 bg-primary text-primary-foreground h-12 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Connect
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* CREATE MODE */}
                    {mode === 'create' && (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-600 dark:text-yellow-400">
                                <h3 className="font-bold mb-1">How it works</h3>
                                <ol className="list-decimal list-inside space-y-1 opacity-90">
                                    <li>Copy our Google Sheet Template</li>
                                    <li>Deploy it as a Web App</li>
                                    <li>Paste the URL here to begin</li>
                                </ol>
                            </div>

                            <button
                                onClick={copyTemplate}
                                className="w-full py-3 border border-dashed border-primary/50 text-primary rounded-xl font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 group"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                {copied ? 'Copied!' : 'Copy Template URL'}
                            </button>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Your Web App URL</label>
                                <input
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="https://script.google.com/..."
                                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setMode('welcome')}
                                    className="flex-1 bg-secondary text-secondary-foreground h-12 rounded-lg font-bold hover:opacity-90 transition-opacity"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => onJoin(token)}
                                    disabled={!token.startsWith('http')}
                                    className="flex-1 bg-primary text-primary-foreground h-12 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Tribe
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
