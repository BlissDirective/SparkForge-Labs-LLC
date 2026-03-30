-- ════════════════════════════════════════════════════
-- SPARKFORGE BADGE DEFINITIONS (68 badges)
-- Run after 001_schema.sql
-- ════════════════════════════════════════════════════

-- PROGRESS BADGES (7)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
('First Steps', 'Earn your first 100 XP', '⭐', 'progress', 'reach_xp', 100, 'common'),
('Getting Warmed Up', 'Earn 500 XP', '🌟', 'progress', 'reach_xp', 500, 'common'),
('On a Roll', 'Earn 1,000 XP', '🔥', 'progress', 'reach_xp', 1000, 'uncommon'),
('XP Machine', 'Earn 2,500 XP', '⚡', 'progress', 'reach_xp', 2500, 'uncommon'),
('Knowledge Engine', 'Earn 5,000 XP', '🏆', 'progress', 'reach_xp', 5000, 'rare'),
('XP Titan', 'Earn 10,000 XP', '💎', 'progress', 'reach_xp', 10000, 'epic'),
('Forge Legend', 'Earn 15,000 XP', '👑', 'progress', 'reach_xp', 15000, 'legendary');

-- STREAK BADGES (7)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
('3-Day Spark', 'Maintain a 3-day streak', '🔥', 'streak', 'maintain_streak', 3, 'common'),
('Week Warrior', 'Maintain a 7-day streak', '📅', 'streak', 'maintain_streak', 7, 'common'),
('Fortnight Focus', 'Maintain a 14-day streak', '💪', 'streak', 'maintain_streak', 14, 'uncommon'),
('Monthly Master', 'Maintain a 30-day streak', '🗓️', 'streak', 'maintain_streak', 30, 'rare'),
('Sixty Strong', 'Maintain a 60-day streak', '🏋️', 'streak', 'maintain_streak', 60, 'rare'),
('Century Club', 'Maintain a 100-day streak', '💯', 'streak', 'maintain_streak', 100, 'epic'),
('Year of AI', 'Maintain a 365-day streak', '🎆', 'streak', 'maintain_streak', 365, 'legendary');

-- LAB MASTER BADGES (10)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, criteria_world, rarity) VALUES
('Lab 1 Master', 'Complete all content in Lab 1: What IS AI?', '🏅', 'world', 'complete_world', 1, 1, 'uncommon'),
('Lab 2 Master', 'Complete all content in Lab 2: Teaching Machines', '🏅', 'world', 'complete_world', 1, 2, 'uncommon'),
('Lab 3 Master', 'Complete all content in Lab 3: The Brain Inside', '🏅', 'world', 'complete_world', 1, 3, 'uncommon'),
('Lab 4 Master', 'Complete all content in Lab 4: AI That Creates', '🏅', 'world', 'complete_world', 1, 4, 'uncommon'),
('Lab 5 Master', 'Complete all content in Lab 5: AI Helpers', '🏅', 'world', 'complete_world', 1, 5, 'uncommon'),
('Lab 6 Master', 'Complete all content in Lab 6: AI & Ethics', '🏅', 'world', 'complete_world', 1, 6, 'uncommon'),
('Lab 7 Master', 'Complete all content in Lab 7: Computer Vision', '🏅', 'world', 'complete_world', 1, 7, 'uncommon'),
('Lab 8 Master', 'Complete all content in Lab 8: Words & Language', '🏅', 'world', 'complete_world', 1, 8, 'uncommon'),
('Lab 9 Master', 'Complete all content in Lab 9: Build with AI', '🏅', 'world', 'complete_world', 1, 9, 'uncommon'),
('Lab 10 Master', 'Complete all content in Lab 10: AI''s Future', '🏅', 'world', 'complete_world', 1, 10, 'uncommon');

-- GAME MASTER BADGES (10)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, criteria_world, rarity) VALUES
('Lab 1 Game Master', 'Complete every game in Lab 1', '🎮', 'game_master', 'world_games_complete', 1, 1, 'uncommon'),
('Lab 2 Game Master', 'Complete every game in Lab 2', '🎮', 'game_master', 'world_games_complete', 1, 2, 'uncommon'),
('Lab 3 Game Master', 'Complete every game in Lab 3', '🎮', 'game_master', 'world_games_complete', 1, 3, 'uncommon'),
('Lab 4 Game Master', 'Complete every game in Lab 4', '🎮', 'game_master', 'world_games_complete', 1, 4, 'uncommon'),
('Lab 5 Game Master', 'Complete every game in Lab 5', '🎮', 'game_master', 'world_games_complete', 1, 5, 'uncommon'),
('Lab 6 Game Master', 'Complete every game in Lab 6', '🎮', 'game_master', 'world_games_complete', 1, 6, 'uncommon'),
('Lab 7 Game Master', 'Complete every game in Lab 7', '🎮', 'game_master', 'world_games_complete', 1, 7, 'uncommon'),
('Lab 8 Game Master', 'Complete every game in Lab 8', '🎮', 'game_master', 'world_games_complete', 1, 8, 'uncommon'),
('Lab 9 Game Master', 'Complete every game in Lab 9', '🎮', 'game_master', 'world_games_complete', 1, 9, 'uncommon'),
('Lab 10 Game Master', 'Complete every game in Lab 10', '🎮', 'game_master', 'world_games_complete', 1, 10, 'uncommon');

-- KNOWLEDGE BADGES (10)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, criteria_world, rarity) VALUES
('Lab 1 Quiz Ace', 'Pass all Lab 1 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 1, 'uncommon'),
('Lab 2 Quiz Ace', 'Pass all Lab 2 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 2, 'uncommon'),
('Lab 3 Quiz Ace', 'Pass all Lab 3 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 3, 'uncommon'),
('Lab 4 Quiz Ace', 'Pass all Lab 4 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 4, 'uncommon'),
('Lab 5 Quiz Ace', 'Pass all Lab 5 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 5, 'uncommon'),
('Lab 6 Quiz Ace', 'Pass all Lab 6 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 6, 'uncommon'),
('Lab 7 Quiz Ace', 'Pass all Lab 7 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 7, 'uncommon'),
('Lab 8 Quiz Ace', 'Pass all Lab 8 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 8, 'uncommon'),
('Lab 9 Quiz Ace', 'Pass all Lab 9 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 9, 'uncommon'),
('Lab 10 Quiz Ace', 'Pass all Lab 10 quizzes with 90%+', '🧠', 'knowledge', 'world_quizzes_90', 1, 10, 'uncommon');

-- EXPLORER BADGES (5)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
('5 Labs Visited', 'Visit 5 different labs', '🗺️', 'explorer', 'worlds_visited', 5, 'uncommon'),
('All Labs Visited', 'Visit all 10 labs', '🌍', 'explorer', 'worlds_visited', 10, 'rare'),
('Multi-Gamer', 'Play 10 different games', '🕹️', 'explorer', 'unique_games_played', 10, 'uncommon'),
('Game Collector', 'Play 20 different games', '🎯', 'explorer', 'unique_games_played', 20, 'rare'),
('Complete Collection', 'Play all 35 games', '🏆', 'explorer', 'unique_games_played', 35, 'epic');

-- CREATOR BADGES (5)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
('First Prompt', 'Use the Prompt Lab for the first time', '✨', 'creator', 'prompts_used', 1, 'common'),
('Prompt Explorer', 'Use the Prompt Lab 10 times', '🔬', 'creator', 'prompts_used', 10, 'uncommon'),
('Prompt Master', 'Use the Prompt Lab 50 times', '🧙', 'creator', 'prompts_used', 50, 'rare'),
('Sandbox Builder', 'Complete 5 sandbox activities', '🏗️', 'creator', 'sandboxes_completed', 5, 'uncommon'),
('Creative Genius', 'Complete 15 sandbox activities', '🎨', 'creator', 'sandboxes_completed', 15, 'rare');

-- SECRET BADGES (8)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
('Early Bird', 'Complete an activity before 7 AM', '🌅', 'secret', 'special', 1, 'uncommon'),
('Night Owl', 'Complete an activity after 9 PM', '🦉', 'secret', 'special', 1, 'uncommon'),
('Speed Demon', 'Complete a quiz in under 60 seconds', '⚡', 'secret', 'special', 1, 'rare'),
('Perfect Score', 'Get 100% on any quiz', '💯', 'secret', 'special', 1, 'uncommon'),
('Comeback Kid', 'Recover a streak with a shield', '🛡️', 'secret', 'special', 1, 'rare'),
('Curious Mind', 'Read 20 Spark Facts', '🔍', 'secret', 'spark_facts_read', 20, 'uncommon'),
('First Login', 'Welcome to SparkForge!', '👋', 'secret', 'special', 1, 'common'),
('Bug Finder', 'Report a bug (parent-submitted)', '🐛', 'secret', 'special', 1, 'epic');

-- PRESTIGE BADGES (6)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
('Triple Threat', 'Master 3 labs', '🥉', 'prestige', 'worlds_mastered', 3, 'rare'),
('Halfway Hero', 'Master 5 labs', '🥈', 'prestige', 'worlds_mastered', 5, 'epic'),
('Almost There', 'Master 8 labs', '🥇', 'prestige', 'worlds_mastered', 8, 'epic'),
('AI Master', 'Master all 10 labs', '👑', 'prestige', 'worlds_mastered', 10, 'legendary'),
('Forge Champion', 'Reach level 50', '🏆', 'prestige', 'reach_level', 50, 'legendary'),
('Ultimate Scholar', 'Earn every other badge', '💫', 'prestige', 'total_badges', 67, 'legendary');
