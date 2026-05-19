export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: string
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
        }
        Insert: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_missions: {
        Row: {
          class_id: string
          created_at: string
          current_value: number
          description: string
          end_date: string | null
          id: string
          mission_type: string
          reward_description: string | null
          start_date: string
          status: string
          target_value: number
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          current_value?: number
          description: string
          end_date?: string | null
          id?: string
          mission_type?: string
          reward_description?: string | null
          start_date?: string
          status?: string
          target_value?: number
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          current_value?: number
          description?: string
          end_date?: string | null
          id?: string
          mission_type?: string
          reward_description?: string | null
          start_date?: string
          status?: string
          target_value?: number
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_missions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          join_code: string
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          join_code?: string
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          join_code?: string
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      eco_actions: {
        Row: {
          action_key: string
          available: boolean
          carbon_reduction: number
          category: string
          coin_value: number
          created_at: string
          daily_limit: number | null
          description: string
          icon: string
          id: string
          name: string
          name_ko: string
          updated_at: string
        }
        Insert: {
          action_key: string
          available?: boolean
          carbon_reduction?: number
          category?: string
          coin_value?: number
          created_at?: string
          daily_limit?: number | null
          description: string
          icon?: string
          id?: string
          name: string
          name_ko: string
          updated_at?: string
        }
        Update: {
          action_key?: string
          available?: boolean
          carbon_reduction?: number
          category?: string
          coin_value?: number
          created_at?: string
          daily_limit?: number | null
          description?: string
          icon?: string
          id?: string
          name?: string
          name_ko?: string
          updated_at?: string
        }
        Relationships: []
      }
      mining_records: {
        Row: {
          action_id: string
          carbon_saved: number
          coins_earned: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_id: string
          carbon_saved: number
          coins_earned: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_id?: string
          carbon_saved?: number
          coins_earned?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          total_carbon_saved: number
          total_coins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          class_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          total_carbon_saved?: number
          total_coins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          class_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          total_carbon_saved?: number
          total_coins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_requests: {
        Row: {
          created_at: string
          id: string
          reward_id: string
          status: string
          teacher_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward_id: string
          status?: string
          teacher_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reward_id?: string
          status?: string
          teacher_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_requests_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          available: boolean
          category: string
          cost: number
          created_at: string
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          available?: boolean
          category: string
          cost: number
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          available?: boolean
          category?: string
          cost?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reward_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reward_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reward_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_profile_totals: {
        Args: { _carbon: number; _coins: number; _user_id: string }
        Returns: undefined
      }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "super_admin" | "mini_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "super_admin", "mini_admin"],
    },
  },
} as const
