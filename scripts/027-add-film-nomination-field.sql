-- Add film_nomination field to oscar_nominations table
ALTER TABLE oscar_nominations ADD COLUMN IF NOT EXISTS film_nomination BOOLEAN DEFAULT true;

-- Update person-specific nominations to false
UPDATE oscar_nominations SET film_nomination = false WHERE category IN (
  'Best Director',
  'Best Actor in a Leading Role',
  'Best Actress in a Leading Role',
  'Best Actor in a Supporting Role',
  'Best Actress in a Supporting Role'
);

-- Ensure film nominations are set to true (should already be default, but being explicit)
UPDATE oscar_nominations SET film_nomination = true WHERE category IN (
  'Best Picture',
  'Best Animated Feature Film',
  'Best International Feature Film',
  'Best Documentary Feature Film',
  'Best Documentary Short Film',
  'Best Animated Short Film',
  'Best Live Action Short Film',
  'Best Original Screenplay',
  'Best Adapted Screenplay',
  'Best Cinematography',
  'Best Film Editing',
  'Best Production Design',
  'Best Costume Design',
  'Best Makeup and Hairstyling',
  'Best Original Score',
  'Best Original Song',
  'Best Sound',
  'Best Visual Effects'
);
