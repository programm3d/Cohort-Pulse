import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../api/client';
import { Trophy, Star, Send, Search, X, Loader2, Users } from 'lucide-react';

interface Peer {
    _id: string;
    name: string;
}

const WinWall: React.FC = () => {
    const [shoutouts, setShoutouts] = useState<any[]>([]);

    // Search combobox state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Peer[]>([]);
    const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchShoutouts = async () => {
            try {
                const res = await apiClient.get('/communication/shoutouts');
                setShoutouts(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchShoutouts();
    }, []);

    const searchPeers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            const res = await apiClient.get(`/cohorts/peers?name=${encodeURIComponent(query.trim())}`);
            setSearchResults(res.data);
            setShowDropdown(true);
        } catch (err) {
            console.error(err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        setSelectedPeer(null);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => searchPeers(val), 300);
    };

    const handleSelectPeer = (peer: Peer) => {
        setSelectedPeer(peer);
        setSearchQuery(peer.name);
        setShowDropdown(false);
        setSearchResults([]);
    };

    const handleClearPeer = () => {
        setSelectedPeer(null);
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleShoutout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPeer) return;
        setError('');
        try {
            await apiClient.post('/communication/shoutouts', {
                toInternId: selectedPeer._id,
                message
            });
            setMessage('');
            handleClearPeer();
            const res = await apiClient.get('/communication/shoutouts');
            setShoutouts(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to post shoutout');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in py-6">
            <div className="text-center space-y-2 mb-10">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 flex items-center justify-center gap-3">
                    <Trophy className="text-yellow-400" size={36} /> The Win Wall
                </h2>
                <p className="text-slate-400 text-lg">Celebrating milestones and cheering on peers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Post a Shoutout Panel */}
                <div className="md:col-span-1">
                    <form onSubmit={handleShoutout} className="bg-gradient-to-br from-surface to-slate-800 border-l-4 border-l-yellow-500 rounded-r-2xl p-6 shadow-xl sticky top-24">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Star size={18} className="text-yellow-500" /> Give a Shoutout
                        </h3>

                        {error && (
                            <div className="mb-3 bg-red-500/20 text-red-400 p-2.5 rounded-lg text-xs">{error}</div>
                        )}

                        <div className="space-y-4">
                            {/* Search combobox */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                                    Shout out to…
                                </label>
                                <div className={`flex items-center gap-2 w-full bg-background/50 border rounded-lg px-3 py-2 transition-colors ${selectedPeer ? 'border-yellow-500' : showDropdown ? 'border-yellow-500/70' : 'border-slate-600'}`}>
                                    {isSearching ? (
                                        <Loader2 size={14} className="text-yellow-400 animate-spin shrink-0" />
                                    ) : selectedPeer ? (
                                        <Users size={14} className="text-yellow-400 shrink-0" />
                                    ) : (
                                        <Search size={14} className="text-slate-500 shrink-0" />
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Search by name…"
                                        className="flex-1 bg-transparent text-sm outline-none text-slate-100 placeholder:text-slate-500"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => { if (searchQuery && !selectedPeer) setShowDropdown(true); }}
                                        autoComplete="off"
                                    />
                                    {searchQuery && (
                                        <button type="button" onClick={handleClearPeer} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown results */}
                                {showDropdown && (
                                    <div className="absolute z-50 w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                                        {searchResults.length === 0 ? (
                                            <div className="px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                                                <Users size={13} />
                                                No cohort-mates found
                                            </div>
                                        ) : (
                                            <ul className="max-h-48 overflow-y-auto divide-y divide-slate-700/50">
                                                {searchResults.map(peer => (
                                                    <li key={peer._id}>
                                                        <button
                                                            type="button"
                                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-yellow-500/10 hover:text-yellow-300 transition-colors flex items-center gap-2"
                                                            onMouseDown={() => handleSelectPeer(peer)}
                                                        >
                                                            <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                                {peer.name.charAt(0).toUpperCase()}
                                                            </span>
                                                            {peer.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            <textarea
                                required
                                rows={3}
                                placeholder="They helped me with…"
                                className="w-full bg-background/50 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-yellow-500 outline-none resize-none transition-colors"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />

                            <button
                                type="submit"
                                disabled={!selectedPeer || !message.trim()}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                            >
                                <Send size={16} /> Publish Shoutout
                            </button>
                        </div>
                    </form>
                </div>

                {/* Wall Feed */}
                <div className="md:col-span-2 space-y-4">
                    {shoutouts.length === 0 ? (
                        <div className="text-center py-16 bg-surface/20 rounded-2xl border border-slate-700/30 border-dashed">
                            <p className="text-slate-500">Be the first to shout out a peer! 🎉</p>
                        </div>
                    ) : (
                        shoutouts.map((s: any) => (
                            <div key={s._id} className="relative bg-surface/50 border border-slate-700 p-5 rounded-2xl overflow-hidden hover:bg-surface/80 transition-colors">
                                <div className="absolute -top-6 -right-6 text-yellow-500/10">
                                    <Star size={100} fill="currentColor" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm text-slate-400 mb-1">
                                        <span className="font-semibold text-slate-200">{s.fromInternId?.name}</span> shouted out <span className="font-semibold text-yellow-400">{s.toInternId?.name}</span>
                                    </p>
                                    <p className="text-slate-100 italic text-lg mt-2">"{s.message}"</p>
                                    <p className="text-xs text-slate-500 mt-4">{new Date(s.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WinWall;
