-- Couples must exist before profiles because profiles references couples.
CREATE TABLE couples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  anniversary TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  couple_code TEXT UNIQUE NOT NULL,
  couple_id UUID REFERENCES couples(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE couples
  ADD CONSTRAINT couples_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES profiles(id),
  ADD CONSTRAINT couples_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES profiles(id);

CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) NOT NULL,
  title TEXT NOT NULL,
  story TEXT,
  image_url TEXT,
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  couple_id UUID REFERENCES couples(id) NOT NULL,
  emoji TEXT NOT NULL,
  label TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, couple_id)
);

CREATE TABLE shared_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  url TEXT NOT NULL,
  has_doodle BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doodles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline/demo fallback. Production deployments should prefer Supabase Storage.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS image_data TEXT;
ALTER TABLE shared_images ADD COLUMN IF NOT EXISTS type TEXT;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE doodles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see partner profile" ON profiles FOR SELECT USING (
  couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
);
CREATE POLICY "Couples see own data" ON couples FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Couple notes" ON notes FOR ALL USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY "Couple memories" ON memories FOR ALL USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY "Couple moods" ON moods FOR ALL USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY "Couple images" ON shared_images FOR ALL USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY "Couple doodles" ON doodles FOR ALL USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url, couple_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    UPPER(SUBSTRING(MD5(NEW.id::TEXT), 1, 6))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION pair_with_code(partner_code TEXT)
RETURNS UUID AS $$
DECLARE
  partner_id UUID;
  new_couple_id UUID;
BEGIN
  SELECT id INTO partner_id FROM profiles
  WHERE couple_code = UPPER(partner_code) AND id <> auth.uid() AND couple_id IS NULL;
  IF partner_id IS NULL THEN RAISE EXCEPTION 'Partner code was not found or is already paired.'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND couple_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Your account is already paired.';
  END IF;
  INSERT INTO couples (user1_id, user2_id) VALUES (auth.uid(), partner_id) RETURNING id INTO new_couple_id;
  UPDATE profiles SET couple_id = new_couple_id WHERE id IN (auth.uid(), partner_id);
  RETURN new_couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
