/**
 * Import Kaggle Parental Guide Data
 * 
 * This script:
 * 1. Reads the Kaggle CSV (which has IMDb IDs)
 * 2. Uses TMDB API to convert IMDb IDs → TMDB IDs
 * 3. Inserts the data into your database via the API
 * 
 * USAGE:
 *   node scripts/import-kaggle-parental-guide.js path/to/kaggle-file.csv
 * 
 * REQUIREMENTS:
 *   - Set TMDB_API_KEY in your .env.local
 *   - Your Next.js app must be running (for the API endpoint)
 *   - npm install csv-parse (if not already installed)
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Rate limiting settings
const TMDB_DELAY_MS = 100;  // TMDB allows ~40 requests/second
const BATCH_SIZE = 50;      // Import to DB in batches of 50
const SAVE_PROGRESS_EVERY = 100; // Save progress file every N movies

// Progress file to resume interrupted imports
const PROGRESS_FILE = path.join(__dirname, 'data', 'import-progress.json');

/**
 * Parse CSV file manually (no external dependencies)
 */
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles basic cases)
    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Normalize IMDb ID to tt1234567 format
 */
function normalizeImdbId(id) {
  if (!id) return null;
  const cleaned = id.toString().trim();
  if (cleaned.startsWith('tt')) return cleaned;
  if (/^\d+$/.test(cleaned)) return `tt${cleaned.padStart(7, '0')}`;
  return null;
}

/**
 * Normalize severity to standard format
 */
function normalizeSeverity(value) {
  if (!value) return null;
  const v = value.toString().toLowerCase().trim();
  
  if (v === 'none' || v === '0' || v === 'n/a' || v === '') return 'None';
  if (v === 'mild' || v === '1') return 'Mild';
  if (v === 'moderate' || v === '2') return 'Moderate';
  if (v === 'severe' || v === '3') return 'Severe';
  
  return null;
}

/**
 * Look up TMDB ID from IMDb ID
 */
async function lookupTmdbId(imdbId) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not set');
  }
  
  try {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait and retry
        console.log('  Rate limited, waiting 10 seconds...');
        await sleep(10000);
        return lookupTmdbId(imdbId);
      }
      return null;
    }
    
    const data = await response.json();
    
    // Check movie results first
    if (data.movie_results && data.movie_results.length > 0) {
      return { tmdbId: data.movie_results[0].id, type: 'movie' };
    }
    
    // Also check TV results
    if (data.tv_results && data.tv_results.length > 0) {
      return { tmdbId: data.tv_results[0].id, type: 'tv' };
    }
    
    return null;
  } catch (error) {
    console.error(`  Error looking up ${imdbId}:`, error.message);
    return null;
  }
}

/**
 * Import batch to database via API
 */
async function importBatch(entries) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parental-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import: true,
        data: entries
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('  Failed to import batch:', error.message);
    return { inserted: 0, failed: entries.length };
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load progress from file
 */
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { processedImdbIds: [], tmdbIdCache: {} };
}

/**
 * Save progress to file
 */
function saveProgress(progress) {
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Main import function
 */
async function main() {
  console.log('===========================================');
  console.log('  Kaggle Parental Guide Import Script');
  console.log('===========================================\n');
  
  // Check for CSV file argument
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.log('Usage: node scripts/import-kaggle-parental-guide.js <path-to-csv>');
    console.log('\nExample:');
    console.log('  node scripts/import-kaggle-parental-guide.js ~/Downloads/imdb_parental_guide.csv');
    process.exit(1);
  }
  
  // Check TMDB API key
  if (!TMDB_API_KEY) {
    console.error('ERROR: TMDB_API_KEY not found in environment variables');
    console.log('\nMake sure you have TMDB_API_KEY set in your .env.local file');
    process.exit(1);
  }
  
  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: File not found: ${csvPath}`);
    process.exit(1);
  }
  
  // Load progress (for resuming interrupted imports)
  const progress = loadProgress();
  console.log(`Loaded progress: ${progress.processedImdbIds.length} already processed`);
  console.log(`TMDB ID cache: ${Object.keys(progress.tmdbIdCache).length} cached mappings\n`);
  
  // Read and parse CSV
  console.log(`Reading CSV: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`Found ${rows.length} rows in CSV\n`);
  
  // Show column names found
  if (rows.length > 0) {
    console.log('Detected columns:', Object.keys(rows[0]).join(', '));
    console.log('');
  }
  
  // Process rows
  const pendingEntries = [];
  let processed = 0;
  let found = 0;
  let notFound = 0;
  let skipped = 0;
  let inserted = 0;
  let failed = 0;
  
  console.log('Processing rows...\n');
  
  for (const row of rows) {
    // Find IMDb ID column (different datasets use different names)
    const imdbId = normalizeImdbId(
      row.imdb_id || row.tconst || row.imdbid || row['imdb id'] || row.id
    );
    
    if (!imdbId) {
      skipped++;
      continue;
    }
    
    // Skip if already processed
    if (progress.processedImdbIds.includes(imdbId)) {
      skipped++;
      continue;
    }
    
    processed++;
    
    // Check cache first, then TMDB API
    let tmdbResult = progress.tmdbIdCache[imdbId];
    
    if (!tmdbResult) {
      // Look up TMDB ID
      process.stdout.write(`  [${processed}] Looking up ${imdbId}...`);
      tmdbResult = await lookupTmdbId(imdbId);
      
      // Cache the result (even if null)
      progress.tmdbIdCache[imdbId] = tmdbResult;
      
      // Rate limiting
      await sleep(TMDB_DELAY_MS);
    }
    
    if (tmdbResult && tmdbResult.tmdbId) {
      console.log(` → TMDB ${tmdbResult.tmdbId} (${tmdbResult.type})`);
      found++;
      
      // Find severity columns (different datasets use different names)
      const entry = {
        tmdbId: tmdbResult.tmdbId,
        imdbId: imdbId,
        sexNudity: normalizeSeverity(
          row.sex_nudity || row['sex & nudity'] || row.sexnudity || row.sex
        ),
        violence: normalizeSeverity(
          row.violence || row['violence & gore'] || row.violencegore
        ),
        profanity: normalizeSeverity(
          row.profanity || row.language
        ),
        alcoholDrugsSmoking: normalizeSeverity(
          row.alcohol_drugs_smoking || row['alcohol, drugs & smoking'] || 
          row.alcoholdrugssmoking || row.drugs || row.alcohol
        ),
        frighteningIntense: normalizeSeverity(
          row.frightening_intense || row['frightening & intense scenes'] ||
          row.frighteningintense || row.frightening
        )
      };
      
      pendingEntries.push(entry);
    } else {
      console.log(` → not found`);
      notFound++;
    }
    
    // Mark as processed
    progress.processedImdbIds.push(imdbId);
    
    // Import batch when we have enough
    if (pendingEntries.length >= BATCH_SIZE) {
      console.log(`\n  Importing batch of ${pendingEntries.length} entries...`);
      const result = await importBatch(pendingEntries);
      inserted += result.inserted || 0;
      failed += result.failed || 0;
      console.log(`  Batch result: ${result.inserted} inserted, ${result.failed} failed\n`);
      pendingEntries.length = 0;
    }
    
    // Save progress periodically
    if (processed % SAVE_PROGRESS_EVERY === 0) {
      saveProgress(progress);
      console.log(`\n  --- Progress saved (${processed} processed) ---\n`);
    }
  }
  
  // Import remaining entries
  if (pendingEntries.length > 0) {
    console.log(`\nImporting final batch of ${pendingEntries.length} entries...`);
    const result = await importBatch(pendingEntries);
    inserted += result.inserted || 0;
    failed += result.failed || 0;
  }
  
  // Save final progress
  saveProgress(progress);
  
  // Summary
  console.log('\n===========================================');
  console.log('  Import Complete!');
  console.log('===========================================');
  console.log(`  Total rows in CSV:    ${rows.length}`);
  console.log(`  Processed:            ${processed}`);
  console.log(`  Skipped (no IMDb ID): ${skipped}`);
  console.log(`  TMDB IDs found:       ${found}`);
  console.log(`  TMDB IDs not found:   ${notFound}`);
  console.log(`  Inserted to DB:       ${inserted}`);
  console.log(`  Failed to insert:     ${failed}`);
  console.log('');
  console.log(`Progress saved to: ${PROGRESS_FILE}`);
  console.log('(You can resume an interrupted import by running the script again)');
}

main().catch(console.error);