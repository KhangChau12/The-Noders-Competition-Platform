-- Fix storage policy to allow team members to upload submissions
-- Current policy only allows uploads to user's own folder
-- Need to also allow uploads to team folder if user is a team member

-- Drop existing upload policy
DROP POLICY IF EXISTS "Users can upload their submissions" ON storage.objects;

-- Create new policy that allows both individual and team uploads
CREATE POLICY "Users can upload their submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (
    -- Individual upload: folder name = user's own ID
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Team upload: folder name = team ID where user is a member
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id::text = (storage.foldername(name))[1]
        AND team_members.user_id = auth.uid()
    )
  )
);

-- Also update READ policy to allow team members to read team submissions
DROP POLICY IF EXISTS "Users can read their submissions" ON storage.objects;

CREATE POLICY "Users can read their submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    -- Individual: can read own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Team: can read team folder if member
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id::text = (storage.foldername(name))[1]
        AND team_members.user_id = auth.uid()
    )
  )
);
