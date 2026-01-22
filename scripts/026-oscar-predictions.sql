-- Oscar nominations table
CREATE TABLE IF NOT EXISTS oscar_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceremony INTEGER NOT NULL,
  award_year INTEGER NOT NULL,
  film_year INTEGER NOT NULL,
  category TEXT NOT NULL,
  work_title TEXT NOT NULL,
  nominee TEXT,
  notes TEXT,
  tmdb_movie_id INTEGER,
  tmdb_person_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oscar_nominations_ceremony ON oscar_nominations(ceremony);
CREATE INDEX IF NOT EXISTS idx_oscar_nominations_category ON oscar_nominations(category);
CREATE INDEX IF NOT EXISTS idx_oscar_nominations_tmdb_movie_id ON oscar_nominations(tmdb_movie_id);

-- User predictions table
CREATE TABLE IF NOT EXISTS oscar_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  nomination_id UUID NOT NULL REFERENCES oscar_nominations(id) ON DELETE CASCADE,
  ceremony INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, collective_id, nomination_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oscar_predictions_user_collective ON oscar_predictions(user_id, collective_id);
CREATE INDEX IF NOT EXISTS idx_oscar_predictions_ceremony ON oscar_predictions(ceremony);

-- Insert 98th Academy Awards (2026) nominations
INSERT INTO oscar_nominations (ceremony, award_year, film_year, category, work_title, nominee, notes, tmdb_movie_id) VALUES
-- Best Picture
(98, 2026, 2025, 'Best Picture', 'Bugonia', 'Ed Guiney & Andrew Lowe, Yorgos Lanthimos, Emma Stone and Lars Knudsen, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'F1', 'Chad Oman, Brad Pitt, Dede Gardner, Jeremy Kleiner, Joseph Kosinski and Jerry Bruckheimer, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'Frankenstein', 'Guillermo del Toro, J. Miles Dale and Scott Stuber, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'Hamnet', 'Liza Marshall, Pippa Harris, Nicolas Gonda, Steven Spielberg and Sam Mendes, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'Marty Supreme', 'Eli Bush, Ronald Bronstein, Josh Safdie, Anthony Katagas and Timothée Chalamet, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'One Battle after Another', 'Adam Somner, Sara Murphy and Paul Thomas Anderson, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'The Secret Agent', 'Emilie Lesclaux, Producer', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'Sentimental Value', 'Maria Ekerhovd and Andrea Berentsen Ottmar, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'Sinners', 'Zinzi Coogler, Sev Ohanian and Ryan Coogler, Producers', NULL, NULL),
(98, 2026, 2025, 'Best Picture', 'Train Dreams', 'Marissa McMahon, Teddy Schwarzman, Will Janowitz, Ashley Schlaifer and Michael Heimler, Producers', NULL, NULL),

-- Directing
(98, 2026, 2025, 'Directing', 'Hamnet', 'Chloé Zhao', NULL, NULL),
(98, 2026, 2025, 'Directing', 'Marty Supreme', 'Josh Safdie', NULL, NULL),
(98, 2026, 2025, 'Directing', 'One Battle after Another', 'Paul Thomas Anderson', NULL, NULL),
(98, 2026, 2025, 'Directing', 'Sentimental Value', 'Joachim Trier', NULL, NULL),
(98, 2026, 2025, 'Directing', 'Sinners', 'Ryan Coogler', NULL, NULL),

-- Actor in a Leading Role
(98, 2026, 2025, 'Actor in a Leading Role', 'Marty Supreme', 'Timothée Chalamet', NULL, NULL),
(98, 2026, 2025, 'Actor in a Leading Role', 'One Battle after Another', 'Leonardo DiCaprio', NULL, NULL),
(98, 2026, 2025, 'Actor in a Leading Role', 'Blue Moon', 'Ethan Hawke', NULL, NULL),
(98, 2026, 2025, 'Actor in a Leading Role', 'Sinners', 'Michael B. Jordan', NULL, NULL),
(98, 2026, 2025, 'Actor in a Leading Role', 'The Secret Agent', 'Wagner Moura', NULL, NULL),

-- Actress in a Leading Role
(98, 2026, 2025, 'Actress in a Leading Role', 'Hamnet', 'Jessie Buckley', NULL, NULL),
(98, 2026, 2025, 'Actress in a Leading Role', 'If I Had Legs I''d Kick You', 'Rose Byrne', NULL, NULL),
(98, 2026, 2025, 'Actress in a Leading Role', 'Song Sung Blue', 'Kate Hudson', NULL, NULL),
(98, 2026, 2025, 'Actress in a Leading Role', 'Sentimental Value', 'Renate Reinsve', NULL, NULL),
(98, 2026, 2025, 'Actress in a Leading Role', 'Bugonia', 'Emma Stone', NULL, NULL),

-- Actor in a Supporting Role
(98, 2026, 2025, 'Actor in a Supporting Role', 'One Battle after Another', 'Benicio Del Toro', NULL, NULL),
(98, 2026, 2025, 'Actor in a Supporting Role', 'Frankenstein', 'Jacob Elordi', NULL, NULL),
(98, 2026, 2025, 'Actor in a Supporting Role', 'Sinners', 'Delroy Lindo', NULL, NULL),
(98, 2026, 2025, 'Actor in a Supporting Role', 'One Battle after Another', 'Sean Penn', NULL, NULL),
(98, 2026, 2025, 'Actor in a Supporting Role', 'Sentimental Value', 'Stellan Skarsgård', NULL, NULL),

-- Actress in a Supporting Role
(98, 2026, 2025, 'Actress in a Supporting Role', 'Sentimental Value', 'Elle Fanning', NULL, NULL),
(98, 2026, 2025, 'Actress in a Supporting Role', 'Sentimental Value', 'Inga Ibsdotter Lilleaas', NULL, NULL),
(98, 2026, 2025, 'Actress in a Supporting Role', 'Weapons', 'Amy Madigan', NULL, NULL),
(98, 2026, 2025, 'Actress in a Supporting Role', 'Sinners', 'Wunmi Mosaku', NULL, NULL),
(98, 2026, 2025, 'Actress in a Supporting Role', 'One Battle after Another', 'Teyana Taylor', NULL, NULL),

-- Writing (Original Screenplay)
(98, 2026, 2025, 'Writing (Original Screenplay)', 'Blue Moon', 'Robert Kaplow', NULL, NULL),
(98, 2026, 2025, 'Writing (Original Screenplay)', 'It Was Just an Accident', 'Jafar Panahi', NULL, NULL),
(98, 2026, 2025, 'Writing (Original Screenplay)', 'Marty Supreme', 'Ronald Bronstein & Josh Safdie', NULL, NULL),
(98, 2026, 2025, 'Writing (Original Screenplay)', 'Sentimental Value', 'Eskil Vogt, Joachim Trier', NULL, NULL),
(98, 2026, 2025, 'Writing (Original Screenplay)', 'Sinners', 'Ryan Coogler', NULL, NULL),

-- Writing (Adapted Screenplay)
(98, 2026, 2025, 'Writing (Adapted Screenplay)', 'Bugonia', 'Will Tracy', NULL, NULL),
(98, 2026, 2025, 'Writing (Adapted Screenplay)', 'Frankenstein', 'Guillermo del Toro', NULL, NULL),
(98, 2026, 2025, 'Writing (Adapted Screenplay)', 'Hamnet', 'Chloé Zhao & Maggie O''Farrell', NULL, NULL),
(98, 2026, 2025, 'Writing (Adapted Screenplay)', 'One Battle after Another', 'Paul Thomas Anderson', NULL, NULL),
(98, 2026, 2025, 'Writing (Adapted Screenplay)', 'Train Dreams', 'Clint Bentley & Greg Kwedar', NULL, NULL),

-- Animated Feature Film
(98, 2026, 2025, 'Animated Feature Film', 'Arco', 'Ugo Bienvenu, Félix de Givry, Sophie Mas and Natalie Portman', NULL, NULL),
(98, 2026, 2025, 'Animated Feature Film', 'Elio', 'Madeline Sharafian, Domee Shi, Adrian Molina and Mary Alice Drumm', NULL, NULL),
(98, 2026, 2025, 'Animated Feature Film', 'KPop Demon Hunters', 'Maggie Kang, Chris Appelhans and Michelle L.M. Wong', NULL, NULL),
(98, 2026, 2025, 'Animated Feature Film', 'Little Amélie or the Character of Rain', 'Maïlys Vallade, Liane-Cho Han, Nidia Santiago and Henri Magalon', NULL, NULL),
(98, 2026, 2025, 'Animated Feature Film', 'Zootopia 2', 'Jared Bush, Byron Howard and Yvett Merino', NULL, NULL),

-- Cinematography
(98, 2026, 2025, 'Cinematography', 'Frankenstein', 'Dan Laustsen', NULL, NULL),
(98, 2026, 2025, 'Cinematography', 'Marty Supreme', 'Darius Khondji', NULL, NULL),
(98, 2026, 2025, 'Cinematography', 'One Battle after Another', 'Michael Bauman', NULL, NULL),
(98, 2026, 2025, 'Cinematography', 'Sinners', 'Autumn Durald Arkapaw', NULL, NULL),
(98, 2026, 2025, 'Cinematography', 'Train Dreams', 'Adolpho Veloso', NULL, NULL),

-- Film Editing
(98, 2026, 2025, 'Film Editing', 'F1', 'Stephen Mirrione', NULL, NULL),
(98, 2026, 2025, 'Film Editing', 'Marty Supreme', 'Ronald Bronstein and Josh Safdie', NULL, NULL),
(98, 2026, 2025, 'Film Editing', 'One Battle after Another', 'Andy Jurgensen', NULL, NULL),
(98, 2026, 2025, 'Film Editing', 'Sentimental Value', 'Olivier Bugge Coutté', NULL, NULL),
(98, 2026, 2025, 'Film Editing', 'Sinners', 'Michael P. Shawver', NULL, NULL),

-- Music (Original Score)
(98, 2026, 2025, 'Music (Original Score)', 'Bugonia', 'Jerskin Fendrix', NULL, NULL),
(98, 2026, 2025, 'Music (Original Score)', 'Frankenstein', 'Alexandre Desplat', NULL, NULL),
(98, 2026, 2025, 'Music (Original Score)', 'Hamnet', 'Max Richter', NULL, NULL),
(98, 2026, 2025, 'Music (Original Score)', 'One Battle after Another', 'Jonny Greenwood', NULL, NULL),
(98, 2026, 2025, 'Music (Original Score)', 'Sinners', 'Ludwig Goransson', NULL, NULL),

-- Music (Original Song)
(98, 2026, 2025, 'Music (Original Song)', 'Dear Me', 'from Diane Warren: Relentless; Music and Lyric by Diane Warren', NULL, NULL),
(98, 2026, 2025, 'Music (Original Song)', 'Golden', 'from KPop Demon Hunters', NULL, NULL),
(98, 2026, 2025, 'Music (Original Song)', 'I Lied To You', 'from Sinners; Music and Lyric by Raphael Saadiq and Ludwig Goransson', NULL, NULL),
(98, 2026, 2025, 'Music (Original Song)', 'Sweet Dreams Of Joy', 'from Viva Verdi!; Music and Lyric by Nicholas Pike', NULL, NULL),
(98, 2026, 2025, 'Music (Original Song)', 'Train Dreams', 'from Train Dreams; Music by Nick Cave and Bryce Dessner; Lyric by Nick Cave', NULL, NULL),

-- Production Design
(98, 2026, 2025, 'Production Design', 'Frankenstein', 'Tamara Deverell; Set Decoration: Shane Vieau', NULL, NULL),
(98, 2026, 2025, 'Production Design', 'Hamnet', 'Fiona Crombie; Set Decoration: Alice Felton', NULL, NULL),
(98, 2026, 2025, 'Production Design', 'Marty Supreme', 'Jack Fisk; Set Decoration: Adam Willis', NULL, NULL),
(98, 2026, 2025, 'Production Design', 'One Battle after Another', 'Florencia Martin; Set Decoration: Anthony Carlino', NULL, NULL),
(98, 2026, 2025, 'Production Design', 'Sinners', 'Hannah Beachler; Set Decoration: Monique Champagne', NULL, NULL),

-- Costume Design
(98, 2026, 2025, 'Costume Design', 'Avatar: Fire and Ash', 'Deborah L. Scott', NULL, NULL),
(98, 2026, 2025, 'Costume Design', 'Frankenstein', 'Kate Hawley', NULL, NULL),
(98, 2026, 2025, 'Costume Design', 'Hamnet', 'Malgosia Turzanska', NULL, NULL),
(98, 2026, 2025, 'Costume Design', 'Marty Supreme', 'Miyako Bellizzi', NULL, NULL),
(98, 2026, 2025, 'Costume Design', 'Sinners', 'Ruth E. Carter', NULL, NULL),

-- Makeup and Hairstyling
(98, 2026, 2025, 'Makeup and Hairstyling', 'Frankenstein', 'Mike Hill, Jordan Samuel and Cliona Furey', NULL, NULL),
(98, 2026, 2025, 'Makeup and Hairstyling', 'Kokuho', 'Kyoko Toyokawa, Naomi Hibino and Tadashi Nishimatsu', NULL, NULL),
(98, 2026, 2025, 'Makeup and Hairstyling', 'Sinners', 'Ken Diaz, Mike Fontaine and Shunika Terry', NULL, NULL),
(98, 2026, 2025, 'Makeup and Hairstyling', 'The Smashing Machine', 'Kazu Hiro, Glen Griffin and Bjoern Rehbein', NULL, NULL),
(98, 2026, 2025, 'Makeup and Hairstyling', 'The Ugly Stepsister', 'Thomas Foldberg and Anne Cathrine Sauerberg', NULL, NULL),

-- Sound
(98, 2026, 2025, 'Sound', 'F1', 'Gareth John, Al Nelson, Gwendolyn Yates Whittle, Gary A. Rizzo and Juan Peralta', NULL, NULL),
(98, 2026, 2025, 'Sound', 'Frankenstein', 'Greg Chapman, Nathan Robitaille, Nelson Ferreira, Christian Cooke and Brad Zoern', NULL, NULL),
(98, 2026, 2025, 'Sound', 'One Battle after Another', 'José Antonio García, Christopher Scarabosio and Tony Villaflor', NULL, NULL),
(98, 2026, 2025, 'Sound', 'Sinners', 'Chris Welcker, Benjamin A. Burtt, Felipe Pacheco, Brandon Proctor and Steve Boeddeker', NULL, NULL),
(98, 2026, 2025, 'Sound', 'Sirāt', 'Amanda Villavieja, Laia Casanovas and Yasmina Praderas', NULL, NULL),

-- Visual Effects
(98, 2026, 2025, 'Visual Effects', 'Avatar: Fire and Ash', 'Joe Letteri, Richard Baneham, Eric Saindon and Daniel Barrett', NULL, NULL),
(98, 2026, 2025, 'Visual Effects', 'F1', 'Ryan Tudhope, Nicolas Chevallier, Robert Harrington and Keith Dawson', NULL, NULL),
(98, 2026, 2025, 'Visual Effects', 'Jurassic World Rebirth', 'David Vickery, Stephen Aplin, Charmaine Chan and Neil Corbould', NULL, NULL),
(98, 2026, 2025, 'Visual Effects', 'The Lost Bus', 'Charlie Noble, David Zaretti, Russell Bowen and Brandon K. McLaughlin', NULL, NULL),
(98, 2026, 2025, 'Visual Effects', 'Sinners', 'Michael Ralla, Espen Nordahl, Guido Wolter and Donnie Dean', NULL, NULL),

-- International Feature Film
(98, 2026, 2025, 'International Feature Film', 'The Secret Agent', 'Brazil', NULL, NULL),
(98, 2026, 2025, 'International Feature Film', 'It Was Just an Accident', 'France', NULL, NULL),
(98, 2026, 2025, 'International Feature Film', 'Sentimental Value', 'Norway', NULL, NULL),
(98, 2026, 2025, 'International Feature Film', 'Sirāt', 'Spain', NULL, NULL),
(98, 2026, 2025, 'International Feature Film', 'The Voice of Hind Rajab', 'Tunisia', NULL, NULL),

-- Documentary Feature Film
(98, 2026, 2025, 'Documentary Feature Film', 'The Alabama Solution', 'Andrew Jarecki and Charlotte Kaufman', NULL, NULL),
(98, 2026, 2025, 'Documentary Feature Film', 'Come See Me in the Good Light', 'Ryan White, Jessica Hargrave, Tig Notaro and Stef Willen', NULL, NULL),
(98, 2026, 2025, 'Documentary Feature Film', 'Cutting through Rocks', 'Sara Khaki and Mohammadreza Eyni', NULL, NULL),
(98, 2026, 2025, 'Documentary Feature Film', 'Mr. Nobody against Putin', 'Nominees to be determined', NULL, NULL),
(98, 2026, 2025, 'Documentary Feature Film', 'The Perfect Neighbor', 'Geeta Gandbhir, Alisa Payne, Nikon Kwantu and Sam Bisbee', NULL, NULL),

-- Documentary Short Film
(98, 2026, 2025, 'Documentary Short Film', 'All the Empty Rooms', 'Joshua Seftel and Conall Jones', NULL, NULL),
(98, 2026, 2025, 'Documentary Short Film', 'Armed Only with a Camera', 'Craig Renaud and Juan Arredondo', NULL, NULL),
(98, 2026, 2025, 'Documentary Short Film', 'Children No More', 'Hilla Medalia and Sheila Nevins', NULL, NULL),
(98, 2026, 2025, 'Documentary Short Film', 'The Devil Is Busy', 'Christalyn Hampton and Geeta Gandbhir', NULL, NULL),
(98, 2026, 2025, 'Documentary Short Film', 'Perfectly a Strangeness', 'Alison McAlpine', NULL, NULL),

-- Animated Short Film
(98, 2026, 2025, 'Animated Short Film', 'Butterfly', 'Florence Miailhe and Ron Dyens', NULL, NULL),
(98, 2026, 2025, 'Animated Short Film', 'Forevergreen', 'Nathan Engelhardt and Jeremy Spears', NULL, NULL),
(98, 2026, 2025, 'Animated Short Film', 'The Girl Who Cried Pearls', 'Chris Lavis and Maciek Szczerbowski', NULL, NULL),
(98, 2026, 2025, 'Animated Short Film', 'Retirement Plan', 'John Kelly and Andrew Freedman', NULL, NULL),
(98, 2026, 2025, 'Animated Short Film', 'The Three Sisters', 'Konstantin Bronzit', NULL, NULL),

-- Live Action Short Film
(98, 2026, 2025, 'Live Action Short Film', 'Butcher''s Stain', 'Meyer Levinson-Blount and Oron Caspi', NULL, NULL),
(98, 2026, 2025, 'Live Action Short Film', 'A Friend of Dorothy', 'Lee Knight and James Dean', NULL, NULL),
(98, 2026, 2025, 'Live Action Short Film', 'Jane Austen''s Period Drama', 'Julia Aks and Steve Pinder', NULL, NULL),
(98, 2026, 2025, 'Live Action Short Film', 'The Singers', 'Sam A. Davis and Jack Piatt', NULL, NULL),
(98, 2026, 2025, 'Live Action Short Film', 'Two People Exchanging Saliva', 'Alexandre Singh and Natalie Musteata', NULL, NULL),

-- Casting
(98, 2026, 2025, 'Casting', 'Hamnet', 'Nina Gold', NULL, NULL),
(98, 2026, 2025, 'Casting', 'Marty Supreme', 'Jennifer Venditti', NULL, NULL),
(98, 2026, 2025, 'Casting', 'One Battle after Another', 'Cassandra Kulukundis', NULL, NULL),
(98, 2026, 2025, 'Casting', 'The Secret Agent', 'Gabriel Domingues', NULL, NULL),
(98, 2026, 2025, 'Casting', 'Sinners', 'Francine Maisler', NULL, NULL);
