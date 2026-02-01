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
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          note: string | null
          payment_date: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          note?: string | null
          payment_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          note?: string | null
          payment_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          id: string
          installment_amount: number
          installments_remaining: number
          installments_total: number
          interest_rate: number
          name: string
          period_months: number
          start_date: string
          status: Database["public"]["Enums"]["debt_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          installment_amount?: number
          installments_remaining?: number
          installments_total?: number
          interest_rate?: number
          name: string
          period_months?: number
          start_date?: string
          status?: Database["public"]["Enums"]["debt_status"]
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          installment_amount?: number
          installments_remaining?: number
          installments_total?: number
          interest_rate?: number
          name?: string
          period_months?: number
          start_date?: string
          status?: Database["public"]["Enums"]["debt_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          expense_date: string | null
          id: string
          is_paid: boolean
          reminder_channel:
            | Database["public"]["Enums"]["reminder_channel"]
            | null
          reminder_days_before: number | null
          reminder_enabled: boolean
          type: Database["public"]["Enums"]["expense_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          expense_date?: string | null
          id?: string
          is_paid?: boolean
          reminder_channel?:
            | Database["public"]["Enums"]["reminder_channel"]
            | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean
          type?: Database["public"]["Enums"]["expense_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          expense_date?: string | null
          id?: string
          is_paid?: boolean
          reminder_channel?:
            | Database["public"]["Enums"]["reminder_channel"]
            | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean
          type?: Database["public"]["Enums"]["expense_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          created_at: string
          frequency: string
          gross_amount: number
          id: string
          net_amount: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_budget_members: {
        Row: {
          budget_id: string
          contribution_percentage: number | null
          created_at: string
          id: string
          invitation_status: Database["public"]["Enums"]["invitation_status"]
          invited_email: string | null
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          budget_id: string
          contribution_percentage?: number | null
          created_at?: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status"]
          invited_email?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          budget_id?: string
          contribution_percentage?: number | null
          created_at?: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status"]
          invited_email?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_budget_members_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "shared_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_budgets: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_expenses: {
        Row: {
          amount: number
          budget_id: string
          category: string
          created_at: string
          created_by: string
          description: string | null
          expense_date: string
          id: string
          is_paid: boolean
          paid_by: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          budget_id: string
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          expense_date?: string
          id?: string
          is_paid?: boolean
          paid_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_id?: string
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_paid?: boolean
          paid_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "shared_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_budget_member: {
        Args: { budget_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      debt_status: "active" | "paid" | "defaulted"
      expense_type: "fixed" | "variable"
      invitation_status: "pending" | "accepted" | "rejected"
      member_role: "owner" | "member"
      reminder_channel: "sms" | "email"
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
      debt_status: ["active", "paid", "defaulted"],
      expense_type: ["fixed", "variable"],
      invitation_status: ["pending", "accepted", "rejected"],
      member_role: ["owner", "member"],
      reminder_channel: ["sms", "email"],
    },
  },
} as const
