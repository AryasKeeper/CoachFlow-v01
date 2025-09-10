-- Seed data for CoachFlow demo
-- Run this after setting up the schema

-- Create demo users (passwords are all "demo123")
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES
  -- Organizations
  ('11111111-1111-1111-1111-111111111111', 'bondi.academy@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "org", "name": "Bondi Basketball Academy"}'),
  ('22222222-2222-2222-2222-222222222222', 'sydney.youth@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "org", "name": "Sydney Youth Sports"}'),
  ('33333333-3333-3333-3333-333333333333', 'north.shore@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "org", "name": "North Shore Basketball Club"}'),
  
  -- Coaches
  ('44444444-4444-4444-4444-444444444444', 'sarah.coach@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "coach", "name": "Sarah Thompson"}'),
  ('55555555-5555-5555-5555-555555555555', 'mike.coach@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "coach", "name": "Mike Johnson"}'),
  ('66666666-6666-6666-6666-666666666666', 'emma.coach@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "coach", "name": "Emma Wilson"}'),
  ('77777777-7777-7777-7777-777777777777', 'james.coach@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "coach", "name": "James Chen"}'),
  
  -- Admin
  ('88888888-8888-8888-8888-888888888888', 'admin@demo.com', '$2a$10$PkZrQH2vUbCCUZa7d.mPF.ujS0Nt2wFw3BhVJ7KhfMqGzwguBsKqC', NOW(), '{"role": "admin", "name": "Admin User"}');

-- Create user records
INSERT INTO public.users (id, email, role, name, phone)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'bondi.academy@demo.com', 'org', 'Bondi Basketball Academy', '+61 400 111 111'),
  ('22222222-2222-2222-2222-222222222222', 'sydney.youth@demo.com', 'org', 'Sydney Youth Sports', '+61 400 222 222'),
  ('33333333-3333-3333-3333-333333333333', 'north.shore@demo.com', 'org', 'North Shore Basketball Club', '+61 400 333 333'),
  ('44444444-4444-4444-4444-444444444444', 'sarah.coach@demo.com', 'coach', 'Sarah Thompson', '+61 400 444 444'),
  ('55555555-5555-5555-5555-555555555555', 'mike.coach@demo.com', 'coach', 'Mike Johnson', '+61 400 555 555'),
  ('66666666-6666-6666-6666-666666666666', 'emma.coach@demo.com', 'coach', 'Emma Wilson', '+61 400 666 666'),
  ('77777777-7777-7777-7777-777777777777', 'james.coach@demo.com', 'coach', 'James Chen', '+61 400 777 777'),
  ('88888888-8888-8888-8888-888888888888', 'admin@demo.com', 'admin', 'Admin User', '+61 400 888 888');

-- Create organization profiles
INSERT INTO public.org_profiles (user_id, org_name, org_type, suburbs)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bondi Basketball Academy', 'Academy', ARRAY['Bondi', 'Bondi Beach', 'North Bondi', 'Tamarama', 'Bronte']),
  ('22222222-2222-2222-2222-222222222222', 'Sydney Youth Sports', 'Community Program', ARRAY['Sydney CBD', 'Surry Hills', 'Darlinghurst', 'Paddington', 'Redfern']),
  ('33333333-3333-3333-3333-333333333333', 'North Shore Basketball Club', 'Club', ARRAY['Chatswood', 'Willoughby', 'Artarmon', 'St Leonards', 'Crows Nest']);

-- Create coach profiles
INSERT INTO public.coach_profiles (
  user_id, bio, specialties, suburbs, rate_hourly, rate_flat, travel_km,
  wwcc_number, wwcc_expiry, insurance_url, first_aid_url, abn,
  rating_avg, rating_count, availability
)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'Experienced basketball coach with 10+ years working with youth teams. Former college player with a passion for developing young talent.',
    ARRAY['Youth Basketball', 'Skills Development', 'Team Training', 'Shooting Coach'],
    ARRAY['Bondi', 'Coogee', 'Randwick', 'Maroubra', 'Clovelly'],
    75, 250, 15,
    'WWC1234567', '2025-12-31', 'https://example.com/insurance/sarah', 'https://example.com/firstaid/sarah', '12 345 678 901',
    4.8, 23,
    '{"monday": {"enabled": true, "slots": [{"start": "15:00", "end": "20:00"}]}, "tuesday": {"enabled": true, "slots": [{"start": "15:00", "end": "20:00"}]}, "wednesday": {"enabled": true, "slots": [{"start": "15:00", "end": "20:00"}]}, "thursday": {"enabled": true, "slots": [{"start": "15:00", "end": "20:00"}]}, "friday": {"enabled": true, "slots": [{"start": "15:00", "end": "20:00"}]}, "saturday": {"enabled": true, "slots": [{"start": "09:00", "end": "17:00"}]}, "sunday": {"enabled": true, "slots": [{"start": "09:00", "end": "17:00"}]}}'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Professional basketball coach specializing in individual skill development and shooting techniques. Basketball Australia Level 2 certified.',
    ARRAY['Individual Coaching', 'Shooting Coach', 'Elite Performance', 'Skills Development'],
    ARRAY['Sydney CBD', 'Newtown', 'Marrickville', 'Glebe', 'Ultimo'],
    85, 300, 20,
    'WWC2345678', '2026-03-15', 'https://example.com/insurance/mike', 'https://example.com/firstaid/mike', '23 456 789 012',
    4.9, 31,
    '{"monday": {"enabled": true, "slots": [{"start": "06:00", "end": "09:00"}, {"start": "17:00", "end": "21:00"}]}, "tuesday": {"enabled": true, "slots": [{"start": "06:00", "end": "09:00"}, {"start": "17:00", "end": "21:00"}]}, "wednesday": {"enabled": true, "slots": [{"start": "06:00", "end": "09:00"}, {"start": "17:00", "end": "21:00"}]}, "thursday": {"enabled": true, "slots": [{"start": "06:00", "end": "09:00"}, {"start": "17:00", "end": "21:00"}]}, "friday": {"enabled": true, "slots": [{"start": "06:00", "end": "09:00"}, {"start": "17:00", "end": "21:00"}]}, "saturday": {"enabled": true, "slots": [{"start": "08:00", "end": "18:00"}]}, "sunday": {"enabled": false, "slots": []}}'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Dedicated coach with expertise in beginner programs and school basketball. Great with kids and focused on making basketball fun while building fundamentals.',
    ARRAY['Beginner Friendly', 'School Programs', 'Youth Basketball', 'Holiday Camps'],
    ARRAY['Chatswood', 'Willoughby', 'Mosman', 'Neutral Bay', 'Cremorne'],
    65, 200, 10,
    'WWC3456789', '2025-08-20', 'https://example.com/insurance/emma', 'https://example.com/firstaid/emma', '34 567 890 123',
    4.7, 19,
    '{"monday": {"enabled": true, "slots": [{"start": "15:00", "end": "19:00"}]}, "tuesday": {"enabled": true, "slots": [{"start": "15:00", "end": "19:00"}]}, "wednesday": {"enabled": true, "slots": [{"start": "15:00", "end": "19:00"}]}, "thursday": {"enabled": true, "slots": [{"start": "15:00", "end": "19:00"}]}, "friday": {"enabled": true, "slots": [{"start": "15:00", "end": "19:00"}]}, "saturday": {"enabled": true, "slots": [{"start": "09:00", "end": "16:00"}]}, "sunday": {"enabled": true, "slots": [{"start": "09:00", "end": "16:00"}]}}'
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'Former professional player turned coach. Specializes in advanced tactics, game strategy, and conditioning for competitive teams.',
    ARRAY['Elite Performance', 'Game Strategy', 'Conditioning', 'Team Training'],
    ARRAY['Parramatta', 'Westmead', 'Castle Hill', 'Baulkham Hills', 'Blacktown'],
    90, 350, 25,
    'WWC4567890', '2026-01-10', 'https://example.com/insurance/james', 'https://example.com/firstaid/james', '45 678 901 234',
    5.0, 15,
    '{"monday": {"enabled": true, "slots": [{"start": "16:00", "end": "21:00"}]}, "tuesday": {"enabled": true, "slots": [{"start": "16:00", "end": "21:00"}]}, "wednesday": {"enabled": true, "slots": [{"start": "16:00", "end": "21:00"}]}, "thursday": {"enabled": true, "slots": [{"start": "16:00", "end": "21:00"}]}, "friday": {"enabled": true, "slots": [{"start": "16:00", "end": "21:00"}]}, "saturday": {"enabled": true, "slots": [{"start": "08:00", "end": "20:00"}]}, "sunday": {"enabled": true, "slots": [{"start": "08:00", "end": "20:00"}]}}'
  );

-- Create listings
INSERT INTO public.listings (id, org_id, title, description, location, dates, timeslots, pay_min, pay_max, required_badges, urgency, status)
VALUES
  (
    '11111111-0001-0001-0001-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Youth Basketball Coach for U14 Team',
    'We are looking for an experienced coach to lead our U14 competitive team. The role involves training sessions twice a week and game day coaching on Saturdays. Must be great with teenagers and have experience with competitive basketball.',
    'Bondi Basketball Courts, Bondi Beach',
    '["2024-02-05", "2024-02-07", "2024-02-10", "2024-02-12", "2024-02-14", "2024-02-17"]',
    '["16:00-18:00", "09:00-12:00"]',
    60, 80,
    ARRAY['wwcc', 'first-aid'],
    'soon',
    'active'
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Holiday Camp Assistant Coach',
    'Join our summer holiday basketball camp team! We need enthusiastic coaches to help run skills stations, supervise games, and ensure kids have a great time. Perfect for coaches who love working with beginners.',
    'Sydney Youth Sports Center, Surry Hills',
    '["2024-01-15", "2024-01-16", "2024-01-17", "2024-01-18", "2024-01-19"]',
    '["09:00-15:00"]',
    50, 70,
    ARRAY['wwcc'],
    'urgent',
    'active'
  ),
  (
    '11111111-0003-0003-0003-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'Elite Shooting Coach for Development Squad',
    'Seeking a specialized shooting coach for our development squad. Focus on shooting mechanics, form correction, and mental aspects of shooting. 2-hour sessions, twice weekly.',
    'North Shore Basketball Stadium, Chatswood',
    '["2024-02-01", "2024-02-03", "2024-02-06", "2024-02-08"]',
    '["18:00-20:00"]',
    80, 100,
    ARRAY['wwcc', 'insurance', 'level-1'],
    'flexible',
    'active'
  ),
  (
    '11111111-0004-0004-0004-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'School Program Basketball Coach',
    'Partner with local schools to deliver after-school basketball programs. Great opportunity for coaches who enjoy teaching fundamentals to beginners. Multiple locations available.',
    'Various schools in Eastern Suburbs',
    '["2024-02-12", "2024-02-13", "2024-02-14", "2024-02-15", "2024-02-16"]',
    '["15:30-17:00"]',
    55, 75,
    ARRAY['wwcc', 'first-aid', 'insurance'],
    'soon',
    'active'
  );

-- Create applications
INSERT INTO public.applications (listing_id, coach_id, message, proposed_rate, status)
VALUES
  (
    '11111111-0001-0001-0001-000000000001',
    '44444444-4444-4444-4444-444444444444',
    'Hi! I''m very interested in coaching your U14 team. I have extensive experience with this age group and a proven track record of developing young players. I''m available for all the dates listed and would love to discuss the role further.',
    75,
    'pending'
  ),
  (
    '11111111-0001-0001-0001-000000000001',
    '66666666-6666-6666-6666-666666666666',
    'I would love to coach your U14 team! I specialize in making basketball fun while building strong fundamentals. I''m local to Bondi and can commit to all training sessions and games.',
    65,
    'pending'
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    '66666666-6666-6666-6666-666666666666',
    'Perfect timing! I love running holiday camps and have lots of fun drills and games that keep kids engaged. I''m available for all dates and have my own equipment I can bring.',
    60,
    'accepted'
  ),
  (
    '11111111-0003-0003-0003-000000000003',
    '55555555-5555-5555-5555-555555555555',
    'As a specialized shooting coach, I''d be perfect for your development squad. I use video analysis and have a structured program that has helped many players improve their shooting percentage significantly.',
    90,
    'pending'
  );

-- Create a booking for the accepted application
INSERT INTO public.bookings (listing_id, org_id, coach_id, start_at, end_at, rate, status)
VALUES
  (
    '11111111-0002-0002-0002-000000000002',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666666',
    '2024-01-15 09:00:00+11',
    '2024-01-19 15:00:00+11',
    60,
    'confirmed'
  );

-- Create some messages
INSERT INTO public.messages (thread_id, sender_id, body)
VALUES
  (
    '11111111-0002-0002-0002-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Hi Emma, we''d love to have you join our holiday camp team! Can you confirm you''re available for all 5 days?'
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    '66666666-6666-6666-6666-666666666666',
    'Yes, I can confirm I''m available for all 5 days! Really looking forward to it. Should I bring any specific equipment?'
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Great! We have basketballs and cones, but if you have any special training equipment you like to use, feel free to bring it. See you on the 15th!'
  );

-- Note: To use this seed data, users can log in with:
-- Organizations:
--   bondi.academy@demo.com / demo123
--   sydney.youth@demo.com / demo123
--   north.shore@demo.com / demo123
-- Coaches:
--   sarah.coach@demo.com / demo123
--   mike.coach@demo.com / demo123
--   emma.coach@demo.com / demo123
--   james.coach@demo.com / demo123
-- Admin:
--   admin@demo.com / demo123
