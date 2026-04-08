export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          department: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          department?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          department?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string
          rating: number
          comment: string
          photo_url: string | null
          purpose_tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_id: string
          rating: number
          comment: string
          photo_url?: string | null
          purpose_tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_id?: string
          rating?: number
          comment?: string
          photo_url?: string | null
          purpose_tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
