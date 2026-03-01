export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      threads: {
        Row: {
          id: string
          category_id: string
          author_id: string
          title: string
          slug: string
          created_at: string
          updated_at: string
          is_pinned: boolean
          is_locked: boolean
          post_count: number
          last_post_at: string | null
        }
        Insert: {
          id?: string
          category_id: string
          author_id: string
          title: string
          slug: string
          created_at?: string
          updated_at?: string
          is_pinned?: boolean
          is_locked?: boolean
          post_count?: number
          last_post_at?: string | null
        }
        Update: {
          category_id?: string
          title?: string
          slug?: string
          updated_at?: string
          is_pinned?: boolean
          is_locked?: boolean
          post_count?: number
          last_post_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          thread_id: string
          author_id: string
          content: string
          created_at: string
          updated_at: string
          reply_to_id: string | null
        }
        Insert: {
          id?: string
          thread_id: string
          author_id: string
          content: string
          created_at?: string
          updated_at?: string
          reply_to_id?: string | null
        }
        Update: {
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Thread = Database['public']['Tables']['threads']['Row']
export type Post = Database['public']['Tables']['posts']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ThreadInsert = Database['public']['Tables']['threads']['Insert']
export type PostInsert = Database['public']['Tables']['posts']['Insert']

// Extended types with joins
export interface ThreadWithAuthor extends Thread {
  author: Profile
  category: Category
}

export interface PostWithAuthor extends Post {
  author: Profile
}
