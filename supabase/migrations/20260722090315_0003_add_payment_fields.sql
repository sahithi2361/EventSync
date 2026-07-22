/*
# Add payment fields to events and registrations

1. Modified Tables
- `events`: add `is_paid` (boolean, default false) and `price` (numeric, default 0).
  Coordinator sets whether an event is free or paid, and the ticket price.
- `registrations`: add `payment_status` (text, default 'free') and `payment_amount` (numeric, default 0).
  Tracks whether the student has paid for a paid event. Values: 'free', 'pending', 'paid'.
- `events`: add `tags` (text, nullable) for optional event tags/keywords to improve search.
2. Security
- No new tables. Existing RLS policies on events and registrations remain unchanged.
3. Notes
- All new columns have safe defaults so existing rows are unaffected.
- `is_paid` defaults to false so all existing events remain free unless explicitly set.
*/

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags text;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2) NOT NULL DEFAULT 0;