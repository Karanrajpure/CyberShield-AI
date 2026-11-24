CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Visitor accounts deliberately do not store additional profile details.
  -- Keep the existing trigger callable without touching existing profiles.
  RETURN NEW;
END;
$$;