-- ════════════════════════════════════════════════════
-- STARTER CONTENT SEED DATA (6 items for Labs 1-3) — CANONICAL
-- Merged from 003_seed_content.sql + 005_content_seed.sql (Audit Batch 3)
-- Uses the richer quiz format (correct_index + explanation + hint) from 003
-- Uses ON CONFLICT (slug) DO UPDATE for idempotent re-runs
-- ════════════════════════════════════════════════════

-- Lab 1: What IS AI? (Band A)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'What is Artificial Intelligence?', 'lab1-intro-ai-a', 'lesson', 'A', 'beginner',
'# What is AI?

Have you ever talked to Siri or Alexa? Or watched Netflix pick a show for you? That''s AI at work!

**AI** stands for **Artificial Intelligence**. It means a computer that can do things that usually need a human brain — like understanding words, recognizing pictures, or making decisions.

## AI is Everywhere!

- Video game characters that learn your moves
- Your phone''s autocorrect
- Cars that can park themselves
- Music apps that suggest songs you''ll like

## What AI is NOT

AI is not a robot from movies. It''s not alive. It''s not thinking the way you think. It''s really just software — programs written by people.

Think of it like this: you can teach a dog to sit by giving it treats. AI learns kind of the same way, but with data instead of treats!',
15, 8, 1, true, 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  target_age_band = EXCLUDED.target_age_band,
  difficulty = EXCLUDED.difficulty,
  content_body = EXCLUDED.content_body,
  xp_reward = EXCLUDED.xp_reward,
  estimated_minutes = EXCLUDED.estimated_minutes,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status;

-- Lab 1: What IS AI? (Band B)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'Introduction to Artificial Intelligence', 'lab1-intro-ai-b', 'lesson', 'B', 'beginner',
'# Introduction to AI

Artificial Intelligence is the field of computer science focused on creating systems that can perform tasks that typically require human intelligence.

## Key Concepts

**Machine Learning** is the most common AI today. Instead of programming every rule, we show the computer thousands of examples and let it find the patterns itself.

**Neural Networks** are inspired by the human brain. They process information through layers of connected nodes, each making small decisions that combine into complex outputs.

**Natural Language Processing (NLP)** helps computers understand and generate human language — powering chatbots, translators, and voice assistants.

## Where AI Lives Today

AI isn''t science fiction. It''s in your pocket:
- Spam filters in your email
- Face recognition on your phone
- Recommendation algorithms on YouTube and TikTok
- Auto-complete when you type

## The Big Picture

AI is a tool, not magic. It excels at specific tasks but can''t truly "think" the way humans do. Understanding AI helps you use it wisely and even build it yourself!',
15, 10, 1, true, 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  target_age_band = EXCLUDED.target_age_band,
  difficulty = EXCLUDED.difficulty,
  content_body = EXCLUDED.content_body,
  xp_reward = EXCLUDED.xp_reward,
  estimated_minutes = EXCLUDED.estimated_minutes,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status;

-- Lab 1: Quiz (Band A) — uses richer format: correct_index + explanation + hint
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, quiz_questions, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'AI Basics Quiz', 'lab1-quiz-basics-a', 'quiz', 'A', 'beginner',
'[{"question":"What does AI stand for?","options":["Awesome Internet","Artificial Intelligence","Automatic Information","Apple Intelligence"],"correct_index":1,"explanation":"AI stands for Artificial Intelligence — computers that can do tasks that usually need human brains!","hint":"Think about what kind of intelligence a computer has."},{"question":"Which of these uses AI?","options":["A wooden chair","A regular calculator","Siri or Alexa","A light switch"],"correct_index":2,"explanation":"Voice assistants like Siri and Alexa use AI to understand your words and respond!","hint":"Which one can understand what you say?"},{"question":"How does AI learn?","options":["By reading books at night","By looking at lots of examples","By dreaming about data","It already knows everything"],"correct_index":1,"explanation":"AI learns by studying thousands or millions of examples and finding patterns in the data.","hint":"Think about the puppy learning to fetch with treats."}]',
30, 5, 2, true, 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  target_age_band = EXCLUDED.target_age_band,
  difficulty = EXCLUDED.difficulty,
  quiz_questions = EXCLUDED.quiz_questions,
  xp_reward = EXCLUDED.xp_reward,
  estimated_minutes = EXCLUDED.estimated_minutes,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status;

-- Lab 1: Spark Fact
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'The First AI Program', 'lab1-fact-first-ai', 'spark_fact', 'A', 'beginner',
'The very first AI program was written in 1951! It could play checkers and actually learned to get better over time!',
5, 1, 3, true, 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  target_age_band = EXCLUDED.target_age_band,
  difficulty = EXCLUDED.difficulty,
  content_body = EXCLUDED.content_body,
  xp_reward = EXCLUDED.xp_reward,
  estimated_minutes = EXCLUDED.estimated_minutes,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status;

-- Lab 2: Teaching Machines (Band A)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(2, 'How Do Machines Learn?', 'lab2-intro-ml-a', 'lesson', 'A', 'beginner',
'# How Do Machines Learn?

Imagine teaching a puppy to fetch. You throw the ball, the puppy brings it back, you give it a treat. After enough tries, the puppy learns!

AI learns the same way — through **examples** and **feedback**.

## The Three Steps

### Step 1: Show It Examples
Give the computer LOTS of examples. Want it to recognize cats? Show it 10,000 pictures of cats!

### Step 2: Let It Practice
The computer tries to find patterns. "Cats have pointy ears, whiskers, and fur..."

### Step 3: Check Its Work
Test with NEW pictures it hasn''t seen. Did it get them right?

## Why Data Matters

The examples are called **training data**. If you only show orange cats, it might think ALL cats are orange. More diverse data = smarter AI!',
15, 8, 1, true, 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  target_age_band = EXCLUDED.target_age_band,
  difficulty = EXCLUDED.difficulty,
  content_body = EXCLUDED.content_body,
  xp_reward = EXCLUDED.xp_reward,
  estimated_minutes = EXCLUDED.estimated_minutes,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status;

-- Lab 3: Neural Networks (Band B)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(3, 'Neural Networks: The Artificial Brain', 'lab3-intro-nn-b', 'lesson', 'B', 'intermediate',
'# Neural Networks

Neural networks are computing systems loosely inspired by biological neural networks in our brains. They learn to perform tasks by considering examples.

## Neurons and Connections

1. **Input Layer** — receives raw data (like pixel values)
2. **Hidden Layers** — process and transform data through weighted connections
3. **Output Layer** — produces the result (like "this is a cat")

## How Learning Happens

Each connection has a **weight**. During training:
- The network makes a prediction
- Compares prediction to correct answer
- Adjusts weights to get closer
- Repeats thousands or millions of times

## Deep Learning

Many hidden layers = **deep learning**. Deeper networks learn more complex patterns.',
15, 12, 1, true, 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  target_age_band = EXCLUDED.target_age_band,
  difficulty = EXCLUDED.difficulty,
  content_body = EXCLUDED.content_body,
  xp_reward = EXCLUDED.xp_reward,
  estimated_minutes = EXCLUDED.estimated_minutes,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status;
