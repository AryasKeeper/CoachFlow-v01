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
      users: {
        Row: {
          id: string
          email: string
          role: 'coach' | 'org' | 'admin'
          name: string | null
          phone: string | null
          created_at: string
          first_name: string | null
          last_name: string | null
        }
        Insert: {
          id: string
          email: string
          role: 'coach' | 'org' | 'admin'
          name?: string | null
          phone?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'coach' | 'org' | 'admin'
          name?: string | null
          phone?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          user_id: string
          bio: string | null
          gender: string | null
          specialties: string[]
          suburbs: string[]
          rate_hourly: number | null
          rate_flat: number | null
          travel_km: number | null
          wwcc_number: string | null
          wwcc_expiry: string | null
          insurance_url: string | null
          first_aid_url: string | null
          abn: string | null
          rating_avg: number | null
          rating_count: number
          availability: Json | null
          created_at: string
          // Additional fields from migrations
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          preferred_contact_method: string | null
          contact_availability: string | null
          linkedin_url: string | null
          years_experience: number | null
          coaching_philosophy: string | null
          achievements: string | null
          avatar_url: string | null
          primary_suburb: string | null
          service_radius_km: number | null
        }
        Insert: {
          user_id: string
          bio?: string | null
          gender?: string | null
          specialties?: string[]
          suburbs?: string[]
          rate_hourly?: number | null
          rate_flat?: number | null
          travel_km?: number | null
          wwcc_number?: string | null
          wwcc_expiry?: string | null
          insurance_url?: string | null
          first_aid_url?: string | null
          abn?: string | null
          rating_avg?: number | null
          rating_count?: number
          availability?: Json | null
          created_at?: string
          // Additional fields from migrations
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          preferred_contact_method?: string | null
          contact_availability?: string | null
          linkedin_url?: string | null
          years_experience?: number | null
          coaching_philosophy?: string | null
          achievements?: string | null
          avatar_url?: string | null
          primary_suburb?: string | null
          service_radius_km?: number | null
        }
        Update: {
          user_id?: string
          bio?: string | null
          gender?: string | null
          specialties?: string[]
          suburbs?: string[]
          rate_hourly?: number | null
          rate_flat?: number | null
          travel_km?: number | null
          wwcc_number?: string | null
          wwcc_expiry?: string | null
          insurance_url?: string | null
          first_aid_url?: string | null
          abn?: string | null
          rating_avg?: number | null
          rating_count?: number
          availability?: Json | null
          created_at?: string
          // Additional fields from migrations
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          preferred_contact_method?: string | null
          contact_availability?: string | null
          linkedin_url?: string | null
          years_experience?: number | null
          coaching_philosophy?: string | null
          achievements?: string | null
          avatar_url?: string | null
          primary_suburb?: string | null
          service_radius_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      org_profiles: {
        Row: {
          user_id: string
          org_name: string
          org_type: string | null
          suburbs: string[]
          created_at: string
          logo_url: string | null
          about_organization: string | null
          address: string | null
          facility_features: string[]
          website_url: string | null
          contact_phone: string | null
          team_culture: string | null
          program_details: string | null
          coaching_staff_size: number
          city: string | null
          state: string | null
          zip_code: string | null
          contact_person_name: string | null
          contact_person_title: string | null
          contact_email: string | null
        }
        Insert: {
          user_id: string
          org_name: string
          org_type?: string | null
          suburbs?: string[]
          created_at?: string
          logo_url?: string | null
          about_organization?: string | null
          address?: string | null
          facility_features?: string[]
          website_url?: string | null
          contact_phone?: string | null
          team_culture?: string | null
          program_details?: string | null
          coaching_staff_size?: number
          city?: string | null
          state?: string | null
          zip_code?: string | null
          contact_person_name?: string | null
          contact_person_title?: string | null
          contact_email?: string | null
        }
        Update: {
          user_id?: string
          org_name?: string
          org_type?: string | null
          suburbs?: string[]
          created_at?: string
          logo_url?: string | null
          about_organization?: string | null
          address?: string | null
          facility_features?: string[]
          website_url?: string | null
          contact_phone?: string | null
          team_culture?: string | null
          program_details?: string | null
          coaching_staff_size?: number
          city?: string | null
          state?: string | null
          zip_code?: string | null
          contact_person_name?: string | null
          contact_person_title?: string | null
          contact_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      listings: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string | null
          location: string
          suburbs: string[]
          dates: Json
          time_intervals: Json
          pay_min: number | null
          pay_max: number | null
          required_badges: string[]
          urgency: string | null
          gender_preference: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          description?: string | null
          location: string
          suburbs?: string[]
          dates: Json
          time_intervals: Json
          pay_min?: number | null
          pay_max?: number | null
          required_badges?: string[]
          urgency?: string | null
          gender_preference?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          description?: string | null
          location?: string
          suburbs?: string[]
          dates?: Json
          time_intervals?: Json
          pay_min?: number | null
          pay_max?: number | null
          required_badges?: string[]
          urgency?: string | null
          gender_preference?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      applications: {
        Row: {
          id: string
          listing_id: string
          coach_id: string
          message: string | null
          proposed_rate: number | null
          status: string
          created_at: string
          contact_revealed: boolean
          contact_revealed_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          coach_id: string
          message?: string | null
          proposed_rate?: number | null
          status?: string
          created_at?: string
          contact_revealed?: boolean
          contact_revealed_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          coach_id?: string
          message?: string | null
          proposed_rate?: number | null
          status?: string
          created_at?: string
          contact_revealed?: boolean
          contact_revealed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          listing_id: string
          org_id: string
          coach_id: string
          start_at: string
          end_at: string
          rate: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          org_id: string
          coach_id: string
          start_at: string
          end_at: string
          rate: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          org_id?: string
          coach_id?: string
          start_at?: string
          end_at?: string
          rate?: number
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          sender_id?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          subject_id: string
          subject_role: string
          plan: string
          reachouts_used: number
          reachouts_limit: number | null
          active_listings_limit: number | null
          renews_at: string | null
        }
        Insert: {
          id?: string
          subject_id: string
          subject_role: string
          plan?: string
          reachouts_used?: number
          reachouts_limit?: number | null
          active_listings_limit?: number | null
          renews_at?: string | null
        }
        Update: {
          id?: string
          subject_id?: string
          subject_role?: string
          plan?: string
          reachouts_used?: number
          reachouts_limit?: number | null
          active_listings_limit?: number | null
          renews_at?: string | null
        }
        Relationships: []
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
