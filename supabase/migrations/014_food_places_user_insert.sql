-- Allow active (non-banned) users to submit food places.
-- Admin write policy remains for full management.

CREATE POLICY "food_places_insert_active"
  ON public.food_places FOR INSERT
  WITH CHECK (
    public.can_interact()
    AND status = 'published'
  );
