-- Update admin password to 'admin123'
-- Password hash is generated using bcrypt with 10 rounds
UPDATE users 
SET password = '$2b$10$26agwr39IpnZaSGF1JchPeUu6m3QzEh95C81reDQAC7Q9F6kKkMre'
WHERE email = 'admin@tokorejeki.com';
