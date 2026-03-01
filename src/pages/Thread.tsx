import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { ThreadWithAuthor, PostWithAuthor } from '../types'

// Demo data
const demoThread: ThreadWithAuthor = {
  id: '1',
  category_id: '1',
  author_id: '1',
  title: 'Welcome to the Forum! Introduce yourself here',
  slug: 'welcome',
  created_at: new Date(Date.now() - 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  is_pinned: true,
  is_locked: false,
  post_count: 3,
  last_post_at: new Date().toISOString(),
  author: { id: '1', username: 'admin', display_name: 'Admin', avatar_url: null, bio: null, created_at: '' },
  category: { id: '1', name: 'General', slug: 'general', description: '', sort_order: 0, created_at: '' },
}

const demoPosts: PostWithAuthor[] = [
  {
    id: '1',
    thread_id: '1',
    author_id: '1',
    content: "Welcome to our new forum! This is a hybrid platform combining the best of traditional forums with real-time chat and voice rooms.\n\n**What's coming:**\n- Real-time chat channels\n- Voice rooms for hanging out\n- Full customization options\n- Federation with other instances\n\nFeel free to introduce yourself below!",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    reply_to_id: null,
    author: { id: '1', username: 'admin', display_name: 'Admin', avatar_url: null, bio: null, created_at: '' },
  },
  {
    id: '2',
    thread_id: '1',
    author_id: '2',
    content: "This looks amazing! I've been looking for something like this - forums + Discord features in one place. Can't wait to see how this develops!",
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    reply_to_id: null,
    author: { id: '2', username: 'user1', display_name: 'Forum User', avatar_url: null, bio: null, created_at: '' },
  },
]

export default function Thread() {
  const { threadId } = useParams()
  const { user } = useAuth()
  const [thread, setThread] = useState<ThreadWithAuthor | null>(null)
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isConfigured) {
      setThread(demoThread)
      setPosts(demoPosts)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)

      // Fetch thread
      const { data: threadData } = await supabase
        .from('threads')
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .eq('id', threadId!)
        .single()

      if (threadData) {
        setThread(threadData as ThreadWithAuthor)

        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles(*)
          `)
          .eq('thread_id', threadId!)
          .order('created_at')

        if (postsData) setPosts(postsData as PostWithAuthor[])
      }

      setLoading(false)
    }

    fetchData()

    // Set up real-time subscription
    if (isConfigured) {
      const subscription = supabase
        .channel(`thread:${threadId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts', filter: `thread_id=eq.${threadId}` },
          async (payload) => {
            // Fetch the new post with author
            const { data } = await supabase
              .from('posts')
              .select('*, author:profiles(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setPosts((prev) => [...prev, data as PostWithAuthor])
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [threadId])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !thread || !replyContent.trim() || !isConfigured) return

    setSubmitting(true)

    const { error } = await supabase.from('posts').insert({
      thread_id: thread.id,
      author_id: user.id,
      content: replyContent.trim(),
    })

    if (!error) {
      setReplyContent('')
      // Update thread's last_post_at
      await supabase
        .from('threads')
        .update({ last_post_at: new Date().toISOString(), post_count: thread.post_count + 1 })
        .eq('id', thread.id)
    }

    setSubmitting(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-3/4 rounded bg-slate-700" />
          <div className="h-32 rounded bg-slate-700" />
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-bold text-white">Thread not found</h1>
        <p className="mt-2 text-slate-400">The thread you're looking for doesn't exist.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">
          Go back home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-white">Home</Link>
        <span>/</span>
        <Link to={`/c/${thread.category.slug}`} className="hover:text-white">{thread.category.name}</Link>
      </div>

      {/* Thread Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          {thread.is_pinned && (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
              Pinned
            </span>
          )}
          {thread.is_locked && (
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
              Locked
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">{thread.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
          <span>Started by {thread.author.display_name || thread.author.username}</span>
          <span>·</span>
          <span>{formatDate(thread.created_at)}</span>
          <span>·</span>
          <span>{thread.post_count} {thread.post_count === 1 ? 'reply' : 'replies'}</span>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <div key={post.id} className="rounded-xl border border-slate-700 bg-slate-800/50">
            <div className="flex gap-4 p-4">
              {/* Author */}
              <div className="hidden shrink-0 sm:block">
                <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-lg font-medium text-white">
                  {post.author.display_name?.[0] || post.author.username[0]}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    {post.author.display_name || post.author.username}
                  </span>
                  {index === 0 && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-400">
                      OP
                    </span>
                  )}
                  <span className="text-sm text-slate-500">
                    {formatDate(post.created_at)}
                  </span>
                </div>
                <div className="mt-3 prose prose-invert prose-sm max-w-none text-slate-300">
                  {post.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line || <br />}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {thread.is_locked ? (
        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center text-slate-400">
          This thread is locked. No new replies can be posted.
        </div>
      ) : user ? (
        <form onSubmit={handleReply} className="mt-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              className="block w-full resize-none rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={!isConfigured}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !replyContent.trim() || !isConfigured}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p className="text-slate-400">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
            {' '}to reply to this thread.
          </p>
        </div>
      )}
    </div>
  )
}
