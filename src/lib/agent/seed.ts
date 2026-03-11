// ════════════════════════════════════════════════════
// SEED CONTENT SCRIPT — Programmatic alternative to SQL
// Usage: npx tsx src/lib/agent/seed.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
// ════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
  console.error('Set these environment variables before running the seed script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('SparkForge Content Seed Script');
  console.log('==============================');
  console.log('Target: 150 lessons + 90 quizzes + 60 spark facts = 300 items\n');

  // Check connection and existing content
  const { count, error: countError } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Failed to connect to Supabase:', countError.message);
    console.error('\nMake sure your Supabase project is running and credentials are correct.');
    process.exit(1);
  }

  console.log(`Current content count: ${count ?? 0} items`);

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), 'sql', 'stage9-seed-content.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found at: ${sqlPath}`);
    console.error('Make sure sql/stage9-seed-content.sql exists.');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  const insertCount = (sqlContent.match(/INSERT INTO/g) || []).length;

  console.log(`\nSQL file contains ${insertCount} INSERT statements.`);
  console.log('\nTo seed the database, run this SQL file in your Supabase SQL Editor:');
  console.log(`  File: ${sqlPath}`);
  console.log('\nAlternatively, use the Supabase CLI:');
  console.log('  supabase db reset  (if using local development)');
  console.log('  or paste the SQL directly into the Supabase Dashboard SQL Editor');

  // Verify current distribution
  const { data: stats } = await supabase
    .from('content')
    .select('type, target_age_band, world');

  if (stats && stats.length > 0) {
    const byType: Record<string, number> = {};
    const byLab: Record<number, number> = {};

    for (const item of stats) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byLab[item.world] = (byLab[item.world] || 0) + 1;
    }

    console.log('\nCurrent content distribution:');
    console.log('  By type:', byType);
    console.log('  By lab:', byLab);
  }

  console.log('\nSeed script complete.');
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
