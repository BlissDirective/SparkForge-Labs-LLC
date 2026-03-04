// ════════════════════════════════════════════════════
// AVATAR CONFIGURATION OPTIONS
// Face shapes, skin tones, hair styles, etc.
// Used by AvatarBuilder and AvatarDisplay components
// ════════════════════════════════════════════════════

export interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  faceShape: string;
  accessories: string[];
  outfit: string;
  background: string;
  pet?: string;
  ownedItems?: string[];
  equippedItems?: string[];
}

export const SKIN_TONES = [
  { id: 'tone-1', color: '#FDEBD0', label: 'Light' },
  { id: 'tone-2', color: '#FDBCB4', label: 'Light Warm' },
  { id: 'tone-3', color: '#E8B89D', label: 'Medium Light' },
  { id: 'tone-4', color: '#D4956B', label: 'Medium' },
  { id: 'tone-5', color: '#C68642', label: 'Medium Warm' },
  { id: 'tone-6', color: '#8D5524', label: 'Medium Dark' },
  { id: 'tone-7', color: '#6B3A20', label: 'Dark' },
  { id: 'tone-8', color: '#4A2511', label: 'Deep' },
];

export const FACE_SHAPES = [
  { id: 'round', label: 'Round', emoji: '\uD83D\uDE0A' },
  { id: 'oval', label: 'Oval', emoji: '\uD83D\uDE42' },
  { id: 'square', label: 'Square', emoji: '\uD83D\uDE10' },
  { id: 'heart', label: 'Heart', emoji: '\uD83D\uDC96' },
  { id: 'diamond', label: 'Diamond', emoji: '\uD83D\uDC8E' },
  { id: 'star', label: 'Star', emoji: '\u2B50' },
];

export const HAIR_STYLES = [
  { id: 'short', label: 'Short', emoji: '\uD83D\uDC87' },
  { id: 'medium', label: 'Medium', emoji: '\uD83D\uDC69' },
  { id: 'long', label: 'Long', emoji: '\uD83D\uDC69\u200D\uD83E\uDDB0' },
  { id: 'curly', label: 'Curly', emoji: '\uD83D\uDC69\u200D\uD83E\uDDB1' },
  { id: 'afro', label: 'Afro', emoji: '\uD83E\uDDD1\u200D\uD83E\uDDB1' },
  { id: 'braids', label: 'Braids', emoji: '\uD83D\uDC67' },
  { id: 'mohawk', label: 'Mohawk', emoji: '\uD83E\uDDD1\u200D\uD83C\uDFA4' },
  { id: 'ponytail', label: 'Ponytail', emoji: '\uD83D\uDC71\u200D\u2640\uFE0F' },
  { id: 'bun', label: 'Bun', emoji: '\uD83D\uDC69' },
  { id: 'spiky', label: 'Spiky', emoji: '\uD83E\uDD94' },
  { id: 'wavy', label: 'Wavy', emoji: '\uD83C\uDF0A' },
  { id: 'bald', label: 'None', emoji: '\uD83E\uDDD1\u200D\uD83E\uDDB2' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#1A1A2E', label: 'Black' },
  { id: 'brown', color: '#3B2F2F', label: 'Brown' },
  { id: 'blonde', color: '#E6C88C', label: 'Blonde' },
  { id: 'red', color: '#A0522D', label: 'Auburn' },
  { id: 'ginger', color: '#D4652F', label: 'Ginger' },
  { id: 'purple', color: '#8B5CF6', label: 'Purple' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
];

export const EYE_COLORS = [
  { id: 'brown', color: '#634E34', label: 'Brown' },
  { id: 'hazel', color: '#8E7618', label: 'Hazel' },
  { id: 'green', color: '#3D9970', label: 'Green' },
  { id: 'blue', color: '#4A90D9', label: 'Blue' },
  { id: 'gray', color: '#8E99A4', label: 'Gray' },
  { id: 'violet', color: '#8B5CF6', label: 'Violet' },
];

export const OUTFITS = [
  { id: 'astronaut', label: 'Astronaut', emoji: '\uD83E\uDDD1\u200D\uD83D\uDE80' },
  { id: 'scientist', label: 'Scientist', emoji: '\uD83E\uDDD1\u200D\uD83D\uDD2C' },
  { id: 'coder', label: 'Coder', emoji: '\uD83D\uDCBB' },
  { id: 'explorer', label: 'Explorer', emoji: '\uD83E\uDDED' },
  { id: 'artist', label: 'Artist', emoji: '\uD83C\uDFA8' },
  { id: 'robot', label: 'Robot Suit', emoji: '\uD83E\uDD16' },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: '#FDBCB4',
  hairStyle: 'short',
  hairColor: '#3B2F2F',
  eyeColor: '#634E34',
  faceShape: 'round',
  accessories: [],
  outfit: 'astronaut',
  background: 'stars',
  pet: undefined,
  ownedItems: [],
  equippedItems: [],
};
