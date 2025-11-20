-- Add dataset_description column to competitions table
ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS dataset_description TEXT;

-- Add comment
COMMENT ON COLUMN competitions.dataset_description IS 'Description of the dataset structure and format';
