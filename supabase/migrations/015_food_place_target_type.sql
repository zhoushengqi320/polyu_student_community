-- Allow food place favorites and place-level reports (alongside food_recommendation).
ALTER TYPE public.target_type ADD VALUE IF NOT EXISTS 'food_place';
