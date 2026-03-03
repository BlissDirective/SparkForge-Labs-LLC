# Database Patterns: Designing Your App's Memory

## Table of Contents
1. What Is a Database (Really)?
2. Tables, Rows, and Columns
3. Relationships (How Data Connects)
4. Schema Design Process
5. Database Client Libraries (Talking to the Database)
6. Row Level Security (Protecting Data at the Source)
7. Validation at the Boundary
8. Migrations (Changing the Database Over Time)
9. Seeding (Populating Initial Data)
10. Common Patterns
11. Performance Basics
12. Security Essentials
13. SparkForge Database Reference

---

## 1. What Is a Database (Really)?

A database is where your app stores information permanently. Without one, everything disappears when the app restarts — like writing on a whiteboard that gets erased every night.

Think of a database as a filing cabinet:
- The cabinet = the database
- Each drawer = a table (Users, Posts, Comments)
- Each folder in a drawer = a row (one specific user, one specific post)
- The labels on each folder = columns (name, email, created_at)

### Two Types You Will See

**Relational databases (SQL)** — Data lives in structured tables with defined relationships. Think spreadsheets that can reference each other. Examples: PostgreSQL, MySQL, SQLite.

**Document databases (NoSQL)** — Data lives in flexible JSON-like documents. Think filing folders where each folder can have different contents. Examples: MongoDB, Firebase Firestore.

SparkForge uses **PostgreSQL** via **Supabase** — a relational database with built-in authentication, storage, and real-time subscriptions.

---

## 2. Tables, Rows, and Columns

A table is like a spreadsheet. Each column is a category of information, each row is one entry.

### Primary Keys

Every row has a unique ID called a "primary key" — no two rows share the same one. This is how the database identifies each record.

```sql
-- UUID primary key (Supabase default)
id UUID DEFAULT gen_random_uuid() PRIMARY KEY

-- Auto-incrementing integer (traditional)
id SERIAL PRIMARY KEY
```

Supabase defaults to UUIDs. They are longer but globally unique — important when data might come from multiple sources.

### Column Types

| Type | What It Stores | Example Column |
|------|---------------|----------------|
| `TEXT` / `VARCHAR` | Text strings | name, email, description |
| `INTEGER` | Whole numbers | age, score, level |
| `BOOLEAN` | True or false | is_active, published |
| `TIMESTAMP` / `TIMESTAMPTZ` | Date and time | created_at, updated_at |
| `UUID` | Unique identifier | id, user_id |
| `JSONB` | Flexible JSON data | settings, metadata, avatar |
| `REAL` / `FLOAT8` | Decimal numbers | percentage, price |

### Constraints

Constraints are rules that the database enforces automatically:

| Constraint | What It Does | Example |
|-----------|-------------|---------|
| `NOT NULL` | Column must have a value | email cannot be empty |
| `UNIQUE` | No two rows can have the same value | email must be unique |
| `DEFAULT` | Auto-fills if no value provided | `created_at DEFAULT now()` |
| `CHECK` | Value must meet a condition | `CHECK (age >= 0)` |
| `REFERENCES` | Must point to a valid row in another table | `user_id REFERENCES users(id)` |

---

## 3. Relationships (How Data Connects)

### One-to-Many (Most Common)

One parent has MANY children. One child belongs to ONE parent.

```sql
-- PARENTS table
CREATE TABLE parents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

-- CHILDREN table (many children per parent)
CREATE TABLE children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age_band TEXT CHECK (age_band IN ('A', 'B', 'C'))
);
```

The `parent_id` column in CHILDREN is a "foreign key" — it points to a row in PARENTS. `ON DELETE CASCADE` means if a parent is deleted, their children records are deleted too.

### Many-to-Many

A child can earn MANY badges. A badge can be earned by MANY children. This needs a "bridge table" (or "join table"):

```sql
-- BADGES table
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Bridge table: which child earned which badge
CREATE TABLE child_badges (
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (child_id, badge_id)  -- composite primary key
);
```

### One-to-One

One child has ONE progress record per game. Used when you want to keep related data in a separate table for clarity.

---

## 4. Schema Design Process

"Schema" means the blueprint of your database — what tables exist and how they are connected.

### Step 1: List Your Nouns

Look at your app and write down every "thing" it deals with. Each noun usually becomes a table.

**Generic example:** Users, Posts, Comments, Tags
**SparkForge example:** Parents, Children, Content (lessons/quizzes/facts), Progress, Badges, Streaks, Daily Challenges

### Step 2: List Properties of Each Noun

For each noun, what info does the app need to store?

```
Children: display_name, age_band, avatar_url, xp, level, active_world
Progress: child_id, game_slug, score, completed, attempts
Badges: name, slug, description, icon_url, category, world
```

Each property becomes a column.

### Step 3: Draw the Connections

How are the nouns related?

```
Parent HAS MANY Children              (one-to-many)
Child HAS MANY Progress records        (one-to-many)
Child HAS MANY Badges (via bridge)     (many-to-many)
Content BELONGS TO one World           (many-to-one)
Progress REFERENCES one Content item   (many-to-one)
```

### Step 4: Define in SQL

With Supabase, you write SQL directly. With an ORM like Prisma, you write a schema file that generates SQL.

### SparkForge Schema Overview (9 Tables)

```
parents ──< children ──< progress
                │──< child_badges >── badges
                │──< streaks
                └──< daily_challenges

content (lessons, quizzes, facts)
```

Note: SparkForge uses `world` in the database but displays "Lab" in the UI. This is intentional — see Section 13.

---

## 5. Database Client Libraries (Talking to the Database)

A database client lets you talk to the database using your programming language instead of writing raw SQL for every operation.

### Supabase Client (SparkForge's Approach)

Supabase provides a JavaScript client that translates method calls into SQL:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch a single child by ID
const { data: child, error } = await supabase
  .from('children')
  .select('*')
  .eq('id', childId)
  .single();

// Fetch children with their badges (join)
const { data, error } = await supabase
  .from('children')
  .select(`
    id,
    display_name,
    xp,
    child_badges (
      earned_at,
      badges ( name, description, icon_url )
    )
  `)
  .eq('parent_id', parentId);

// Insert a new progress record
const { data, error } = await supabase
  .from('progress')
  .insert({
    child_id: childId,
    game_slug: 'neural-builder',
    score: 85,
    completed: true
  });

// Update XP
const { data, error } = await supabase
  .from('children')
  .update({ xp: newXp, level: newLevel })
  .eq('id', childId);
```

### Supabase Client Types: Anon vs Service Role

Supabase has two keys that create clients with different access levels:

| Key | Access Level | Where to Use |
|-----|-------------|-------------|
| `ANON_KEY` | Respects RLS policies (see Section 6) | Frontend, API routes acting as user |
| `SERVICE_ROLE_KEY` | Bypasses RLS, full access | Server-only operations (seeding, admin, content agent) |

**Rule:** Never expose the service role key to the browser. Use it only in server-side code (API routes, server components).

```typescript
// Browser client (uses anon key, respects RLS)
import { createBrowserClient } from '@/lib/supabase-browser';

// Server client (uses service role, bypasses RLS)
import { createServerClient } from '@/lib/supabase-server';
```

### ORM Alternative: Prisma

For projects that do not use Supabase, Prisma is a popular ORM that works with PostgreSQL:

```typescript
// Prisma query equivalent
const child = await prisma.child.findUnique({
  where: { id: childId },
  include: { badges: true }
});
```

Prisma uses a `.prisma` schema file to define tables and auto-generates TypeScript types. See the Prisma documentation for details.

### Other Database Client Options

| Language | Library | Style |
|----------|---------|-------|
| TypeScript | **Supabase JS** | Query builder (method chaining) |
| TypeScript | **Prisma** | ORM with schema file and generated client |
| TypeScript | **Drizzle** | Lightweight, SQL-like syntax |
| Python | **SQLAlchemy** | Full ORM or raw SQL |
| Python | **Supabase Python** | Same API as JS client |

---

## 6. Row Level Security (Protecting Data at the Source)

Row Level Security (RLS) is a PostgreSQL feature that controls which rows a user can see or modify. Instead of checking permissions in your API code, the database itself enforces the rules.

### Why RLS Matters

Without RLS, if your API has a bug, any user could potentially read or modify any data. With RLS, even if your API code is wrong, the database still blocks unauthorized access.

Think of it like building security:
- **Without RLS:** The front desk checks your ID, but once you are inside, every door is unlocked.
- **With RLS:** Every door has its own lock, and your keycard only opens the ones you are authorized for.

### How RLS Works

1. Enable RLS on a table (locks it down — nobody can access anything by default)
2. Create policies that define who can do what

```sql
-- Step 1: Enable RLS on the children table
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Step 2: Parents can only see their own children
CREATE POLICY "Parents see own children"
  ON children
  FOR SELECT
  USING (parent_id = auth.uid());

-- Step 3: Parents can only insert children linked to themselves
CREATE POLICY "Parents insert own children"
  ON children
  FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- Step 4: Parents can only update their own children
CREATE POLICY "Parents update own children"
  ON children
  FOR UPDATE
  USING (parent_id = auth.uid());

-- Step 5: Parents can only delete their own children
CREATE POLICY "Parents delete own children"
  ON children
  FOR DELETE
  USING (parent_id = auth.uid());
```

### RLS Policy Breakdown

| Clause | Meaning |
|--------|---------|
| `FOR SELECT` | Controls who can read rows |
| `FOR INSERT` | Controls who can create rows |
| `FOR UPDATE` | Controls who can modify rows |
| `FOR DELETE` | Controls who can remove rows |
| `USING (condition)` | Row is visible/modifiable only if condition is true |
| `WITH CHECK (condition)` | New/updated row must satisfy condition |
| `auth.uid()` | The currently logged-in user's ID (Supabase Auth) |

### Common RLS Patterns

**Public read, authenticated write:**
```sql
-- Anyone can read content
CREATE POLICY "Public content read" ON content
  FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "Auth users insert" ON content
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**Parent-scoped access (SparkForge pattern):**
```sql
-- Parent sees only their children's progress
CREATE POLICY "Parent sees child progress" ON progress
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );
```

### RLS and the Service Role Key

The service role key **bypasses all RLS policies**. This is why it must never reach the browser. Use it only for:
- Database seeding
- Admin operations
- Content agent (server-side)
- Background jobs

---

## 7. Validation at the Boundary

RLS protects who can access data. Validation protects what data gets in.

### The Rule: Validate on the Server, Always

Never trust data from the browser. Even if your frontend has form validation, a user can bypass it using browser dev tools or a tool like `curl`.

```
Browser form validation  →  Nice UX, but NOT security
Server-side validation   →  Actual protection
Database constraints     →  Last line of defense
```

All three layers should exist. They complement each other.

### Zod Validation (SparkForge's Approach)

SparkForge uses **Zod** to define validation schemas and validate API input:

```typescript
import { z } from 'zod';

// Define the shape of valid input
const CreateChildSchema = z.object({
  display_name: z.string().min(1).max(50),
  age_band: z.enum(['A', 'B', 'C']),
  avatar_url: z.string().url().optional(),
});

// In your API route:
export async function POST(req: Request) {
  const body = await req.json();

  // Validate — throws if invalid
  const parsed = CreateChildSchema.parse(body);

  // If we get here, `parsed` is guaranteed to match the schema
  const { data, error } = await supabase
    .from('children')
    .insert({
      parent_id: userId,
      display_name: parsed.display_name,
      age_band: parsed.age_band,
      avatar_url: parsed.avatar_url,
    });
}
```

### Why Zod Over Manual Checks?

```typescript
// MANUAL (verbose, easy to miss a case)
if (!body.display_name || typeof body.display_name !== 'string') {
  return Response.json({ error: 'Name required' }, { status: 400 });
}
if (body.display_name.length > 50) {
  return Response.json({ error: 'Name too long' }, { status: 400 });
}
if (!['A', 'B', 'C'].includes(body.age_band)) {
  return Response.json({ error: 'Invalid age band' }, { status: 400 });
}

// ZOD (declarative, complete, reusable)
const parsed = CreateChildSchema.safeParse(body);
if (!parsed.success) {
  return Response.json({ error: parsed.error.issues }, { status: 400 });
}
```

Zod schemas can also be reused between frontend and backend — define once, validate in both places.

---

## 8. Migrations (Changing the Database Over Time)

Your app evolves. Today you have Users and Posts. Next week you add Comments. Next month you add a "role" field to Users.

A "migration" is a recorded change to your database structure. Think of it like a changelog for your database — each migration says "on this date, we made this change."

### Why Not Just Change the Database Directly?

If you change the database directly:
- Other developers will not know what changed
- Your production database will not match your development database
- You cannot undo changes
- You might lose data

With migrations:
- Every change is recorded and versioned
- Any developer can run all migrations to get the latest database structure
- You can roll back (undo) a migration if something goes wrong

### Supabase Migration Workflow

```bash
# 1. Write your SQL changes in a migration file
# supabase/migrations/20260301_add_streaks_table.sql

# 2. Apply locally
supabase db reset   # Resets local DB and runs all migrations in order

# 3. Or apply to a live project
supabase db push    # Pushes pending migrations to the remote project
```

For SparkForge, Stage 2 uses a different approach: SQL blocks are provided in the stage document and executed manually in the Supabase SQL Editor (HARD STOP HS-7). This is because the initial schema is large and needs human verification.

### Migration Best Practices

| Practice | Why |
|----------|-----|
| One change per migration file | Easy to understand and roll back |
| Never modify a migration that has been applied | Creates mismatches between environments |
| Name files descriptively | `20260301_add_streaks_table.sql` not `migration_7.sql` |
| Test migrations on a copy first | Never experiment on production |
| Back up before running migrations in production | Safety net if something goes wrong |

### ORM Migration Alternative (Prisma)

For projects using Prisma instead of Supabase:

```bash
# Edit schema.prisma, then:
npx prisma migrate dev --name add_comments_table
# Prisma generates SQL, applies it, and regenerates the client
```

---

## 9. Seeding (Populating Initial Data)

Seeding is inserting starter data that your app needs to function. Think of it like stocking a new store's shelves before opening day.

### What to Seed

| Category | Examples |
|----------|---------|
| **Reference data** | Badge definitions, achievement thresholds, tier configurations |
| **Default content** | Starter lessons, sample quizzes, placeholder facts |
| **Test data** | Fake users and profiles for development (never in production) |
| **Configuration** | Feature flags, default settings |

### SparkForge Seeding Example

SparkForge seeds 68 badges and 150+ content items in Stage 2 and Stage 9:

```sql
-- Seed badges (Stage 2, Part 1)
INSERT INTO badges (name, slug, description, icon_url, category, world) VALUES
  ('First Steps', 'first-steps', 'Complete your first game', '/badges/first-steps.svg', 'milestone', 1),
  ('Lab 1 Explorer', 'lab-1-explorer', 'Complete all Lab 1 games', '/badges/lab-1.svg', 'completion', 1),
  ('Speed Demon', 'speed-demon', 'Complete a game in under 60 seconds', '/badges/speed.svg', 'special', NULL)
  -- ... 65 more badges
;
```

### Seeding Best Practices

| Practice | Why |
|----------|-----|
| Make seeds idempotent | Running them twice should not create duplicates. Use `INSERT ... ON CONFLICT DO NOTHING` |
| Separate dev seeds from production seeds | Test data should never reach production |
| Seed after migrations | Schema must exist before you can insert data |
| Keep seed files in version control | Everyone on the team gets the same starting data |

```sql
-- Idempotent seed (safe to run multiple times)
INSERT INTO badges (slug, name, description)
VALUES ('first-steps', 'First Steps', 'Complete your first game')
ON CONFLICT (slug) DO NOTHING;
```

---

## 10. Common Patterns

### Soft Delete

Instead of actually deleting data, mark it as deleted. Like moving a file to the trash instead of permanently deleting it.

```sql
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- "Delete" a post (soft)
UPDATE posts SET deleted_at = now() WHERE id = '...';

-- Query only active posts
SELECT * FROM posts WHERE deleted_at IS NULL;
```

Why? You can "undo" deletes and keep data for analytics. Your RLS policies and queries should filter on `deleted_at IS NULL`.

### Timestamps

Always add `created_at` and `updated_at` to every table. You will thank yourself later.

```sql
CREATE TABLE any_table (
  -- ... your columns
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Auto-update updated_at on any change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON any_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Pagination

Do not load ALL records at once. If you have 10,000 records, loading them all would be slow and wasteful. Load a page at a time.

```typescript
// Supabase: Load items 20-39 (page 2, 20 per page)
const { data, error } = await supabase
  .from('content')
  .select('*')
  .order('created_at', { ascending: false })
  .range(20, 39);
```

### Indexing

An index makes searching faster. Without an index, the database checks EVERY row. With an index, it jumps straight to the answer.

Analogy: Looking up a word in a dictionary. Without an index, you read every page. With an index (alphabetical ordering), you jump to the right section.

```sql
-- Index on columns you frequently filter or search by
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_progress_child_id ON progress(child_id);
CREATE INDEX idx_content_world ON content(world);

-- UNIQUE constraint automatically creates an index
-- PRIMARY KEY automatically creates an index
```

Add indexes on columns you frequently use in WHERE clauses, JOIN conditions, or ORDER BY.

### Transactions

A transaction groups multiple database operations so they all succeed or all fail together. No partial results.

```typescript
// Without transaction: if step 2 fails, step 1 already happened (bad)
await supabase.from('children').update({ xp: newXp }).eq('id', childId);
await supabase.from('child_badges').insert({ child_id: childId, badge_id: badgeId });
// If badge insert fails, XP was already awarded incorrectly

// With transaction (via Supabase RPC / database function):
CREATE OR REPLACE FUNCTION award_badge_and_xp(
  p_child_id UUID,
  p_badge_id UUID,
  p_xp_amount INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE children SET xp = xp + p_xp_amount WHERE id = p_child_id;
  INSERT INTO child_badges (child_id, badge_id) VALUES (p_child_id, p_badge_id);
  -- If either fails, BOTH are rolled back
END;
$$ LANGUAGE plpgsql;
```

Call from your app:
```typescript
const { error } = await supabase.rpc('award_badge_and_xp', {
  p_child_id: childId,
  p_badge_id: badgeId,
  p_xp_amount: 50,
});
```

---

## 11. Performance Basics

### The N+1 Problem

The most common database performance mistake for beginners.

**Bad (N+1 queries):** Fetch 10 children, then make a SEPARATE query for each child's badges = 11 queries total.

**Good (eager loading):** Fetch 10 children AND their badges in ONE query.

```typescript
// BAD: N+1 problem
const { data: children } = await supabase
  .from('children')
  .select('*')
  .eq('parent_id', parentId);

for (const child of children) {
  // This makes a separate database call for EACH child
  const { data: badges } = await supabase
    .from('child_badges')
    .select('badges(*)')
    .eq('child_id', child.id);
}

// GOOD: Single query with join
const { data: children } = await supabase
  .from('children')
  .select(`
    *,
    child_badges (
      badges ( name, description, icon_url )
    )
  `)
  .eq('parent_id', parentId);
```

SparkForge addresses this pattern specifically with BUG-3: using a single `/api/progress/all-labs` endpoint instead of 10 parallel per-lab API calls.

### Connection Pooling

Opening a new database connection for every request is slow (like making a new phone call for every sentence). Connection pooling keeps connections open and reuses them.

Supabase handles this automatically with **Supavisor** (its built-in connection pooler). For serverless environments like Vercel, use the pooled connection string from your Supabase project settings, not the direct connection.

### When to Worry About Performance

Do not optimize prematurely. The order of priority:
1. Make it work correctly
2. Make the code clean and readable
3. If something is slow, THEN optimize

Most apps with under 10,000 users will never hit performance problems with a properly set up PostgreSQL database. When you do need to optimize:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Page loads slowly | N+1 queries | Use joins / includes (see above) |
| Search is slow | Missing index | Add index on searched columns |
| Writes are slow | Too many indexes | Remove unused indexes (each index slows writes) |
| Memory issues | Loading too much data | Add pagination (Section 10) |
| Timeouts on serverless | Connection exhaustion | Use pooled connection string |

---

## 12. Security Essentials

### SQL Injection

The most dangerous database vulnerability. An attacker puts SQL code into an input field, and your app executes it.

```typescript
// VULNERABLE: String concatenation
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
// If userInput = "'; DROP TABLE users; --" ... your table is gone

// SAFE: Parameterized query (Supabase does this automatically)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userInput);
// Supabase escapes the input, so SQL injection is impossible
```

**Rule:** Never build SQL strings by concatenating user input. Always use parameterized queries or a query builder that handles escaping.

### Data Exposure

Never return sensitive fields to the frontend:

```typescript
// BAD: Returns everything, including hashed password
const { data } = await supabase.from('parents').select('*');

// GOOD: Select only what the frontend needs
const { data } = await supabase
  .from('parents')
  .select('id, email, display_name, created_at');
```

### Defense in Depth

SparkForge uses three layers of protection:

```
Layer 1: Zod validation         →  Rejects malformed input
Layer 2: RLS policies           →  Database blocks unauthorized access
Layer 3: Database constraints   →  NOT NULL, UNIQUE, CHECK enforce data integrity
```

If any single layer has a bug, the other two still protect you.

### Backup Strategy

| Environment | Backup | Frequency |
|-------------|--------|-----------|
| Development | Not critical — can rebuild from migrations + seeds | On demand |
| Staging | Supabase automatic daily backups | Daily |
| Production | Supabase automatic + manual before migrations | Daily + before changes |

---

## 13. SparkForge Database Reference

### Terminology Mapping

SparkForge uses different terms in different contexts. This is intentional.

| Context | Term | Example |
|---------|------|---------|
| Database columns | `world` | `SELECT * FROM content WHERE world = 3` |
| API parameters | `world` | `GET /api/content?world=3` |
| UI display text | "Lab" | "Welcome to Lab 3: Neural Networks" |
| Hook names | "Lab" | `useLabContent()` |
| Store properties | `labColor` | `childStore.labColor` |
| Type constants | `WORLDS` | `WORLDS.NEURAL_NETWORKS` |

### Schema Overview (9 Tables, Stage 2)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `parents` | Parent/guardian accounts | Links to Supabase `auth.users` |
| `children` | Child profiles (1-4 per parent) | Belongs to parent |
| `content` | Lessons, quizzes, facts | Belongs to a world |
| `progress` | Game completion records | Belongs to child + content |
| `badges` | 68 achievement definitions | Reference table |
| `child_badges` | Which child earned which badge | Bridge: child <> badge |
| `streaks` | Daily login/play streaks | Belongs to child |
| `daily_challenges` | Daily challenge assignments | Belongs to child |
| `content_reviews` | Admin review queue (Stage 9) | References content |

### Hard Stops (Database-Related)

| ID | When | What Happens |
|----|------|-------------|
| HS-1 | Before Stage 2 | Need Supabase project URL, anon key, service role key in `.env.local` |
| HS-7 | Stage 2 Part 1 | SQL blocks provided for human to execute in Supabase SQL Editor |

### Index Strategy (14 Indexes, Stage 2)

Indexes are defined in Stage 2 Part 1. Key indexes:

```sql
-- Frequently queried relationships
CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_progress_child ON progress(child_id);
CREATE INDEX idx_content_world ON content(world);

-- Frequently filtered columns
CREATE INDEX idx_progress_game ON progress(game_slug);
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_content_type ON content(content_type);
```
