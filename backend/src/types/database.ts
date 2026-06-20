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
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          email: string | null;
          company_name: string | null;
          role: string;
          tier: string;
          created_at: string;
          updated_at: string;
        }> & { id: string };
        Update: Partial<{
          id: string;
          email: string | null;
          company_name: string | null;
          role: string;
          tier: string;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      mandates: {
        Row: {
          id: string;
          user_id: string;
          type: 'BUY' | 'SELL';
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
          type: 'BUY' | 'SELL';
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
          type: 'BUY' | 'SELL';
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
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
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
          created_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
