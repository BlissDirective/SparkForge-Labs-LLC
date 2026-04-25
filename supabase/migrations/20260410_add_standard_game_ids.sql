-- ================================================================
-- Standard Tier Game IDs — Content Queue Extension
-- Date: April 10, 2026
-- Purpose: Add 20 Standard game IDs to the content_queue game_id enum
-- Prerequisite: Existing content_queue table with game_id column
-- ================================================================

-- Add 20 Standard tier game IDs to the game_id check constraint
-- This extends the existing enum used by the AI content curation pipeline
-- to support Standard tier games alongside Flagship (5) and FL-Lite (9)

-- Step 1: Drop existing constraint (if it exists)
ALTER TABLE IF EXISTS content_queue
  DROP CONSTRAINT IF EXISTS content_queue_game_id_check;

-- Step 2: Re-create with all 34 game IDs (5 Flagship + 9 FL-Lite + 20 Standard)
ALTER TABLE IF EXISTS content_queue
  ADD CONSTRAINT content_queue_game_id_check CHECK (
    game_id IN (
      -- Flagship Games (5)
      'pet-trainer', 'sort-toy-box', 'neural-builder', 'agent-architect', 'bias-detective',
      -- FL-Lite Games (9)
      'data-detective', 'robot-vacuum', 'camera-quest', 'chatbot-builder', 'emoji-decoder',
      'code-blocks', 'my-first-ai-app', 'future-forge', 'ai-or-not',
      -- Standard Games (20)
      'ai-spy', 'time-machine', 'human-vs-machine',
      'treat-trainer', 'neuron-relay', 'pixel-investigator',
      'word-predictor', 'token-chopper', 'ai-art-detective',
      'tool-picker', 'data-shield', 'real-or-fake',
      'ethics-courtroom', 'fool-the-ai', 'build-classifier',
      'prediction-market', 'sentiment-scanner', 'lost-in-translation',
      'career-explorer', 'api-explorer'
    )
  );

-- Step 3: Add 60 Standard content types to content_type check constraint
ALTER TABLE IF EXISTS content_queue
  DROP CONSTRAINT IF EXISTS content_queue_content_type_check;

ALTER TABLE IF EXISTS content_queue
  ADD CONSTRAINT content_queue_content_type_check CHECK (
    content_type IN (
      -- Flagship content types (10)
      'pet-training-category', 'pet-novel-category',
      'sort-criterion', 'sort-shape-config',
      'neural-challenge', 'neural-test-dataset',
      'agent-mission', 'agent-themed-pack',
      'bias-case', 'bias-stakeholder-interview',
      -- FL-Lite content types (27)
      'dataset-scenario', 'anomaly-explanation', 'data-concept-card',
      'room-layout', 'rule-challenge', 'vacuum-learn-card',
      'hunt-item', 'cv-concept-explanation', 'hunt-theme',
      'conversation-template', 'personality-script', 'chatbot-challenge',
      'emoji-puzzle', 'nlp-fun-fact', 'emoji-cultural-variant',
      'programming-challenge', 'code-hint', 'code-solution-feedback',
      'app-category', 'app-power-description', 'app-idea',
      'world-scenario', 'capability-mapping', 'impact-narrative',
      'capability-scenario', 'timeline-assessment', 'evidence-explanation',
      -- Standard content types (60)
      'spy-scene', 'spy-item-set', 'spy-explanation',
      'timeline-milestone', 'era-challenge', 'ai-history-card',
      'hvm-challenge', 'hvm-comparison', 'hvm-concept-card',
      'rl-maze', 'reward-challenge', 'rl-learn-card',
      'neuron-puzzle', 'network-challenge', 'neural-concept-card',
      'pixel-image', 'reveal-challenge', 'cnn-learn-card',
      'prediction-sentence', 'probability-challenge', 'llm-concept-card',
      'token-challenge', 'tokenizer-puzzle', 'token-learn-card',
      'art-comparison', 'detection-challenge', 'genai-learn-card',
      'tool-task', 'multi-tool-scenario', 'ai-tool-card',
      'privacy-scenario', 'data-dilemma', 'privacy-learn-card',
      'fake-content', 'detection-tip', 'misinfo-learn-card',
      'ethics-case', 'stakeholder-perspective', 'ethics-framework-card',
      'classification-item', 'adversarial-challenge', 'cv-learn-card',
      'training-image-set', 'test-challenge', 'ml-pipeline-card',
      'ai-prediction', 'forecast-analysis', 'futures-learn-card',
      'sentiment-challenge', 'emotion-text', 'nlp-learn-card',
      'translation-chain', 'idiom-challenge', 'mt-learn-card',
      'ai-career', 'skill-matching', 'career-learn-card',
      'api-endpoint', 'request-challenge', 'api-concept-card'
    )
  );

-- Step 4: Create index for efficient filtering by game_id
CREATE INDEX IF NOT EXISTS idx_content_queue_game_id ON content_queue(game_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_content_type ON content_queue(content_type);
