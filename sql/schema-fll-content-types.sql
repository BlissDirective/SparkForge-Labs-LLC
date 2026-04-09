-- ════════════════════════════════════════════════════
-- FL-Lite Content Types Migration
-- Extends content_queue.type CHECK to include FL-Lite game content types.
-- Run AFTER 001_schema.sql and schema-stage9.sql.
-- ════════════════════════════════════════════════════

-- Drop and recreate the type CHECK constraint on content_queue
-- to accept all game tier content types (flagship + FL-Lite + pipeline types)
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_type_check;
ALTER TABLE content_queue ADD CONSTRAINT content_queue_type_check
  CHECK (type IN (
    -- Core pipeline types
    'lesson', 'quiz', 'game', 'spark_fact', 'activity', 'sandbox',
    'game_scenario', 'game_challenge', 'trending_topic', 'branching_lesson',
    -- Flagship game types
    'flagship_pet_category', 'flagship_sort_criterion', 'flagship_neural_challenge',
    'flagship_agent_mission', 'flagship_bias_case',
    -- FL-Lite game types
    'fll_data_detective', 'fll_robot_vacuum', 'fll_camera_quest',
    'fll_chatbot_builder', 'fll_emoji_decoder', 'fll_code_blocks',
    'fll_my_first_ai_app', 'fll_future_forge', 'fll_ai_or_not'
  ));

-- Also expand content.type CHECK for approved FL-Lite content published to live table
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_type_check;
ALTER TABLE content ADD CONSTRAINT content_type_check
  CHECK (type IN (
    'lesson', 'quiz', 'game', 'spark_fact', 'activity', 'sandbox',
    'game_scenario', 'game_challenge', 'trending_topic', 'branching_lesson',
    'flagship_pet_category', 'flagship_sort_criterion', 'flagship_neural_challenge',
    'flagship_agent_mission', 'flagship_bias_case',
    'fll_data_detective', 'fll_robot_vacuum', 'fll_camera_quest',
    'fll_chatbot_builder', 'fll_emoji_decoder', 'fll_code_blocks',
    'fll_my_first_ai_app', 'fll_future_forge', 'fll_ai_or_not'
  ));
