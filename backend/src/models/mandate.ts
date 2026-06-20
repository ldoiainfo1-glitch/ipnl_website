import type { Database } from '../types/database';

type MandateRow = Database['public']['Tables']['mandates']['Row'];
type MandateInsert = Database['public']['Tables']['mandates']['Insert'];
type MandateUpdate = Database['public']['Tables']['mandates']['Update'];

/**
 * Maps a raw Supabase `mandates` row (snake_case) to the camelCase
 * `Mandate` shape defined in frontend/src/types/index.ts.
 */
export function toMandateDTO(row: MandateRow) {
  return {
    id: row.id,
    userId: row.user_id,
    // `user` (the populated User object) is intentionally omitted here;
    // attach it via a join in the route handler when the frontend needs
    // the poster's profile alongside the mandate (e.g. MandateDetail page).

    type: row.type,
    status: row.status,
    title: row.title,
    description: row.description,

    city: row.city,
    state: row.state,
    locality: row.locality ?? undefined,

    assetClass: row.asset_class ?? undefined,
    propertyType: row.property_type ?? undefined,
    builtUpArea: row.built_up_area != null ? Number(row.built_up_area) : undefined,
    plotArea: row.plot_area != null ? Number(row.plot_area) : undefined,

    ticketSize: row.ticket_size != null ? Number(row.ticket_size) : 0,
    ticketSizeMax: row.ticket_size_max != null ? Number(row.ticket_size_max) : undefined,

    tags: row.tags || [],

    isOffMarket: row.is_off_market,
    expiresAt: row.expires_at ?? undefined,

    viewCount: row.view_count ?? 0,
    introCount: row.intro_count ?? 0,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Shape of the fields a client is allowed to set via CreateMandateRequest /
 * Partial<CreateMandateRequest>. Used as an explicit whitelist so
 * `req.body` is never passed straight into Supabase's `.insert()`/
 * `.update()`, which would otherwise let a caller set user_id,
 * view_count, intro_count, status, etc. directly.
 */
interface MandateWritableFields {
  type?: 'BUY' | 'SELL';
  title?: string;
  description?: string;
  city?: string;
  state?: string;
  locality?: string;
  propertyType?: string;
  builtUpArea?: number;
  plotArea?: number;
  ticketSize?: number;
  ticketSizeMax?: number;
  tags?: string[];
  isOffMarket?: boolean;
}

function pickWritableFields(body: Record<string, any>): MandateWritableFields {
  const picked: MandateWritableFields = {};
  if (body.type !== undefined) picked.type = body.type;
  if (body.title !== undefined) picked.title = body.title;
  if (body.description !== undefined) picked.description = body.description;
  if (body.city !== undefined) picked.city = body.city;
  if (body.state !== undefined) picked.state = body.state;
  if (body.locality !== undefined) picked.locality = body.locality;
  if (body.propertyType !== undefined) picked.propertyType = body.propertyType;
  if (body.builtUpArea !== undefined) picked.builtUpArea = body.builtUpArea;
  if (body.plotArea !== undefined) picked.plotArea = body.plotArea;
  if (body.ticketSize !== undefined) picked.ticketSize = body.ticketSize;
  if (body.ticketSizeMax !== undefined) picked.ticketSizeMax = body.ticketSizeMax;
  if (body.tags !== undefined) picked.tags = body.tags;
  if (body.isOffMarket !== undefined) picked.isOffMarket = body.isOffMarket;
  return picked;
}

export function toMandateInsertPayload(userId: string, body: Record<string, any>): MandateInsert {
  const f = pickWritableFields(body);
  const payload: MandateInsert = {
    user_id: userId,
    title: f.title ?? '',
    description: f.description ?? '',
  };
  if (f.type !== undefined) payload.type = f.type;
  if (f.city !== undefined) payload.city = f.city;
  if (f.state !== undefined) payload.state = f.state;
  if (f.locality !== undefined) payload.locality = f.locality;
  if (f.propertyType !== undefined) payload.property_type = f.propertyType;
  if (f.builtUpArea !== undefined) payload.built_up_area = f.builtUpArea;
  if (f.plotArea !== undefined) payload.plot_area = f.plotArea;
  if (f.ticketSize !== undefined) payload.ticket_size = f.ticketSize;
  if (f.ticketSizeMax !== undefined) payload.ticket_size_max = f.ticketSizeMax;
  if (f.tags !== undefined) payload.tags = f.tags;
  if (f.isOffMarket !== undefined) payload.is_off_market = f.isOffMarket;
  return payload;
}

export function toMandateUpdatePayload(body: Record<string, any>): MandateUpdate {
  const f = pickWritableFields(body);
  const payload: MandateUpdate = {};
  if (f.type !== undefined) payload.type = f.type;
  if (f.title !== undefined) payload.title = f.title;
  if (f.description !== undefined) payload.description = f.description;
  if (f.city !== undefined) payload.city = f.city;
  if (f.state !== undefined) payload.state = f.state;
  if (f.locality !== undefined) payload.locality = f.locality;
  if (f.propertyType !== undefined) payload.property_type = f.propertyType;
  if (f.builtUpArea !== undefined) payload.built_up_area = f.builtUpArea;
  if (f.plotArea !== undefined) payload.plot_area = f.plotArea;
  if (f.ticketSize !== undefined) payload.ticket_size = f.ticketSize;
  if (f.ticketSizeMax !== undefined) payload.ticket_size_max = f.ticketSizeMax;
  if (f.tags !== undefined) payload.tags = f.tags;
  if (f.isOffMarket !== undefined) payload.is_off_market = f.isOffMarket;
  return payload;
}

export function hasAnyUpdateFields(payload: MandateUpdate): boolean {
  return Object.keys(payload).length > 0;
}
