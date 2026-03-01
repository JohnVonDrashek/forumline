import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { Profile, ThreadWithAuthor } from '../types'

const demoProfile: Profile = {
  id: '1',
  username: 'admin',
  display_name: 'Admin',
  avatar_url: null,
  bio: 'Welcome to the forum! I am the administrator.',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
}

export default function ProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [threads, setThreads] = useState<ThreadWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setProfile(demoProfile)
      setThreads([])
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      setLoading(true)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username!)
        .single()

      if (profileData) {
        setProfile(profileData)

        // Fetch user's threads
        const { data: threadsData } = await supabase
          .from('threads')
          .select(`
            *,
            author:profiles(*),
            category:categories(*)
          `)
          .eq('author_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (threadsData) setThreads(threadsData as ThreadWithAuthor[])
      }

      setLoading(false)
    }

    fetchProfile()
  }, [username])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="animate-pulse">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-slate-700" />
            <div>
              <div className="h-8 w-48 rounded bg-slate-700" />
              <div className="mt-2 h-4 w-32 rounded bg-slate-700" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-bold text-white">User not found</h1>
        <p className="mt-2 text-slate-400">The user you're looking for doesn't exist.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">
          Go back home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Profile Header */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 shrink-0 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white">
            {profile.display_name?.[0] || profile.username[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-slate-400">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-3 text-slate-300">{profile.bio}</p>
            )}
            <p className="mt-3 text-sm text-slate-500">
              Joined {formatDate(profile.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* User's Threads */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Threads</h2>
        {threads.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
            No threads yet.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 divide-y divide-slate-700/50">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/t/${thread.id}`}
                className="block px-4 py-4 transition-colors hover:bg-slate-700/30"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                    {thread.category.name}
                  </span>
                </div>
                <h3 className="mt-1 font-medium text-white">{thread.title}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {formatDate(thread.created_at)} · {thread.post_count} replies
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
