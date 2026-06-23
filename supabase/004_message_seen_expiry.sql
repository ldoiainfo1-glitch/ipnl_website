-- Track when a received message is seen and when it should be removed.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON public.messages(expires_at);

CREATE OR REPLACE FUNCTION public.delete_expired_seen_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.messages
  WHERE seen_at IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;