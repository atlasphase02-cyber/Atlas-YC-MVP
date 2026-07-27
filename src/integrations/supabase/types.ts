export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      adjusters: {
        Row: {
          avg_response_hours: number | null;
          carrier_id: string | null;
          created_at: string;
          email: string | null;
          embedding: string | null;
          embedding_updated_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avg_response_hours?: number | null;
          carrier_id?: string | null;
          created_at?: string;
          email?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avg_response_hours?: number | null;
          carrier_id?: string | null;
          created_at?: string;
          email?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "adjusters_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          claim_id: string | null;
          created_at: string;
          ends_at: string | null;
          id: string;
          kind: Database["public"]["Enums"]["appointment_kind"];
          location: string | null;
          owner_id: string;
          starts_at: string;
          title: string;
          who: string | null;
        };
        Insert: {
          claim_id?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["appointment_kind"];
          location?: string | null;
          owner_id: string;
          starts_at: string;
          title: string;
          who?: string | null;
        };
        Update: {
          claim_id?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["appointment_kind"];
          location?: string | null;
          owner_id?: string;
          starts_at?: string;
          title?: string;
          who?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          detail: Json | null;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          detail?: Json | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          detail?: Json | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      carriers: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      claim_comments: {
        Row: {
          body: string;
          claim_id: string;
          created_at: string;
          id: string;
          is_internal: boolean;
          owner_id: string;
        };
        Insert: {
          body: string;
          claim_id: string;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          owner_id: string;
        };
        Update: {
          body?: string;
          claim_id?: string;
          created_at?: string;
          id?: string;
          is_internal?: boolean;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claim_comments_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      claim_events: {
        Row: {
          claim_id: string;
          created_at: string;
          detail: string | null;
          id: string;
          kind: string;
          owner_id: string;
        };
        Insert: {
          claim_id: string;
          created_at?: string;
          detail?: string | null;
          id?: string;
          kind: string;
          owner_id: string;
        };
        Update: {
          claim_id?: string;
          created_at?: string;
          detail?: string | null;
          id?: string;
          kind?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claim_events_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      claims: {
        Row: {
          adjuster_id: string | null;
          amount_cents: number;
          archived_at: string | null;
          carrier_id: string | null;
          claim_number: string;
          created_at: string;
          customer_id: string | null;
          description: string | null;
          embedding: string | null;
          embedding_updated_at: string | null;
          id: string;
          loss_date: string | null;
          owner_id: string;
          status: Database["public"]["Enums"]["claim_status"];
          updated_at: string;
        };
        Insert: {
          adjuster_id?: string | null;
          amount_cents?: number;
          archived_at?: string | null;
          carrier_id?: string | null;
          claim_number: string;
          created_at?: string;
          customer_id?: string | null;
          description?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          loss_date?: string | null;
          owner_id: string;
          status?: Database["public"]["Enums"]["claim_status"];
          updated_at?: string;
        };
        Update: {
          adjuster_id?: string | null;
          amount_cents?: number;
          archived_at?: string | null;
          carrier_id?: string | null;
          claim_number?: string;
          created_at?: string;
          customer_id?: string | null;
          description?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          loss_date?: string | null;
          owner_id?: string;
          status?: Database["public"]["Enums"]["claim_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claims_adjuster_id_fkey";
            columns: ["adjuster_id"];
            isOneToOne: false;
            referencedRelation: "adjusters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_carrier_id_fkey";
            columns: ["carrier_id"];
            isOneToOne: false;
            referencedRelation: "carriers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      company_settings: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          integrations: Json;
          logo_url: string | null;
          name: string;
          primary_color: string | null;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          integrations?: Json;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          integrations?: Json;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          archived_at: string | null;
          created_at: string;
          embedding: string | null;
          embedding_updated_at: string | null;
          id: string;
          last_message_at: string;
          owner_id: string;
          page_context: Json;
          pinned: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          last_message_at?: string;
          owner_id: string;
          page_context?: Json;
          pinned?: boolean;
          title?: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          last_message_at?: string;
          owner_id?: string;
          page_context?: Json;
          pinned?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          email: string | null;
          embedding: string | null;
          embedding_updated_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          phone: string | null;
          state: string | null;
          updated_at: string;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id: string;
          phone?: string | null;
          state?: string | null;
          updated_at?: string;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          state?: string | null;
          updated_at?: string;
          zip?: string | null;
        };
        Relationships: [];
      };
      document_versions: {
        Row: {
          created_at: string;
          document_id: string;
          id: string;
          mime_type: string | null;
          owner_id: string;
          size_bytes: number | null;
          storage_path: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          document_id: string;
          id?: string;
          mime_type?: string | null;
          owner_id: string;
          size_bytes?: number | null;
          storage_path: string;
          version: number;
        };
        Update: {
          created_at?: string;
          document_id?: string;
          id?: string;
          mime_type?: string | null;
          owner_id?: string;
          size_bytes?: number | null;
          storage_path?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          claim_id: string | null;
          created_at: string;
          customer_id: string | null;
          embedding: string | null;
          embedding_updated_at: string | null;
          folder: string;
          id: string;
          mime_type: string | null;
          name: string;
          ocr_status: string;
          owner_id: string;
          size_bytes: number | null;
          storage_path: string | null;
          tags: string[];
          version: number;
        };
        Insert: {
          claim_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          folder?: string;
          id?: string;
          mime_type?: string | null;
          name: string;
          ocr_status?: string;
          owner_id: string;
          size_bytes?: number | null;
          storage_path?: string | null;
          tags?: string[];
          version?: number;
        };
        Update: {
          claim_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          folder?: string;
          id?: string;
          mime_type?: string | null;
          name?: string;
          ocr_status?: string;
          owner_id?: string;
          size_bytes?: number | null;
          storage_path?: string | null;
          tags?: string[];
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "documents_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      embedding_queue: {
        Row: {
          attempts: number;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          last_error: string | null;
          owner_id: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          last_error?: string | null;
          owner_id: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          last_error?: string | null;
          owner_id?: string;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          action_items: Json;
          claim_id: string | null;
          completed_at: string | null;
          created_at: string;
          customer_id: string | null;
          id: string;
          insights: string | null;
          owner_id: string;
          status: string;
          summary: string | null;
          title: string;
          transcript: Json;
          updated_at: string;
        };
        Insert: {
          action_items?: Json;
          claim_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          insights?: string | null;
          owner_id: string;
          status?: string;
          summary?: string | null;
          title?: string;
          transcript?: Json;
          updated_at?: string;
        };
        Update: {
          action_items?: Json;
          claim_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          insights?: string | null;
          owner_id?: string;
          status?: string;
          summary?: string | null;
          title?: string;
          transcript?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interviews_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          owner_id: string;
          parts: Json | null;
          role: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          owner_id: string;
          parts?: Json | null;
          role: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          parts?: Json | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          body: string;
          claim_id: string | null;
          created_at: string;
          embedding: string | null;
          embedding_updated_at: string | null;
          id: string;
          owner_id: string;
        };
        Insert: {
          body: string;
          claim_id?: string | null;
          created_at?: string;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          owner_id: string;
        };
        Update: {
          body?: string;
          claim_id?: string | null;
          created_at?: string;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          appointment_reminders: boolean;
          claim_updates: boolean;
          email_enabled: boolean;
          in_app_enabled: boolean;
          supplement_updates: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          appointment_reminders?: boolean;
          claim_updates?: boolean;
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          supplement_updates?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          appointment_reminders?: boolean;
          claim_updates?: boolean;
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          supplement_updates?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link_to: string | null;
          owner_id: string;
          read_at: string | null;
          title: string;
          tone: Database["public"]["Enums"]["notification_tone"];
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link_to?: string | null;
          owner_id: string;
          read_at?: string | null;
          title: string;
          tone?: Database["public"]["Enums"]["notification_tone"];
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link_to?: string | null;
          owner_id?: string;
          read_at?: string | null;
          title?: string;
          tone?: Database["public"]["Enums"]["notification_tone"];
        };
        Relationships: [];
      };
      photos: {
        Row: {
          caption: string | null;
          claim_id: string | null;
          created_at: string;
          id: string;
          owner_id: string;
          storage_path: string;
        };
        Insert: {
          caption?: string | null;
          claim_id?: string | null;
          created_at?: string;
          id?: string;
          owner_id: string;
          storage_path: string;
        };
        Update: {
          caption?: string | null;
          claim_id?: string | null;
          created_at?: string;
          id?: string;
          owner_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photos_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          company_name: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplement_items: {
        Row: {
          ai_confidence: number | null;
          ai_reason: string | null;
          ai_suggested: boolean;
          created_at: string;
          description: string;
          id: string;
          owner_id: string;
          quantity: number;
          supplement_id: string;
          unit_price_cents: number;
        };
        Insert: {
          ai_confidence?: number | null;
          ai_reason?: string | null;
          ai_suggested?: boolean;
          created_at?: string;
          description: string;
          id?: string;
          owner_id: string;
          quantity?: number;
          supplement_id: string;
          unit_price_cents?: number;
        };
        Update: {
          ai_confidence?: number | null;
          ai_reason?: string | null;
          ai_suggested?: boolean;
          created_at?: string;
          description?: string;
          id?: string;
          owner_id?: string;
          quantity?: number;
          supplement_id?: string;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "supplement_items_supplement_id_fkey";
            columns: ["supplement_id"];
            isOneToOne: false;
            referencedRelation: "supplements";
            referencedColumns: ["id"];
          },
        ];
      };
      supplements: {
        Row: {
          ai_confidence: number | null;
          ai_recommendations: Json;
          ai_summary: string | null;
          claim_id: string;
          created_at: string;
          embedding: string | null;
          embedding_updated_at: string | null;
          id: string;
          owner_id: string;
          status: Database["public"]["Enums"]["supplement_status"];
          summary: string | null;
          total_cents: number;
          updated_at: string;
        };
        Insert: {
          ai_confidence?: number | null;
          ai_recommendations?: Json;
          ai_summary?: string | null;
          claim_id: string;
          created_at?: string;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          owner_id: string;
          status?: Database["public"]["Enums"]["supplement_status"];
          summary?: string | null;
          total_cents?: number;
          updated_at?: string;
        };
        Update: {
          ai_confidence?: number | null;
          ai_recommendations?: Json;
          ai_summary?: string | null;
          claim_id?: string;
          created_at?: string;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          owner_id?: string;
          status?: Database["public"]["Enums"]["supplement_status"];
          summary?: string | null;
          total_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplements_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      voice_preferences: {
        Row: {
          auto_send_transcripts: boolean;
          mode: string;
          muted: boolean;
          pitch: number;
          rate: number;
          updated_at: string;
          user_id: string;
          voice_name: string | null;
        };
        Insert: {
          auto_send_transcripts?: boolean;
          mode?: string;
          muted?: boolean;
          pitch?: number;
          rate?: number;
          updated_at?: string;
          user_id: string;
          voice_name?: string | null;
        };
        Update: {
          auto_send_transcripts?: boolean;
          mode?: string;
          muted?: boolean;
          pitch?: number;
          rate?: number;
          updated_at?: string;
          user_id?: string;
          voice_name?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      atlas_semantic_search: {
        Args: {
          p_limit?: number;
          p_owner: string;
          p_query: string;
          p_types?: string[];
        };
        Returns: {
          entity_id: string;
          entity_type: string;
          label: string;
          similarity: number;
          sub: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "manager" | "user";
      appointment_kind: "inspection" | "call" | "meeting" | "deadline" | "task";
      claim_status:
        | "new"
        | "inspection_scheduled"
        | "waiting_on_carrier"
        | "supplement_pending"
        | "approved"
        | "closed"
        | "denied";
      notification_tone: "default" | "signal" | "warn" | "error";
      supplement_status: "draft" | "submitted" | "approved" | "denied";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "user"],
      appointment_kind: ["inspection", "call", "meeting", "deadline", "task"],
      claim_status: [
        "new",
        "inspection_scheduled",
        "waiting_on_carrier",
        "supplement_pending",
        "approved",
        "closed",
        "denied",
      ],
      notification_tone: ["default", "signal", "warn", "error"],
      supplement_status: ["draft", "submitted", "approved", "denied"],
    },
  },
} as const;
