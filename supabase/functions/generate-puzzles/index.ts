import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Word dictionaries will be loaded from storage or hardcoded
const QUALITY_GATES = {
  4: { minDistance: 4, maxDistance: 7, minPathCount: 5 },
  5: { minDistance: 5, maxDistance: 8, minPathCount: 3 },
};

// Check if two words differ by exactly one letter
function isOneLetterDifferent(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) return false;
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
    if (differences > 1) return false;
  }
  return differences === 1;
}

// BFS to find shortest path and count paths
function findShortestPath(
  start: string,
  goal: string,
  validWords: Set<string>
): { distance: number; pathCount: number; solvable: boolean } {
  if (start === goal) return { distance: 0, pathCount: 1, solvable: true };
  if (!validWords.has(start) || !validWords.has(goal)) {
    return { distance: -1, pathCount: 0, solvable: false };
  }

  const queue: { word: string; distance: number }[] = [{ word: start, distance: 0 }];
  const visited = new Set<string>([start]);
  const distanceMap = new Map<string, number>();
  distanceMap.set(start, 0);

  let minDistance = -1;
  let pathCount = 0;

  while (queue.length > 0) {
    const { word, distance } = queue.shift()!;

    // If we've found the goal distance, don't explore further
    if (minDistance !== -1 && distance >= minDistance) continue;

    // Find all valid neighbors (one letter different)
    for (const candidate of validWords) {
      if (visited.has(candidate) && distanceMap.get(candidate)! < distance + 1) continue;
      
      if (isOneLetterDifferent(word, candidate)) {
        const newDistance = distance + 1;

        if (candidate === goal) {
          if (minDistance === -1 || newDistance === minDistance) {
            minDistance = newDistance;
            pathCount++;
          }
          continue;
        }

        if (minDistance === -1 || newDistance < minDistance) {
          if (!visited.has(candidate)) {
            visited.add(candidate);
            distanceMap.set(candidate, newDistance);
            queue.push({ word: candidate, distance: newDistance });
          }
        }
      }
    }
  }

  return {
    distance: minDistance,
    pathCount,
    solvable: minDistance !== -1,
  };
}

// Calculate quality score (1-10) based on puzzle properties
function calculateQualityScore(distance: number, pathCount: number, wordLength: number): number {
  const gates = QUALITY_GATES[wordLength as 4 | 5];
  if (!gates) return 5;

  let score = 5;

  // Distance in sweet spot (middle of range) = higher score
  const midDistance = (gates.minDistance + gates.maxDistance) / 2;
  const distanceFromMid = Math.abs(distance - midDistance);
  score += Math.max(0, 2 - distanceFromMid);

  // More paths = higher score (more flexible puzzle)
  if (pathCount >= 10) score += 2;
  else if (pathCount >= 5) score += 1;

  return Math.min(10, Math.max(1, Math.round(score)));
}

// Load dictionary from Supabase storage or use embedded list
async function loadDictionary(supabase: any, wordLength: number): Promise<Set<string>> {
  try {
    // Try to load from admin_dictionary table first
    const { data, error } = await supabase
      .from('admin_dictionary')
      .select('word')
      .eq('word_length', wordLength)
      .eq('is_banned', false);

    if (!error && data && data.length > 100) {
      console.log(`Loaded ${data.length} words from admin_dictionary for ${wordLength}L`);
      return new Set(data.map((row: { word: string }) => row.word.toLowerCase()));
    }
  } catch (e) {
    console.log('Failed to load from admin_dictionary, using embedded list');
  }

  // Fallback: Use a curated list of common words
  // These are common 4-letter and 5-letter words that form good puzzle chains
  const COMMON_4L_WORDS = [
    'able', 'ache', 'acid', 'aged', 'aide', 'area', 'army', 'aunt', 'baby', 'back',
    'bake', 'bald', 'ball', 'band', 'bank', 'bare', 'bark', 'barn', 'base', 'bath',
    'bead', 'beak', 'beam', 'bean', 'bear', 'beat', 'beck', 'been', 'beer', 'bell',
    'belt', 'bend', 'bent', 'best', 'bike', 'bile', 'bill', 'bind', 'bird', 'bite',
    'blow', 'blue', 'blur', 'boat', 'body', 'boil', 'bold', 'bolt', 'bond', 'bone',
    'book', 'boom', 'boot', 'bore', 'born', 'boss', 'both', 'bowl', 'bulk', 'bull',
    'bump', 'burn', 'bush', 'busy', 'cake', 'calf', 'call', 'calm', 'came', 'camp',
    'cane', 'cape', 'card', 'care', 'carl', 'cart', 'case', 'cash', 'cast', 'cave',
    'cell', 'chat', 'chin', 'chip', 'chop', 'cite', 'city', 'clad', 'clam', 'clan',
    'clap', 'claw', 'clay', 'clip', 'club', 'clue', 'coal', 'coat', 'code', 'coil',
    'coin', 'cold', 'cole', 'come', 'cone', 'cook', 'cool', 'cope', 'copy', 'cord',
    'core', 'cork', 'corn', 'cost', 'cove', 'crab', 'crew', 'crop', 'crow', 'cube',
    'cult', 'cure', 'curl', 'cute', 'dale', 'dame', 'damp', 'dane', 'dare', 'dark',
    'dart', 'dash', 'data', 'date', 'dawn', 'dead', 'deaf', 'deal', 'dean', 'dear',
    'debt', 'deck', 'deed', 'deem', 'deep', 'deer', 'demo', 'dent', 'desk', 'dial',
    'diet', 'dime', 'dine', 'dirt', 'disc', 'dish', 'disk', 'dock', 'doll', 'dome',
    'done', 'doom', 'door', 'dose', 'down', 'drag', 'draw', 'drew', 'drip', 'drop',
    'drum', 'dual', 'duck', 'dude', 'duel', 'duke', 'dull', 'dumb', 'dump', 'dune',
    'dusk', 'dust', 'duty', 'each', 'earl', 'earn', 'ease', 'east', 'easy', 'echo',
    'edge', 'edit', 'else', 'emit', 'epic', 'euro', 'even', 'evil', 'exam', 'exec',
    'exit', 'face', 'fact', 'fade', 'fail', 'fair', 'fake', 'fall', 'fame', 'fang',
    'fare', 'farm', 'fast', 'fate', 'fear', 'feat', 'feed', 'feel', 'feet', 'fell',
    'felt', 'fern', 'file', 'fill', 'film', 'find', 'fine', 'fire', 'firm', 'fish',
    'fist', 'five', 'flag', 'flap', 'flat', 'flaw', 'fled', 'flee', 'flew', 'flip',
    'flow', 'foam', 'foil', 'fold', 'folk', 'fond', 'font', 'food', 'fool', 'foot',
    'ford', 'fore', 'fork', 'form', 'fort', 'foul', 'four', 'fowl', 'free', 'frog',
    'from', 'fuel', 'full', 'fume', 'fund', 'funk', 'fury', 'fuse', 'fuss', 'gain',
    'gale', 'game', 'gang', 'gate', 'gave', 'gaze', 'gear', 'gene', 'germ', 'gift',
    'girl', 'give', 'glad', 'glow', 'glue', 'goal', 'goat', 'goes', 'gold', 'golf',
    'gone', 'good', 'gore', 'gown', 'grab', 'gram', 'gray', 'grew', 'grid', 'grim',
    'grin', 'grip', 'grow', 'gulf', 'guru', 'gust', 'hair', 'hail', 'half', 'hall',
    'halt', 'hand', 'hang', 'hard', 'hare', 'harm', 'hate', 'haul', 'have', 'hawk',
    'head', 'heal', 'heap', 'hear', 'heat', 'heel', 'held', 'hell', 'helm', 'help',
    'herb', 'herd', 'here', 'hero', 'hide', 'high', 'hike', 'hill', 'hint', 'hire',
    'hold', 'hole', 'holy', 'home', 'hood', 'hook', 'hope', 'horn', 'hose', 'host',
    'hour', 'huge', 'hull', 'hung', 'hunt', 'hurt', 'hush', 'hymn', 'icon', 'idea',
    'idle', 'inch', 'info', 'into', 'iron', 'isle', 'item', 'jack', 'jade', 'jail',
    'jane', 'jean', 'jerk', 'jest', 'join', 'joke', 'jolt', 'jump', 'june', 'junk',
    'jury', 'just', 'keen', 'keep', 'kept', 'kick', 'kill', 'kind', 'king', 'kiss',
    'kite', 'knee', 'knew', 'knit', 'knob', 'knot', 'know', 'lack', 'lace', 'lady',
    'laid', 'lake', 'lamb', 'lame', 'lamp', 'land', 'lane', 'lard', 'last', 'late',
    'lawn', 'lead', 'leaf', 'leak', 'lean', 'leap', 'left', 'lend', 'lens', 'less',
    'liar', 'lick', 'life', 'lift', 'like', 'limb', 'lime', 'limp', 'line', 'link',
    'lion', 'list', 'live', 'load', 'loaf', 'loan', 'lock', 'loft', 'logo', 'lone',
    'long', 'look', 'loop', 'lord', 'lore', 'lose', 'loss', 'lost', 'lots', 'loud',
    'love', 'luck', 'lump', 'lung', 'lure', 'lush', 'made', 'mail', 'main', 'make',
    'male', 'mall', 'malt', 'many', 'mare', 'mark', 'mart', 'mask', 'mass', 'mast',
    'mate', 'math', 'maze', 'meal', 'mean', 'meat', 'meet', 'melt', 'memo', 'menu',
    'mere', 'mesh', 'mess', 'mile', 'milk', 'mill', 'mime', 'mind', 'mine', 'mint',
    'miss', 'mist', 'mode', 'mold', 'mole', 'molt', 'monk', 'mood', 'moon', 'moor',
    'more', 'morn', 'moss', 'most', 'moth', 'move', 'much', 'mule', 'muse', 'must',
    'mute', 'myth', 'nail', 'name', 'navy', 'near', 'neat', 'neck', 'need', 'nest',
    'news', 'next', 'nice', 'nick', 'nine', 'node', 'none', 'noon', 'norm', 'nose',
    'note', 'noun', 'nude', 'null', 'oath', 'obey', 'odds', 'okay', 'once', 'only',
    'onto', 'open', 'oral', 'oven', 'over', 'pace', 'pack', 'pact', 'page', 'paid',
    'pail', 'pain', 'pair', 'pale', 'palm', 'pane', 'pant', 'park', 'part', 'pass',
    'past', 'path', 'peak', 'pear', 'peck', 'peek', 'peel', 'peer', 'pelt', 'perk',
    'pest', 'pick', 'pier', 'pike', 'pile', 'pill', 'pine', 'pink', 'pint', 'pipe',
    'pity', 'plan', 'play', 'plea', 'plot', 'plow', 'ploy', 'plug', 'plum', 'plus',
    'poem', 'poet', 'poke', 'pole', 'poll', 'polo', 'pond', 'pony', 'pool', 'poor',
    'pope', 'pork', 'port', 'pose', 'post', 'pour', 'pray', 'prep', 'prey', 'prop',
    'pull', 'pulp', 'pump', 'pure', 'push', 'quit', 'quiz', 'race', 'rack', 'raft',
    'rage', 'raid', 'rail', 'rain', 'rake', 'ramp', 'rang', 'rank', 'rare', 'rash',
    'rate', 'rave', 'read', 'real', 'ream', 'reap', 'rear', 'reed', 'reef', 'reel',
    'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'rift', 'ring', 'riot', 'ripe',
    'rise', 'risk', 'road', 'roam', 'roar', 'robe', 'rock', 'rode', 'role', 'roll',
    'roof', 'room', 'root', 'rope', 'rose', 'rude', 'ruin', 'rule', 'rung', 'rush',
    'rust', 'sack', 'safe', 'sage', 'said', 'sail', 'sake', 'sale', 'salt', 'same',
    'sand', 'sane', 'sang', 'sank', 'save', 'seal', 'seam', 'seat', 'sect', 'seed',
    'seek', 'seem', 'seen', 'self', 'sell', 'send', 'sent', 'shed', 'ship', 'shop',
    'shot', 'show', 'shut', 'sick', 'side', 'sigh', 'sign', 'silk', 'sink', 'site',
    'size', 'skin', 'skip', 'slab', 'slam', 'slap', 'slat', 'sled', 'slew', 'slid',
    'slim', 'slip', 'slit', 'slot', 'slow', 'snap', 'snow', 'soak', 'soap', 'soar',
    'sock', 'soft', 'soil', 'sold', 'sole', 'solo', 'some', 'song', 'soon', 'sore',
    'sort', 'soul', 'soup', 'sour', 'span', 'spar', 'spec', 'spin', 'spit', 'spot',
    'spur', 'stab', 'star', 'stay', 'stem', 'step', 'stew', 'stir', 'stop', 'stub',
    'stud', 'suck', 'suit', 'sung', 'sunk', 'sure', 'surf', 'swap', 'swim', 'tail',
    'take', 'tale', 'talk', 'tall', 'tame', 'tank', 'tape', 'task', 'team', 'tear',
    'teen', 'tell', 'temp', 'tend', 'tent', 'term', 'test', 'text', 'than', 'that',
    'them', 'then', 'they', 'thin', 'this', 'tick', 'tide', 'tile', 'tilt', 'time',
    'tint', 'tiny', 'tire', 'toad', 'toll', 'tomb', 'tone', 'took', 'tool', 'tops',
    'tore', 'torn', 'tort', 'toss', 'tour', 'town', 'trap', 'tray', 'tree', 'trek',
    'trim', 'trio', 'trip', 'trod', 'trot', 'true', 'tube', 'tuck', 'tuna', 'tune',
    'turn', 'twin', 'type', 'ugly', 'undo', 'unit', 'unto', 'upon', 'urge', 'used',
    'user', 'vain', 'vale', 'vane', 'vary', 'vase', 'vast', 'veil', 'vein', 'vent',
    'verb', 'very', 'vest', 'veto', 'vice', 'view', 'vine', 'visa', 'void', 'volt',
    'vote', 'wade', 'wage', 'wait', 'wake', 'walk', 'wall', 'wand', 'want', 'ward',
    'warm', 'warn', 'warp', 'wart', 'wash', 'wasp', 'wave', 'wavy', 'weak', 'wear',
    'weed', 'week', 'weep', 'well', 'went', 'were', 'west', 'what', 'when', 'whip',
    'wide', 'wife', 'wild', 'will', 'wilt', 'wind', 'wine', 'wing', 'wink', 'wipe',
    'wire', 'wise', 'wish', 'with', 'woke', 'wolf', 'womb', 'wood', 'wool', 'word',
    'wore', 'work', 'worm', 'worn', 'wrap', 'yard', 'yarn', 'year', 'yell', 'yoga',
    'yolk', 'your', 'zeal', 'zero', 'zone', 'zoom',
  ];

  const COMMON_5L_WORDS = [
    'about', 'above', 'abuse', 'actor', 'adapt', 'admit', 'adopt', 'adult', 'after', 'again',
    'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alike', 'alive', 'allow', 'alone',
    'along', 'alter', 'among', 'anger', 'angle', 'angry', 'apart', 'apple', 'apply', 'arena',
    'argue', 'arise', 'armor', 'array', 'arrow', 'aside', 'asset', 'avoid', 'award', 'aware',
    'awful', 'badge', 'baker', 'balls', 'basic', 'basis', 'batch', 'beach', 'beard', 'beast',
    'began', 'begin', 'being', 'belly', 'below', 'bench', 'berry', 'birth', 'black', 'blade',
    'blame', 'bland', 'blank', 'blast', 'blaze', 'bleak', 'blend', 'bless', 'blind', 'blink',
    'bliss', 'block', 'blond', 'blood', 'bloom', 'blown', 'blues', 'bluff', 'blunt', 'blush',
    'board', 'boast', 'booth', 'bound', 'brain', 'brake', 'brand', 'brass', 'brave', 'bread',
    'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'broad', 'broke', 'broom', 'broth',
    'brown', 'brush', 'build', 'built', 'bunch', 'burst', 'buyer', 'cabin', 'cable', 'calif',
    'canal', 'candy', 'cargo', 'carol', 'carry', 'carve', 'catch', 'cause', 'cease', 'chain',
    'chair', 'chalk', 'champ', 'chaos', 'charm', 'chart', 'chase', 'cheap', 'cheat', 'check',
    'cheek', 'cheer', 'chess', 'chest', 'chief', 'child', 'chill', 'china', 'chirp', 'choir',
    'chord', 'chose', 'chunk', 'claim', 'clamp', 'clash', 'clasp', 'class', 'clean', 'clear',
    'clerk', 'click', 'cliff', 'climb', 'cling', 'clock', 'clone', 'close', 'cloth', 'cloud',
    'clown', 'coach', 'coast', 'colon', 'color', 'couch', 'cough', 'could', 'count', 'court',
    'cover', 'crack', 'craft', 'crash', 'crawl', 'craze', 'crazy', 'cream', 'creek', 'creep',
    'crest', 'crime', 'crisp', 'cross', 'crowd', 'crown', 'crude', 'cruel', 'crush', 'curve',
    'daily', 'dairy', 'dance', 'dealt', 'death', 'debut', 'decay', 'decor', 'delay', 'dense',
    'depot', 'depth', 'derby', 'dirty', 'disco', 'ditch', 'dozen', 'draft', 'drain', 'drama',
    'drank', 'drawn', 'dread', 'dream', 'dress', 'dried', 'drift', 'drill', 'drink', 'drive',
    'droit', 'drown', 'drunk', 'dying', 'eager', 'early', 'earth', 'eaten', 'eight', 'elder',
    'elect', 'elite', 'email', 'empty', 'endow', 'enemy', 'enjoy', 'enter', 'entry', 'equal',
    'equip', 'erase', 'error', 'essay', 'event', 'every', 'exact', 'exert', 'exile', 'exist',
    'extra', 'faint', 'fairy', 'faith', 'false', 'fancy', 'fatal', 'fault', 'favor', 'feast',
    'fence', 'ferry', 'fetch', 'fever', 'fiber', 'field', 'fifth', 'fifty', 'fight', 'final',
    'finer', 'first', 'flame', 'flank', 'flash', 'flask', 'fleet', 'flesh', 'flick', 'fling',
    'flint', 'float', 'flock', 'flood', 'floor', 'flora', 'flour', 'fluid', 'flush', 'focal',
    'focus', 'force', 'forge', 'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud',
    'freak', 'fresh', 'fried', 'front', 'frost', 'fruit', 'fully', 'funny', 'gauge', 'genre',
    'ghost', 'giant', 'given', 'glade', 'gland', 'glare', 'glass', 'gleam', 'glide', 'globe',
    'gloom', 'glory', 'gloss', 'glove', 'going', 'grace', 'grade', 'grain', 'grand', 'grant',
    'grape', 'graph', 'grasp', 'grass', 'grave', 'great', 'greed', 'greek', 'green', 'greet',
    'grief', 'grill', 'grind', 'gripe', 'groom', 'gross', 'group', 'grove', 'growl', 'grown',
    'guard', 'guess', 'guest', 'guide', 'guild', 'guilt', 'guise', 'habit', 'handy', 'happy',
    'hardy', 'harsh', 'haste', 'hasty', 'hatch', 'haven', 'hazel', 'heart', 'heavy', 'hedge',
    'hello', 'hence', 'hinge', 'hobby', 'honor', 'horse', 'hotel', 'hound', 'house', 'hover',
    'human', 'humid', 'humor', 'hurry', 'ideal', 'image', 'imply', 'index', 'inner', 'input',
    'irony', 'issue', 'ivory', 'japan', 'jewel', 'joint', 'joker', 'jolly', 'juice', 'juicy',
    'jumbo', 'jumpy', 'judge', 'juice', 'knack', 'knead', 'knife', 'knock', 'known', 'label',
    'labor', 'lance', 'large', 'laser', 'latch', 'later', 'laugh', 'layer', 'learn', 'lease',
    'least', 'leave', 'ledge', 'legal', 'lemon', 'level', 'lever', 'light', 'liked', 'limit',
    'linen', 'liner', 'lingo', 'links', 'liver', 'llama', 'local', 'lodge', 'lofty', 'logic',
    'loose', 'lorry', 'loser', 'lousy', 'lover', 'lower', 'loyal', 'lucky', 'lunar', 'lunch',
    'lyric', 'macro', 'magic', 'major', 'maker', 'manor', 'maple', 'march', 'marry', 'marsh',
    'match', 'mayor', 'means', 'medal', 'media', 'melon', 'mercy', 'merge', 'merit', 'merry',
    'messy', 'metal', 'meter', 'midst', 'might', 'mince', 'miner', 'minor', 'minus', 'mirth',
    'misty', 'mixed', 'model', 'modem', 'moist', 'money', 'month', 'moral', 'motor', 'motto',
    'mould', 'mount', 'mouse', 'mouth', 'movie', 'muddy', 'multi', 'mummy', 'mural', 'music',
    'musty', 'naive', 'naked', 'nasty', 'naval', 'nerve', 'never', 'newer', 'newly', 'night',
    'ninth', 'noble', 'noise', 'noisy', 'north', 'notch', 'noted', 'novel', 'nurse', 'nylon',
    'oasis', 'occur', 'ocean', 'offer', 'often', 'olive', 'onion', 'onset', 'opera', 'opted',
    'orbit', 'order', 'organ', 'other', 'ought', 'ounce', 'outer', 'outgo', 'owing', 'owner',
    'oxide', 'ozone', 'paint', 'panel', 'panic', 'paper', 'party', 'paste', 'patch', 'pause',
    'peace', 'peach', 'pearl', 'penny', 'perch', 'peril', 'petal', 'petty', 'phase', 'phone',
    'photo', 'piano', 'piece', 'pilot', 'pinch', 'pitch', 'pivot', 'pixel', 'place', 'plain',
    'plane', 'plant', 'plate', 'plaza', 'plead', 'pleat', 'pledge', 'plier', 'pluck', 'plumb',
    'plume', 'plump', 'plunge', 'plus', 'poach', 'point', 'poise', 'polar', 'porch', 'poser',
    'posit', 'pound', 'power', 'prank', 'press', 'price', 'pride', 'prime', 'print', 'prior',
    'prize', 'probe', 'prone', 'proof', 'proud', 'prove', 'proxy', 'prune', 'pulse', 'punch',
    'pupil', 'purse', 'quake', 'queen', 'query', 'quest', 'quick', 'quiet', 'quilt', 'quirk',
    'quite', 'quota', 'quote', 'radar', 'radio', 'rainy', 'raise', 'rally', 'ranch', 'range',
    'rapid', 'ratio', 'reach', 'react', 'ready', 'realm', 'rebel', 'refer', 'reign', 'relax',
    'relay', 'remit', 'repay', 'reply', 'reset', 'resin', 'retro', 'rider', 'ridge', 'rifle',
    'right', 'rigid', 'rigor', 'rinse', 'ripen', 'risen', 'risky', 'rival', 'river', 'roast',
    'robot', 'rocky', 'roman', 'roomy', 'rough', 'round', 'route', 'royal', 'rugby', 'ruler',
    'rumor', 'rural', 'rusty', 'sadly', 'saint', 'salad', 'sales', 'salon', 'sandy', 'sauce',
    'scale', 'scare', 'scarf', 'scary', 'scene', 'scent', 'scope', 'score', 'scout', 'scrap',
    'scrub', 'seize', 'sense', 'serve', 'setup', 'seven', 'shade', 'shaft', 'shake', 'shall',
    'shame', 'shape', 'share', 'shark', 'sharp', 'shave', 'sheep', 'sheer', 'sheet', 'shelf',
    'shell', 'shift', 'shine', 'shiny', 'shire', 'shirt', 'shock', 'shoot', 'shore', 'short',
    'shout', 'shown', 'shrug', 'siege', 'sight', 'sigma', 'silly', 'since', 'sixth', 'sixty',
    'sized', 'skate', 'skill', 'skull', 'slang', 'slate', 'slave', 'sleek', 'sleep', 'slice',
    'slide', 'slime', 'slope', 'small', 'smart', 'smash', 'smell', 'smile', 'smoke', 'snack',
    'snake', 'snare', 'sneak', 'solar', 'solid', 'solve', 'sonic', 'sorry', 'sound', 'south',
    'space', 'spare', 'spark', 'spawn', 'speak', 'spear', 'speed', 'spell', 'spend', 'spent',
    'spice', 'spicy', 'spike', 'spill', 'spine', 'spite', 'split', 'spoke', 'spoon', 'sport',
    'spray', 'squad', 'stack', 'staff', 'stage', 'stain', 'stake', 'stale', 'stall', 'stamp',
    'stand', 'stare', 'stark', 'start', 'state', 'stave', 'stead', 'steak', 'steal', 'steam',
    'steel', 'steep', 'steer', 'stern', 'stick', 'stiff', 'still', 'sting', 'stint', 'stock',
    'stomp', 'stone', 'stool', 'stoop', 'store', 'storm', 'story', 'stout', 'stove', 'strap',
    'straw', 'stray', 'strip', 'stuck', 'study', 'stuff', 'stump', 'stung', 'stunk', 'style',
    'sugar', 'suite', 'sunny', 'super', 'surge', 'swamp', 'swarm', 'swear', 'sweat', 'sweep',
    'sweet', 'swept', 'swift', 'swing', 'swirl', 'sword', 'swore', 'sworn', 'swung', 'table',
    'taken', 'taste', 'tasty', 'teach', 'teeth', 'tempo', 'tense', 'tenth', 'terms', 'thank',
    'theft', 'their', 'theme', 'there', 'these', 'thick', 'thief', 'thigh', 'thing', 'think',
    'third', 'thorn', 'those', 'three', 'threw', 'throw', 'thumb', 'tiger', 'tight', 'timer',
    'tired', 'title', 'toast', 'today', 'token', 'tooth', 'topic', 'torch', 'total', 'touch',
    'tough', 'tower', 'toxic', 'trace', 'track', 'trade', 'trail', 'train', 'trait', 'tramp',
    'trash', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried', 'trier', 'troop', 'trout',
    'truck', 'truly', 'trump', 'trunk', 'trust', 'truth', 'tulip', 'tumor', 'tuner', 'tunic',
    'turbo', 'tutor', 'tweak', 'twice', 'twist', 'tying', 'ultra', 'uncle', 'under', 'undue',
    'unfed', 'unfit', 'union', 'unite', 'unity', 'until', 'upper', 'upset', 'urban', 'usage',
    'usual', 'utter', 'vague', 'valid', 'value', 'valve', 'vapor', 'vault', 'vegan', 'venue',
    'verge', 'verse', 'video', 'vigor', 'vinyl', 'viola', 'viper', 'viral', 'virus', 'visit',
    'visor', 'vista', 'vital', 'vivid', 'vocal', 'vogue', 'voice', 'voter', 'vouch', 'vowel',
    'wagon', 'waist', 'waltz', 'waste', 'watch', 'water', 'waver', 'weary', 'weave', 'wedge',
    'weigh', 'weird', 'whale', 'wheat', 'wheel', 'where', 'which', 'while', 'whine', 'white',
    'whole', 'whose', 'widen', 'wider', 'widow', 'width', 'wield', 'wiper', 'witch', 'woman',
    'woods', 'woozy', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'woven',
    'wrack', 'wrath', 'wreck', 'wring', 'wrist', 'write', 'wrong', 'wrote', 'yacht', 'yearn',
    'yeast', 'yield', 'young', 'yours', 'youth', 'zebra', 'zippy', 'zonal',
  ];

  const words = wordLength === 4 ? COMMON_4L_WORDS : COMMON_5L_WORDS;
  console.log(`Using embedded ${words.length} words for ${wordLength}L`);
  return new Set(words);
}

// Generate a batch of puzzles
async function generatePuzzles(
  supabase: any,
  wordLength: 4 | 5,
  count: number,
  batchId: string
): Promise<{ generated: number; failed: number; puzzles: any[] }> {
  const dictionary = await loadDictionary(supabase, wordLength);
  const wordArray = Array.from(dictionary);
  const gates = QUALITY_GATES[wordLength];
  
  // Get existing puzzles to avoid duplicates
  const { data: existingPuzzles } = await supabase
    .from('admin_puzzle_vault')
    .select('start_word, goal_word')
    .eq('word_length', wordLength);

  const existingPairs = new Set(
    (existingPuzzles || []).map((p: any) => `${p.start_word}-${p.goal_word}`)
  );

  const puzzles: any[] = [];
  let attempts = 0;
  const maxAttempts = count * 50; // Allow 50 attempts per puzzle needed

  while (puzzles.length < count && attempts < maxAttempts) {
    attempts++;

    // Pick random start and goal words
    const startWord = wordArray[Math.floor(Math.random() * wordArray.length)];
    const goalWord = wordArray[Math.floor(Math.random() * wordArray.length)];

    // Skip if same word or already exists
    if (startWord === goalWord) continue;
    const pairKey = `${startWord}-${goalWord}`;
    if (existingPairs.has(pairKey)) continue;

    // Check solvability
    const result = findShortestPath(startWord, goalWord, dictionary);
    
    if (!result.solvable) continue;
    if (result.distance < gates.minDistance || result.distance > gates.maxDistance) continue;
    if (result.pathCount < gates.minPathCount) continue;

    // Calculate quality score
    const qualityScore = calculateQualityScore(result.distance, result.pathCount, wordLength);

    // Get next puzzle index
    const { data: maxIndexData } = await supabase
      .from('admin_puzzle_vault')
      .select('puzzle_index')
      .eq('word_length', wordLength)
      .order('puzzle_index', { ascending: false })
      .limit(1);

    const nextIndex = (maxIndexData?.[0]?.puzzle_index || 0) + 1 + puzzles.length;

    puzzles.push({
      word_length: wordLength,
      start_word: startWord,
      goal_word: goalWord,
      min_distance: result.distance,
      puzzle_index: nextIndex,
      is_active: true,
      generation_batch: batchId,
      quality_score: qualityScore,
      generated_at: new Date().toISOString(),
    });

    existingPairs.add(pairKey);
  }

  return {
    generated: puzzles.length,
    failed: count - puzzles.length,
    puzzles,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const wordLength = (body.wordLength || 4) as 4 | 5;
    const count = Math.min(body.count || 30, 100); // Max 100 puzzles per call
    const batchId = body.batchId || `auto-${new Date().toISOString().split('T')[0]}`;

    console.log(`Generating ${count} puzzles for ${wordLength}L words, batch: ${batchId}`);

    // Generate puzzles
    const result = await generatePuzzles(supabase, wordLength, count, batchId);

    // Insert generated puzzles
    if (result.puzzles.length > 0) {
      const { error: insertError } = await supabase
        .from('admin_puzzle_vault')
        .insert(result.puzzles);

      if (insertError) {
        console.error('Failed to insert puzzles:', insertError);
        throw new Error(`Failed to insert puzzles: ${insertError.message}`);
      }
    }

    // Get updated vault stats
    const { data: stats } = await supabase
      .from('admin_puzzle_vault')
      .select('word_length, puzzle_index')
      .eq('is_active', true);

    const vaultStats = {
      '4L': stats?.filter((p: any) => p.word_length === 4).length || 0,
      '5L': stats?.filter((p: any) => p.word_length === 5).length || 0,
    };

    console.log(`Generated ${result.generated} puzzles, ${result.failed} failed. Vault: 4L=${vaultStats['4L']}, 5L=${vaultStats['5L']}`);

    return new Response(
      JSON.stringify({
        success: true,
        generated: result.generated,
        failed: result.failed,
        batchId,
        wordLength,
        vaultStats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating puzzles:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
