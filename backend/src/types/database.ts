/**
 * Hand-written Supabase Database types, kept in sync with
 * supabase/schema.sql + supabase/migrations/*.sql.
 *
 * Every table requires Row / Insert / Update / Relationships — Supabase's
 * client (via @supabase/postgrest-js's GenericTable) silently falls back
 * to `never` for query results if `Relationships` is omitted, and the
 * schema itself requires `Views` and `Functions` keys even when empty.
 *
 * This is intentionally minimal — only the tables/columns the backend
 * currently reads or writes. Extend each table's Row/Insert/Update as
 * new columns are added in future migrations. If you'd rather generate
 * this automatically from the live database, use the Supabase CLI:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          company_name: string | null;
          role: string;
          tier: string;
          status: string;
          kyc_status: string;
          mobile: string | null;
          company_description: string | null;
          website: string | null;
          linkedin: string | null;
          logo: string | null;
          city: string | null;
          state: string | null;
          pan: string | null;
          gst: string | null;
          rera_number: string | null;
          reputation_score: number;
          asset_preferences: string[];
          ticket_size_min: number | null;
          ticket_size_max: number | null;
          intro_quota_limit: number;
          intro_quota_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          email: string | null;
          company_name: string | null;
          role: string;
          tier: string;
          status: string;
          kyc_status: string;
          mobile: string | null;
          company_description: string | null;
          website: string | null;
          linkedin: string | null;
          logo: string | null;
          city: string | null;
          state: string | null;
          pan: string | null;
          gst: string | null;
          rera_number: string | null;
          reputation_score: number;
          asset_preferences: string[];
          ticket_size_min: number | null;
          ticket_size_max: number | null;
          intro_quota_limit: number;
          intro_quota_used: number;
          created_at: string;
          updated_at: string;
        }> & { id: string };
        Update: Partial<{
          id: string;
          email: string | null;
          company_name: string | null;
          role: string;
          tier: string;
          status: string;
          kyc_status: string;
          mobile: string | null;
          company_description: string | null;
          website: string | null;
          linkedin: string | null;
          logo: string | null;
          city: string | null;
          state: string | null;
          pan: string | null;
          gst: string | null;
          rera_number: string | null;
          reputation_score: number;
          asset_preferences: string[];
          ticket_size_min: number | null;
          ticket_size_max: number | null;
          intro_quota_limit: number;
          intro_quota_used: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      mandates: {
        Row: {
          id: string;
          user_id: string;
          type: 'BUY' | 'SELL' | 'LOOKING_FOR' | 'OFFERING';
          status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
          title: string;
          description: string;
          city: string;
          state: string;
          locality: string | null;
          asset_class:
            | 'RESIDENTIAL'
            | 'COMMERCIAL'
            | 'INDUSTRIAL'
            | 'HOSPITALITY'
            | 'RETAIL'
            | 'LAND'
            | 'MIXED_USE'
            | null;
          property_type: string | null;
          category: string | null;
          built_up_area: number | null;
          plot_area: number | null;
          ticket_size: number;
          ticket_size_max: number | null;
          tags: string[];
          is_off_market: boolean;
          expires_at: string | null;
          view_count: number;
          intro_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          user_id: string;
          type: 'BUY' | 'SELL' | 'LOOKING_FOR' | 'OFFERING';
          status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
          title: string;
          description: string;
          city: string;
          state: string;
          locality: string | null;
          asset_class:
            | 'RESIDENTIAL'
            | 'COMMERCIAL'
            | 'INDUSTRIAL'
            | 'HOSPITALITY'
            | 'RETAIL'
            | 'LAND'
            | 'MIXED_USE'
            | null;
          property_type: string | null;
          category: string | null;
          built_up_area: number | null;
          plot_area: number | null;
          ticket_size: number;
          ticket_size_max: number | null;
          tags: string[];
          is_off_market: boolean;
          expires_at: string | null;
          view_count: number;
          intro_count: number;
          created_at: string;
          updated_at: string;
        }> & {
          user_id: string;
          title: string;
          description: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          type: 'BUY' | 'SELL' | 'LOOKING_FOR' | 'OFFERING';
          status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
          title: string;
          description: string;
          city: string;
          state: string;
          locality: string | null;
          asset_class:
            | 'RESIDENTIAL'
            | 'COMMERCIAL'
            | 'INDUSTRIAL'
            | 'HOSPITALITY'
            | 'RETAIL'
            | 'LAND'
            | 'MIXED_USE'
            | null;
          property_type: string | null;
          category: string | null;
          built_up_area: number | null;
          plot_area: number | null;
          ticket_size: number;
          ticket_size_max: number | null;
          tags: string[];
          is_off_market: boolean;
          expires_at: string | null;
          view_count: number;
          intro_count: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          participant_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          participant_ids: string[];
          created_at: string;
          updated_at: string;
        }> & {
          participant_ids: string[];
        };
        Update: Partial<{
          id: string;
          participant_ids: string[];
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          seen_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          seen_at: string | null;
          expires_at: string | null;
          created_at: string;
        }> & {
          conversation_id: string;
          sender_id: string;
        };
        Update: Partial<{
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          seen_at: string | null;
          expires_at: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          related_entity_id: string | null;
          related_entity_type: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          type: string;
          related_entity_id: string | null;
          related_entity_type: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        }> & {
          user_id: string;
          title: string;
          message: string;
        };
        Update: Partial<{
          type: string;
          title: string;
          message: string;
          related_entity_id: string | null;
          related_entity_type: string | null;
          is_read: boolean;
          read_at: string | null;
        }>;
        Relationships: [];
      };
      kyc_reviews: {
        Row: {
          id: string;
          user_id: string;
          status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
          pan_card: string | null;
          gst_certificate: string | null;
          rera_certificate: string | null;
          incorporation_certificate: string | null;
          address_proof: string | null;
          review_note: string | null;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          user_id: string;
          status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
          pan_card: string | null;
          gst_certificate: string | null;
          rera_certificate: string | null;
          incorporation_certificate: string | null;
          address_proof: string | null;
          review_note: string | null;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        }> & { user_id: string };
        Update: Partial<{
          status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
          pan_card: string | null;
          gst_certificate: string | null;
          rera_certificate: string | null;
          incorporation_certificate: string | null;
          address_proof: string | null;
          review_note: string | null;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      mandate_reviews: {
        Row: {
          id: string;
          mandate_id: string;
          status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
          note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          mandate_id: string;
          status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
          note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        }> & { mandate_id: string };
        Update: Partial<{
          status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
          note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      reputation_reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewee_id: string;
          mandate_id: string | null;
          rating: number;
          comment: string | null;
          status: 'PUBLISHED' | 'HIDDEN';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          mandate_id: string | null;
          comment: string | null;
          status: 'PUBLISHED' | 'HIDDEN';
          created_at: string;
          updated_at: string;
        }> & {
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
        };
        Update: Partial<{
          rating: number;
          comment: string | null;
          status: 'PUBLISHED' | 'HIDDEN';
          updated_at: string;
        }>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          admin_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          note: string | null;
          created_at: string;
        }> & { admin_id: string; action: string; entity_type: string; entity_id: string };
        Update: Partial<{
          note: string | null;
        }>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          user_id: string | null;
          mandate_id: string | null;
          name: string;
          mobile: string;
          email: string;
          mandate_title: string;
          mandate_type: string;
          mandate_company: string;
          mandate_asset: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          mandate_id: string | null;
          name: string;
          mobile?: string;
          email?: string;
          mandate_title: string;
          mandate_type: string;
          mandate_company: string;
          mandate_asset?: string;
          created_at?: string;
        };
        Update: Partial<{
          mandate_id: string | null;
          name: string;
          mobile: string;
          email: string;
          mandate_title: string;
          mandate_type: string;
          mandate_company: string;
          mandate_asset: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
