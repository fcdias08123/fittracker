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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string | null
          dificuldade: string
          explicacao: string
          grupo_muscular: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          dificuldade: string
          explicacao: string
          grupo_muscular: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          dificuldade?: string
          explicacao?: string
          grupo_muscular?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      model_workouts: {
        Row: {
          created_at: string | null
          descricao_curta: string | null
          dias_semana_sugeridos: number | null
          estrutura: Json | null
          id: string
          nivel: string
          objetivo: string
          tipo_divisao: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao_curta?: string | null
          dias_semana_sugeridos?: number | null
          estrutura?: Json | null
          id?: string
          nivel: string
          objetivo: string
          tipo_divisao?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao_curta?: string | null
          dias_semana_sugeridos?: number | null
          estrutura?: Json | null
          id?: string
          nivel?: string
          objetivo?: string
          tipo_divisao?: string | null
          titulo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          altura: number | null
          created_at: string
          dias_treino: string[] | null
          id: string
          idade: number | null
          nivel: string | null
          nome: string | null
          objetivo: string | null
          peso: number | null
          sexo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          altura?: number | null
          created_at?: string
          dias_treino?: string[] | null
          id?: string
          idade?: number | null
          nivel?: string | null
          nome?: string | null
          objetivo?: string | null
          peso?: number | null
          sexo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          altura?: number | null
          created_at?: string
          dias_treino?: string[] | null
          id?: string
          idade?: number | null
          nivel?: string | null
          nome?: string | null
          objetivo?: string | null
          peso?: number | null
          sexo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_entries: {
        Row: {
          created_at: string | null
          data_registro: string
          foto_url: string | null
          id: string
          observacoes: string | null
          peso: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_registro: string
          foto_url?: string | null
          id?: string
          observacoes?: string | null
          peso: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_registro?: string
          foto_url?: string | null
          id?: string
          observacoes?: string | null
          peso?: number
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          carga: number | null
          created_at: string | null
          exercise_id: string
          id: string
          observacoes: string | null
          ordem: number
          repeticoes: number
          series: number
          workout_id: string
        }
        Insert: {
          carga?: number | null
          created_at?: string | null
          exercise_id: string
          id?: string
          observacoes?: string | null
          ordem: number
          repeticoes: number
          series: number
          workout_id: string
        }
        Update: {
          carga?: number | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          observacoes?: string | null
          ordem?: number
          repeticoes?: number
          series?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_history: {
        Row: {
          created_at: string | null
          data_realizado: string
          id: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          data_realizado: string
          id?: string
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          data_realizado?: string
          id?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_history_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          dias_semana: string[]
          id: string
          nome: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dias_semana: string[]
          id?: string
          nome: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dias_semana?: string[]
          id?: string
          nome?: string
          updated_at?: string | null
          user_id?: string
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
    Enums: {},
  },
} as const
