import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { ThreadWithAuthor } from '../types'

// Demo threads for when Supabase is not configured
const demoThreads: ThreadWithAuthor[] = [
  {
    id: '1',
    category_id: '1',
    author_id: '1',
    title: 'Welcome to the Forum! Introduce yourself here',
    slug: 'welcome',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    is_pinned: true,
    is_locked: false,
    post_count: 42,
    last_post_at: new Date().toISOString(),
    author: { id: '1', username: 'admin', display_name: 'Admin', avatar_url: null, bio: null, created_at: '' },
    category: { id: '1', name: 'General', slug: 'general', description: '', sort_order: 0, created_at: '' },
  },
  {
    id: '2',
    category_id: '2',
    author_id: '1',
    title: 'Roadmap: Chat and Voice features coming soon!',
    slug: 'roadmap-chat-voice',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    is_pinned: true,
    is_locked: false,
    post_count: 15,
    last_post_at: new Date(Date.now() - 3600000).toISOString(),
    author: { id: '1', username: 'admin', display_name: 'Admin', avatar_url: null, bio: null, created_at: '' },
    category: { id: '2', name: 'Announcements', slug: 'announcements', description: '', sort_order: 1, created_at: '' },
  },
  {
    id: '3',
    category_id: '1',
    author_id: '2',
    title: 'What features would you like to see?',
    slug: 'feature-requests',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    is_pinned: false,
    is_locked: false,
    post_count: 28,
    last_post_at: new Date(Date.now() - 7200000).toISOString(),
    author: { id: '2', username: 'user1', display_name: 'Forum User', avatar_url: null, bio: null, created_at: '' },
    category: { id: '1', name: 'General', slug: 'general', description: '', sort_order: 0, created_at: '' },
  },
]

export default function Home() {
  const [threads, setThreads] = useState<ThreadWithAuthor[]>(demoThreads)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConfigured) return

    const fetchThreads = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('threads')
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .order('is_pinned', { ascending: false })
        .order('last_post_at', { ascending: false })
        .limit(20)

      if (data) setThreads(data as ThreadWithAuthor[])
      setLoading(false)
    }

    fetchThreads()
  }, [])

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
        <h1 className="text-3xl font-bold">Welcome to Forum</h1>
        <p className="mt-2 text-indigo-100">
          A modern community platform combining forums, real-time chat, and voice rooms.
        </p>
        {!isConfigured && (
          <div className="mt-4 rounded-lg bg-white/10 p-3 text-sm">
            <strong>Demo Mode:</strong> Connect to Supabase to enable full functionality.
          </div>
        )}
      </div>

      {/* Recent Threads */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Recent Discussions</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/t/${thread.id}`}
                className="flex items-start gap-4 px-4 py-4 transition-colors hover:bg-slate-700/30"
              >
                {/* Author Avatar */}
                <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-medium text-white">
                  {thread.author.display_name?.[0] || thread.author.username[0]}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {thread.is_pinned && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-400">
                        Pinned
                      </span>
                    )}
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                      {thread.category.name}
                    </span>
                  </div>
                  <h3 className="mt-1 font-medium text-white line-clamp-1">
                    {thread.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                    <span>{thread.author.display_name || thread.author.username}</span>
                    <span>·</span>
                    <span>{formatTimeAgo(thread.created_at)}</span>
                    <span>·</span>
                    <span>{thread.post_count} replies</span>
                  </div>
                </div>

                {/* Activity */}
                <div className="hidden shrink-0 text-right text-sm sm:block">
                  <div className="text-slate-400">Last activity</div>
                  <div className="text-slate-300">{formatTimeAgo(thread.last_post_at || thread.updated_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
