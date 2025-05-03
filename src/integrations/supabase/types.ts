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
      emergencies: {
        Row: {
          created_at: string | null
          description: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          patient_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          patient_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          patient_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      emergency_responses: {
        Row: {
          created_at: string | null
          emergency_id: string
          id: string
          responder_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          emergency_id: string
          id?: string
          responder_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          emergency_id?: string
          id?: string
          responder_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_responses_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
        ]
      }
      frontline_types: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          certification_details: Json | null
          email: string | null
          frontline_type: number | null
          full_name: string | null
          id: string
          is_frontline_worker: boolean | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          certification_details?: Json | null
          email?: string | null
          frontline_type?: number | null
          full_name?: string | null
          id: string
          is_frontline_worker?: boolean | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          certification_details?: Json | null
          email?: string | null
          frontline_type?: number | null
          full_name?: string | null
          id?: string
          is_frontline_worker?: boolean | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_frontline_type_fkey"
            columns: ["frontline_type"]
            isOneToOne: false
            referencedRelation: "frontline_types"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          section: string
          thumbnail: string | null
          title: string
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          section: string
          thumbnail?: string | null
          title: string
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          section?: string
          thumbnail?: string | null
          title?: string
          url?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
