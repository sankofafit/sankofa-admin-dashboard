import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpfsjjemstwlcdfwmxgg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZnNqamVtc3R3bGNkZndteGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjAxMDksImV4cCI6MjEwMTE5NjEwOX0.yZWmeTU48l58NO1U-Ql3u5KP-AuPXl_4g4dCflZIENo';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
