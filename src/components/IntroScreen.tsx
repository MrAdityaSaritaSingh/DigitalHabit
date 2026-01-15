import { useState } from 'react'
import { PlusCircle, Link, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface IntroScreenProps {
    onJoin: (token: string) => void
    onCreate: () => void
    isLoading?: boolean
    error?: string | null
}

export function IntroScreen({ onJoin, isLoading, error }: IntroScreenProps) {
    const [mode, setMode] = useState<'welcome' | 'join' | 'create'>('welcome')
    const [token, setToken] = useState('')

    const SHEET_TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/16JX4GjLuuVKf3rWxQhvTBASgP4DrFNOQnNpLEdnYe2I/copy"

    return (
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-4xl font-bold tracking-tighter">Digital Totem</h1>
                <p className="text-muted-foreground">The shared habit tracker for your tribe.</p>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-medium animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}
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
                                    disabled={!token.startsWith('http') || isLoading}
                                    className="flex-1 bg-primary text-primary-foreground h-12 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Connecting...' : 'Connect'}
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
                            <div className="p-4 bg-secondary/30 rounded-xl space-y-4">
                                {/* Step 1: Copy */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="font-bold text-sm pt-1.5">Get the Template</h3>
                                        <p className="text-xs text-muted-foreground">Copy our Google Sheet. It comes with the backend code pre-installed.</p>
                                        <button
                                            onClick={() => window.open(SHEET_TEMPLATE_URL, '_blank')}
                                            className="w-full mt-2 py-2 border border-primary/20 bg-primary/5 text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            Make a Copy
                                        </button>
                                    </div>
                                </div>

                                {/* Step 2: Deploy */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="font-bold text-sm pt-1.5">Deploy as API</h3>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>In your new sheet:</p>
                                            <ol className="list-decimal list-inside opacity-80 pl-1 space-y-0.5">
                                                <li>Go to <strong>Extensions {'>'} Apps Script</strong></li>
                                                <li>Click <strong>Deploy {'>'} New Deployment</strong></li>
                                                <li>Select type: <strong>Web App</strong></li>
                                                <li>Who has access: <strong>Anyone</strong></li>
                                                <li>Click <strong>Deploy</strong> and copy the URL</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Connect */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="font-bold text-sm pt-1.5">Connect Tribe</h3>
                                        <input
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            placeholder="Paste Web App URL here..."
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>
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
                                    disabled={!token.startsWith('http') || isLoading}
                                    className="flex-1 bg-primary text-primary-foreground h-12 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Verifying...' : 'Create Tribe'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
