/**
 * Curated Modern English Dictionary
 * 
 * Used for puzzle START/GOAL words (quality control).
 * Player moves are validated against the full TWL06 Scrabble dictionary,
 * but puzzle generation uses these curated common words.
 * 
 * All words in this file are validated against TWL06 at runtime.
 */

import { isValidScrabbleWord } from './scrabbleDictionary';

// 4-Letter Curated Words (~800 common words for puzzle generation)
const RAW_CURATED_4L_WORDS = [
  // A
  'ABLE', 'ACHE', 'ACID', 'AGED', 'AIDE', 'AREA', 'ARMY', 'AUNT',
  // B
  'BABY', 'BACK', 'BAIT', 'BAKE', 'BALD', 'BALL', 'BAND', 'BANK', 'BARE', 'BARK',
  'BARN', 'BASE', 'BATH', 'BEAD', 'BEAK', 'BEAM', 'BEAN', 'BEAR', 'BEAT', 'BECK',
  'BEEN', 'BEER', 'BELL', 'BELT', 'BEND', 'BENT', 'BEST', 'BIKE', 'BILE', 'BILL',
  'BIND', 'BIRD', 'BITE', 'BLOW', 'BLUE', 'BLUR', 'BOAT', 'BODY', 'BOIL', 'BOLD',
  'BOLT', 'BOND', 'BONE', 'BOOK', 'BOOM', 'BOOT', 'BORE', 'BORN', 'BOSS', 'BOTH',
  'BOWL', 'BULK', 'BULL', 'BUMP', 'BURN', 'BUSH', 'BUSY', 'BUZZ',
  // C
  'CAFE', 'CAGE', 'CAKE', 'CALF', 'CALL', 'CALM', 'CAME', 'CAMP', 'CANE', 'CAPE',
  'CARD', 'CARE', 'CART', 'CASE', 'CASH', 'CAST', 'CAVE', 'CELL', 'CHAT', 'CHEF',
  'CHIN', 'CHIP', 'CHOP', 'CITE', 'CITY', 'CLAD', 'CLAM', 'CLAN', 'CLAP', 'CLAW',
  'CLAY', 'CLIP', 'CLUB', 'CLUE', 'COAL', 'COAT', 'CODE', 'COIL', 'COIN', 'COLD',
  'COME', 'CONE', 'COOK', 'COOL', 'COPE', 'COPY', 'CORD', 'CORE', 'CORK', 'CORN',
  'COST', 'COVE', 'CRAB', 'CREW', 'CROP', 'CROW', 'CUBE', 'CULT', 'CURE', 'CURL',
  'CUTE',
  // D
  'DALE', 'DAME', 'DAMP', 'DARE', 'DARK', 'DART', 'DASH', 'DATA', 'DATE', 'DAWN',
  'DEAD', 'DEAF', 'DEAL', 'DEAN', 'DEAR', 'DEBT', 'DECK', 'DEED', 'DEEM', 'DEEP',
  'DEER', 'DEMO', 'DENT', 'DESK', 'DIAL', 'DICE', 'DIET', 'DIME', 'DINE', 'DIRT',
  'DISC', 'DISH', 'DISK', 'DIVE', 'DOCK', 'DOES', 'DOLL', 'DOME', 'DONE', 'DOOM',
  'DOOR', 'DOSE', 'DOWN', 'DRAG', 'DRAW', 'DREW', 'DRIP', 'DROP', 'DRUM', 'DUAL',
  'DUCK', 'DUDE', 'DUEL', 'DUKE', 'DULL', 'DUMB', 'DUMP', 'DUNE', 'DUSK', 'DUST',
  'DUTY',
  // E
  'EACH', 'EARL', 'EARN', 'EASE', 'EAST', 'EASY', 'ECHO', 'EDGE', 'EDIT', 'ELSE',
  'EMIT', 'ENVY', 'EPIC', 'EVEN', 'EVER', 'EVIL', 'EXAM', 'EXEC', 'EXIT', 'EYED',
  // F
  'FACE', 'FACT', 'FADE', 'FAIL', 'FAIR', 'FAKE', 'FALL', 'FAME', 'FANG', 'FARE',
  'FARM', 'FAST', 'FATE', 'FEAR', 'FEAT', 'FEED', 'FEEL', 'FEET', 'FELL', 'FELT',
  'FERN', 'FILE', 'FILL', 'FILM', 'FIND', 'FINE', 'FIRE', 'FIRM', 'FISH', 'FIST',
  'FIVE', 'FLAG', 'FLAP', 'FLAT', 'FLAW', 'FLED', 'FLEE', 'FLEW', 'FLIP', 'FLOW',
  'FOAM', 'FOIL', 'FOLD', 'FOLK', 'FOND', 'FONT', 'FOOD', 'FOOL', 'FOOT', 'FORK',
  'FORM', 'FORT', 'FOUL', 'FOUR', 'FOWL', 'FREE', 'FROG', 'FROM', 'FUEL', 'FULL',
  'FUME', 'FUND', 'FUNK', 'FURY', 'FUSE', 'FUSS',
  // G
  'GAIN', 'GALE', 'GAME', 'GANG', 'GATE', 'GAVE', 'GAZE', 'GEAR', 'GENE', 'GERM',
  'GIFT', 'GIRL', 'GIVE', 'GLAD', 'GLOW', 'GLUE', 'GOAL', 'GOAT', 'GOES', 'GOLD',
  'GOLF', 'GONE', 'GOOD', 'GORE', 'GOWN', 'GRAB', 'GRAM', 'GRAY', 'GREW', 'GRID',
  'GRIM', 'GRIN', 'GRIP', 'GROW', 'GULF', 'GURU', 'GUST',
  // H
  'HACK', 'HAIL', 'HAIR', 'HALF', 'HALL', 'HALT', 'HAND', 'HANG', 'HARD', 'HARE',
  'HARM', 'HASH', 'HATE', 'HAUL', 'HAVE', 'HAWK', 'HEAD', 'HEAL', 'HEAP', 'HEAR',
  'HEAT', 'HEEL', 'HELD', 'HELL', 'HELM', 'HELP', 'HEMP', 'HERB', 'HERD', 'HERE',
  'HERO', 'HIDE', 'HIGH', 'HIKE', 'HILL', 'HINT', 'HIRE', 'HOLD', 'HOLE', 'HOLY',
  'HOME', 'HOOD', 'HOOK', 'HOPE', 'HORN', 'HOSE', 'HOST', 'HOUR', 'HUGE', 'HULL',
  'HUNG', 'HUNT', 'HURT', 'HUSH',
  // I
  'ICON', 'IDEA', 'IDLE', 'INCH', 'INFO', 'INTO', 'IRON', 'ISLE', 'ITEM',
  // J
  'JACK', 'JADE', 'JAIL', 'JAMS', 'JARS', 'JAZZ', 'JEAN', 'JERK', 'JEST', 'JETS',
  'JOBS', 'JOIN', 'JOKE', 'JOLT', 'JUMP', 'JUNE', 'JUNK', 'JURY', 'JUST',
  // K
  'KALE', 'KEEN', 'KEEP', 'KEPT', 'KEYS', 'KICK', 'KIDS', 'KILL', 'KIND', 'KING',
  'KISS', 'KITE', 'KNEE', 'KNEW', 'KNIT', 'KNOB', 'KNOT', 'KNOW',
  // L
  'LACE', 'LACK', 'LACY', 'LADY', 'LAID', 'LAKE', 'LAMB', 'LAME', 'LAMP', 'LAND',
  'LANE', 'LARD', 'LAST', 'LATE', 'LAWN', 'LEAD', 'LEAF', 'LEAK', 'LEAN', 'LEAP',
  'LEFT', 'LEGS', 'LEND', 'LENS', 'LESS', 'LIAR', 'LICK', 'LIFE', 'LIFT', 'LIKE',
  'LIMB', 'LIME', 'LIMP', 'LINE', 'LINK', 'LION', 'LIPS', 'LIST', 'LIVE', 'LOAD',
  'LOAF', 'LOAN', 'LOCK', 'LOFT', 'LOGO', 'LONE', 'LONG', 'LOOK', 'LOOP', 'LORD',
  'LORE', 'LOSE', 'LOSS', 'LOST', 'LOTS', 'LOUD', 'LOVE', 'LUCK', 'LUMP', 'LUNG',
  'LURE', 'LUSH',
  // M
  'MADE', 'MAIL', 'MAIN', 'MAKE', 'MALE', 'MALL', 'MALT', 'MANY', 'MAPS', 'MARE',
  'MARK', 'MARS', 'MART', 'MASK', 'MASS', 'MAST', 'MATE', 'MATH', 'MAZE', 'MEAL',
  'MEAN', 'MEAT', 'MEET', 'MELT', 'MEMO', 'MENU', 'MERE', 'MESH', 'MESS', 'MICE',
  'MILD', 'MILE', 'MILK', 'MILL', 'MIME', 'MIND', 'MINE', 'MINT', 'MISS', 'MIST',
  'MODE', 'MOLD', 'MOLE', 'MOLT', 'MONK', 'MOOD', 'MOON', 'MOOR', 'MORE', 'MORN',
  'MOSS', 'MOST', 'MOTH', 'MOVE', 'MUCH', 'MUCK', 'MULE', 'MUSE', 'MUST', 'MUTE',
  'MYTH',
  // N
  'NAIL', 'NAME', 'NAPS', 'NAVY', 'NEAR', 'NEAT', 'NECK', 'NEED', 'NEST', 'NEWS',
  'NEXT', 'NICE', 'NICK', 'NINE', 'NODE', 'NONE', 'NOON', 'NORM', 'NOSE', 'NOTE',
  'NOUN', 'NULL', 'NUMB', 'NUTS',
  // O
  'OAKS', 'OATH', 'OBEY', 'ODDS', 'OKAY', 'ONCE', 'ONES', 'ONLY', 'ONTO', 'OPEN',
  'OPTS', 'ORAL', 'OVEN', 'OVER', 'OWED', 'OWES', 'OWLS', 'OWNS',
  // P
  'PACE', 'PACK', 'PACT', 'PAGE', 'PAID', 'PAIL', 'PAIN', 'PAIR', 'PALE', 'PALM',
  'PANE', 'PANT', 'PARK', 'PART', 'PASS', 'PAST', 'PATH', 'PEAK', 'PEAR', 'PECK',
  'PEEK', 'PEEL', 'PEER', 'PELT', 'PENS', 'PERK', 'PEST', 'PETS', 'PICK', 'PIER',
  'PIKE', 'PILE', 'PILL', 'PINE', 'PINK', 'PINT', 'PIPE', 'PITS', 'PITY', 'PLAN',
  'PLAY', 'PLEA', 'PLOT', 'PLOW', 'PLOY', 'PLUG', 'PLUM', 'PLUS', 'POEM', 'POET',
  'POKE', 'POLE', 'POLL', 'POLO', 'POND', 'PONY', 'POOL', 'POOR', 'POPE', 'PORK',
  'PORT', 'POSE', 'POST', 'POUR', 'PRAY', 'PREP', 'PREY', 'PROP', 'PULL', 'PULP',
  'PUMP', 'PURE', 'PUSH', 'PUTS',
  // Q
  'QUAD', 'QUIT', 'QUIZ',
  // R
  'RACE', 'RACK', 'RAFT', 'RAGE', 'RAGS', 'RAID', 'RAIL', 'RAIN', 'RAKE', 'RAMP',
  'RANG', 'RANK', 'RARE', 'RASH', 'RATE', 'RAVE', 'RAYS', 'READ', 'REAL', 'REAM',
  'REAP', 'REAR', 'REDO', 'REED', 'REEF', 'REEL', 'RELY', 'RENT', 'REST', 'RICE',
  'RICH', 'RIDE', 'RIFT', 'RING', 'RIOT', 'RIPE', 'RISE', 'RISK', 'ROAD', 'ROAM',
  'ROAR', 'ROBE', 'ROCK', 'RODE', 'ROLE', 'ROLL', 'ROOF', 'ROOM', 'ROOT', 'ROPE',
  'ROSE', 'RUDE', 'RUIN', 'RULE', 'RUNG', 'RUNS', 'RUSH', 'RUST',
  // S
  'SACK', 'SAFE', 'SAGE', 'SAID', 'SAIL', 'SAKE', 'SALE', 'SALT', 'SAME', 'SAND',
  'SANE', 'SANG', 'SANK', 'SAVE', 'SAYS', 'SEAL', 'SEAM', 'SEAT', 'SECT', 'SEED',
  'SEEK', 'SEEM', 'SEEN', 'SELF', 'SELL', 'SEND', 'SENT', 'SETS', 'SHED', 'SHIP',
  'SHOP', 'SHOT', 'SHOW', 'SHUT', 'SICK', 'SIDE', 'SIGH', 'SIGN', 'SILK', 'SINK',
  'SITE', 'SIZE', 'SKIN', 'SKIP', 'SLAB', 'SLAM', 'SLAP', 'SLAT', 'SLED', 'SLEW',
  'SLID', 'SLIM', 'SLIP', 'SLIT', 'SLOT', 'SLOW', 'SLUG', 'SNAP', 'SNOW', 'SOAK',
  'SOAP', 'SOAR', 'SOCK', 'SODA', 'SOFA', 'SOFT', 'SOIL', 'SOLD', 'SOLE', 'SOLO',
  'SOME', 'SONG', 'SOON', 'SORE', 'SORT', 'SOUL', 'SOUP', 'SOUR', 'SPAN', 'SPAR',
  'SPEC', 'SPIN', 'SPIT', 'SPOT', 'SPUR', 'STAB', 'STAR', 'STAY', 'STEM', 'STEP',
  'STEW', 'STIR', 'STOP', 'STUB', 'STUD', 'STUN', 'SUCH', 'SUCK', 'SUIT', 'SUNG',
  'SUNK', 'SURE', 'SURF', 'SWAP', 'SWIM', 'SYNC',
  // T
  'TABS', 'TACK', 'TAGS', 'TAIL', 'TAKE', 'TALE', 'TALK', 'TALL', 'TAME', 'TANK',
  'TAPE', 'TAPS', 'TASK', 'TAXI', 'TEAM', 'TEAR', 'TECH', 'TEEN', 'TELL', 'TEMP',
  'TEND', 'TENT', 'TERM', 'TEST', 'TEXT', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY',
  'THIN', 'THIS', 'THUS', 'TICK', 'TIDE', 'TIDY', 'TIED', 'TIES', 'TILE', 'TILT',
  'TIME', 'TINT', 'TINY', 'TIPS', 'TIRE', 'TOAD', 'TOES', 'TOIL', 'TOLD', 'TOLL',
  'TOMB', 'TONE', 'TONS', 'TOOK', 'TOOL', 'TOPS', 'TORE', 'TORN', 'TORT', 'TOSS',
  'TOUR', 'TOWN', 'TOYS', 'TRAP', 'TRAY', 'TREE', 'TREK', 'TRIM', 'TRIO', 'TRIP',
  'TROD', 'TROT', 'TRUE', 'TUBE', 'TUCK', 'TUNA', 'TUNE', 'TURN', 'TWIN', 'TYPE',
  // U
  'UGLY', 'UNDO', 'UNIT', 'UNTO', 'UPON', 'URGE', 'USED', 'USER', 'USES',
  // V
  'VAIN', 'VALE', 'VANE', 'VARY', 'VASE', 'VAST', 'VEIL', 'VEIN', 'VENT', 'VERB',
  'VERY', 'VEST', 'VETO', 'VICE', 'VIEW', 'VINE', 'VISA', 'VOID', 'VOLT', 'VOTE',
  // W
  'WADE', 'WAGE', 'WAIT', 'WAKE', 'WALK', 'WALL', 'WAND', 'WANT', 'WARD', 'WARM',
  'WARN', 'WARP', 'WART', 'WASH', 'WASP', 'WAVE', 'WAVY', 'WAYS', 'WEAK', 'WEAR',
  'WEED', 'WEEK', 'WEEP', 'WELL', 'WENT', 'WERE', 'WEST', 'WHAT', 'WHEN', 'WHIP',
  'WIDE', 'WIFE', 'WILD', 'WILL', 'WILT', 'WIND', 'WINE', 'WING', 'WINK', 'WINS',
  'WIPE', 'WIRE', 'WISE', 'WISH', 'WITH', 'WOKE', 'WOLF', 'WOMB', 'WOOD', 'WOOL',
  'WORD', 'WORE', 'WORK', 'WORM', 'WORN', 'WRAP', 'WRIT',
  // Y
  'YARD', 'YARN', 'YEAR', 'YELL', 'YOGA', 'YOLK', 'YOUR',
  // Z
  'ZEAL', 'ZERO', 'ZEST', 'ZONE', 'ZOOM',
];

// 5-Letter Curated Words (~1000 common words for puzzle generation)
const RAW_CURATED_5L_WORDS = [
  // A
  'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADAPT', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER',
  'AGAIN', 'AGENT', 'AGILE', 'AGREE', 'AHEAD', 'AISLE', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN',
  'ALIGN', 'ALIKE', 'ALIVE', 'ALLAY', 'ALLOY', 'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'AMAZE',
  'AMBER', 'AMEND', 'AMPLE', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'ANKLE', 'ANNOY', 'APART',
  'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARMOR', 'AROMA', 'ARRAY', 'ARROW', 'ARSON', 'ASIDE',
  'ASSET', 'ATTIC', 'AUDIO', 'AUDIT', 'AVOID', 'AWAIT', 'AWAKE', 'AWARD', 'AWARE', 'AWFUL',
  // B
  'BADGE', 'BADLY', 'BAGEL', 'BAKER', 'BALLS', 'BASIC', 'BASIN', 'BASIS', 'BATCH', 'BEACH',
  'BEARD', 'BEAST', 'BEGAN', 'BEGIN', 'BEING', 'BELLY', 'BELOW', 'BENCH', 'BERRY', 'BIRTH',
  'BLACK', 'BLADE', 'BLAME', 'BLAND', 'BLANK', 'BLAST', 'BLAZE', 'BLEAK', 'BLEED', 'BLEND',
  'BLESS', 'BLIND', 'BLINK', 'BLISS', 'BLOCK', 'BLOND', 'BLOOD', 'BLOOM', 'BLOWN', 'BLUES',
  'BLUFF', 'BLUNT', 'BLURB', 'BLURT', 'BLUSH', 'BOARD', 'BOAST', 'BONUS', 'BOOST', 'BOOTH',
  'BOSOM', 'BOUGH', 'BOUND', 'BRAIN', 'BRAKE', 'BRAND', 'BRASS', 'BRAVE', 'BREAD', 'BREAK',
  'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BRINK', 'BRISK', 'BROAD', 'BROIL', 'BROKE',
  'BROOM', 'BROTH', 'BROWN', 'BRUSH', 'BRUTE', 'BUILD', 'BUILT', 'BULKY', 'BULLY', 'BUNCH',
  'BURST', 'BUYER',
  // C
  'CABIN', 'CABLE', 'CACHE', 'CAMEL', 'CANAL', 'CANDY', 'CARGO', 'CAROL', 'CARRY', 'CARVE',
  'CATCH', 'CATER', 'CAUSE', 'CEASE', 'CHAIN', 'CHAIR', 'CHALK', 'CHAMP', 'CHAOS', 'CHARM',
  'CHART', 'CHASE', 'CHEAP', 'CHEAT', 'CHECK', 'CHEEK', 'CHEER', 'CHESS', 'CHEST', 'CHICK',
  'CHIEF', 'CHILD', 'CHILL', 'CHIRP', 'CHOIR', 'CHORD', 'CHORE', 'CHOSE', 'CHUNK', 'CIVIC',
  'CIVIL', 'CLAIM', 'CLAMP', 'CLANG', 'CLASH', 'CLASP', 'CLASS', 'CLEAN', 'CLEAR', 'CLERK',
  'CLICK', 'CLIFF', 'CLIMB', 'CLING', 'CLOAK', 'CLOCK', 'CLONE', 'CLOSE', 'CLOTH', 'CLOUD',
  'CLOUT', 'CLOWN', 'CLUMP', 'CLUNG', 'COACH', 'COAST', 'COLOR', 'COLON',
  'COMET', 'COMIC', 'CORAL', 'COUCH', 'COUGH', 'COULD', 'COUNT', 'COURT', 'COVER', 'COVET',
  'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRAWL', 'CRAZE', 'CRAZY', 'CREAK', 'CREAM', 'CREEK',
  'CREEP', 'CREST', 'CRIME', 'CRISP', 'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CRUEL', 'CRUSH',
  'CRUST', 'CURVE', 'CYCLE',
  // D
  'DAILY', 'DAIRY', 'DAISY', 'DANCE', 'DEALT', 'DEATH', 'DEBIT', 'DEBUT', 'DECAY', 'DECOR',
  'DECOY', 'DELAY', 'DELTA', 'DENSE', 'DEPOT', 'DEPTH', 'DETER', 'DEVIL', 'DIARY', 'DIGIT',
  'DINER', 'DIRTY', 'DISCO', 'DITCH', 'DIVER', 'DODGE', 'DOING', 'DONOR', 'DOUBT', 'DOUGH',
  'DRAFT', 'DRAIN', 'DRAKE', 'DRAMA', 'DRANK', 'DRAPE', 'DRAWN', 'DREAD', 'DREAM', 'DRESS',
  'DRIED', 'DRIFT', 'DRILL', 'DRINK', 'DRIVE', 'DRONE', 'DROOP', 'DROWN', 'DRUNK',
  'DUSTY', 'DWARF', 'DWELL',
  // E
  'EAGER', 'EARLY', 'EARTH', 'EATEN', 'EATER', 'EDGES', 'EERIE', 'EIGHT', 'ELBOW', 'ELDER',
  'ELECT', 'ELITE', 'ELOPE', 'EMAIL', 'EMBED', 'EMBER', 'EMPTY', 'ENACT', 'ENEMY', 'ENJOY',
  'ENTER', 'ENTRY', 'EQUAL', 'EQUIP', 'ERASE', 'ERECT', 'ERROR', 'ERUPT', 'ESSAY', 'EVENT',
  'EVERY', 'EVICT', 'EXACT', 'EXALT', 'EXCEL', 'EXERT', 'EXILE', 'EXIST', 'EXTRA',
  // F
  'FABLE', 'FACED', 'FACET', 'FAINT', 'FAIRY', 'FAITH', 'FALSE', 'FANCY', 'FATAL', 'FAULT',
  'FAVOR', 'FEAST', 'FENCE', 'FERAL', 'FERRY', 'FETCH', 'FEVER', 'FIBER', 'FIELD', 'FIEND',
  'FIERY', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FINER', 'FIRST', 'FIXED', 'FIXER', 'FIZZY',
  'FLACK', 'FLAIR', 'FLAKE', 'FLAKY', 'FLAME', 'FLANK', 'FLARE', 'FLASH', 'FLASK', 'FLATS',
  'FLECK', 'FLESH', 'FLICK', 'FLIER', 'FLING', 'FLINT', 'FLOAT', 'FLOCK', 'FLOOD',
  'FLOOR', 'FLORA', 'FLOUR', 'FLUID', 'FLUKE', 'FLUNG', 'FLUSH', 'FLUTE', 'FOCAL', 'FOCUS',
  'FOGGY', 'FOLKS', 'FOLLY', 'FORCE', 'FORGE', 'FORGO', 'FORTH', 'FORTY', 'FORUM',
  'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FREAK', 'FREED', 'FRESH', 'FRIED', 'FRONT', 'FROST',
  'FROWN', 'FROZE', 'FRUIT', 'FUDGE', 'FULLY', 'FUNDS', 'FUNNY', 'FUZZY',
  // G
  'GAMMA', 'GAUGE', 'GAUZE', 'GAZER', 'GEARS', 'GENRE', 'GHOST', 'GIANT', 'GIDDY', 'GIFTS',
  'GIVEN', 'GIVER', 'GLADE', 'GLAND', 'GLARE', 'GLASS', 'GLEAM', 'GLEAN', 'GLIDE', 'GLINT',
  'GLOBE', 'GLOOM', 'GLORY', 'GLOSS', 'GLOVE', 'GLYPH', 'GNOME', 'GOING', 'GOODS', 'GOOSE',
  'GORGE', 'GRACE', 'GRADE', 'GRAIN', 'GRAND', 'GRANT', 'GRAPE', 'GRAPH', 'GRASP', 'GRASS',
  'GRATE', 'GRAVE', 'GRAVY', 'GRAZE', 'GREAT', 'GREED', 'GREEN', 'GREET', 'GRIEF', 'GRILL',
  'GRIND', 'GRIPE', 'GROAN', 'GROOM', 'GROPE', 'GROSS', 'GROUP', 'GROVE', 'GROWL', 'GROWN',
  'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUILD', 'GUILT', 'GUISE', 'GUSTY',
  // H
  'HABIT', 'HAIRY', 'HANDS', 'HANDY', 'HAPPY', 'HARDY', 'HARSH', 'HASTE', 'HASTY', 'HATCH',
  'HAUNT', 'HAVEN', 'HAZEL', 'HEADS', 'HEALS', 'HEARD', 'HEART', 'HEAVY', 'HEDGE', 'HEELS',
  'HEFTY', 'HEIST', 'HELLO', 'HENCE', 'HERBS', 'HERON', 'HILLS', 'HILLY', 'HINGE',
  'HIPPO', 'HITCH', 'HOARD', 'HOBBY', 'HOIST', 'HOMER', 'HONEY', 'HONOR', 'HOPED', 'HORDE',
  'HORSE', 'HOTEL', 'HOUND', 'HOURS', 'HOUSE', 'HOVER', 'HUMAN', 'HUMID', 'HUMOR', 'HUNCH',
  'HUNKY', 'HURRY', 'HUSKY',
  // I
  'IDEAL', 'IDEAS', 'ICING', 'IMAGE', 'IMPLY', 'INANE', 'INDEX', 'INDIE', 'INEPT', 'INERT',
  'INFRA', 'INNER', 'INPUT', 'INTER', 'INTRO', 'IRONY', 'ISSUE', 'ITEMS', 'IVORY',
  // J
  'JAUNT', 'JAZZY', 'JEANS', 'JELLY', 'JERKY', 'JEWEL', 'JIFFY', 'JOINT', 'JOKER', 'JOLLY',
  'JOLTS', 'JOUST', 'JUDGE', 'JUICE', 'JUICY', 'JUMBO', 'JUMPS', 'JUMPY', 'JUNKY',
  // K
  'KAYAK', 'KEBAB', 'KEEPS', 'KEYED', 'KICKS', 'KILLS', 'KINDS', 'KINGS', 'KIOSK', 'KNACK',
  'KNEAD', 'KNEEL', 'KNEES', 'KNIFE', 'KNOCK', 'KNOLL', 'KNOTS', 'KNOWN', 'KNOWS',
  // L
  'LABEL', 'LABOR', 'LACKS', 'LADEN', 'LADLE', 'LAGER', 'LAKES', 'LANCE', 'LANDS', 'LANES',
  'LAPEL', 'LAPSE', 'LARGE', 'LASER', 'LASSO', 'LATCH', 'LATER', 'LATHE', 'LAUGH', 'LAYER',
  'LEADS', 'LEAFY', 'LEAKY', 'LEANT', 'LEAPT', 'LEARN', 'LEASE', 'LEASH', 'LEAST', 'LEAVE',
  'LEDGE', 'LEECH', 'LEGAL', 'LEMON', 'LENDS', 'LEVEL', 'LEVER', 'LIBEL', 'LIGHT', 'LIKED',
  'LIKEN', 'LILAC', 'LIMBO', 'LIMBS', 'LIMIT', 'LINEN', 'LINER', 'LINES', 'LINGO', 'LINKS',
  'LIONS', 'LISTS', 'LITER', 'LIVEN', 'LIVER', 'LIVES', 'LIVID', 'LLAMA', 'LOADS', 'LOANS',
  'LOBBY', 'LOCAL', 'LOCKS', 'LODGE', 'LOFTY', 'LOGIC', 'LOOKS', 'LOOMS', 'LOOPS', 'LOOSE',
  'LORRY', 'LOSER', 'LOSES', 'LOTTO', 'LOTUS', 'LOUSY', 'LOVED', 'LOVER', 'LOVES',
  'LOWER', 'LOYAL', 'LUCID', 'LUCKY', 'LUMEN', 'LUMPS', 'LUMPY', 'LUNAR', 'LUNCH', 'LUNGE',
  'LUNGS', 'LURCH', 'LYRIC',
  // M
  'MACRO', 'MADAM', 'MAGIC', 'MAJOR', 'MAKER', 'MAKES', 'MANGE', 'MANGO', 'MANIA', 'MANOR',
  'MAPLE', 'MARCH', 'MARRY', 'MARSH', 'MASKS', 'MATCH', 'MATER', 'MAUVE', 'MAXIM', 'MAYOR',
  'MEALS', 'MEANS', 'MEANT', 'MEATS', 'MEDAL', 'MEDIA', 'MELEE', 'MELON', 'MERCY', 'MERGE',
  'MERIT', 'MERRY', 'MESSY', 'METAL', 'METER', 'METRO', 'MICRO', 'MIDST', 'MIGHT', 'MIMIC',
  'MINCE', 'MINDS', 'MINED', 'MINER', 'MINES', 'MINOR', 'MINUS', 'MIRTH', 'MISTY', 'MIXER',
  'MODEL', 'MODEM', 'MODES', 'MOIST', 'MOLAR', 'MOLDS', 'MOLDY', 'MONEY', 'MONTH', 'MOODS',
  'MOODY', 'MOONS', 'MOORS', 'MOOSE', 'MORAL', 'MORPH', 'MOTOR', 'MOTTO', 'MOULD', 'MOUND',
  'MOUNT', 'MOURN', 'MOUSE', 'MOUTH', 'MOVED', 'MOVER', 'MOVES', 'MOVIE', 'MUDDY', 'MULTI',
  'MUMMY', 'MUNCH', 'MURAL', 'MURKY', 'MUSIC', 'MUSTY', 'MYTHS',
  // N
  'NACHO', 'NAIVE', 'NAKED', 'NAMED', 'NAMES', 'NANNY', 'NASAL', 'NASTY', 'NAVAL', 'NAVEL',
  'NEEDY', 'NERVE', 'NERVY', 'NEVER', 'NEWER', 'NEWLY', 'NICER', 'NICHE', 'NIGHT', 'NIMBY',
  'NINTH', 'NOBLE', 'NODES', 'NOISE', 'NOISY', 'NORMS', 'NORTH', 'NOTCH', 'NOTED', 'NOTES',
  'NOVEL', 'NURSE', 'NUTTY', 'NYLON',
  // O
  'OASIS', 'OCCUR', 'OCEAN', 'ODDLY', 'OFFER', 'OFTEN', 'OILED', 'OILER', 'OLDER', 'OLIVE',
  'OMEGA', 'ONION', 'ONSET', 'OPERA', 'OPTED', 'OPTIC', 'ORBIT', 'ORDER', 'ORGAN', 'OTHER',
  'OUGHT', 'OUNCE', 'OUTER', 'OUTGO', 'OVALS', 'OVARY', 'OVERT', 'OWING', 'OWNED', 'OWNER',
  'OXIDE', 'OZONE',
  // P
  'PACED', 'PACES', 'PACKS', 'PACTS', 'PADDY', 'PAGAN', 'PAGES', 'PAINS', 'PAINT', 'PAIRS',
  'PALMS', 'PANEL', 'PANIC', 'PANTS', 'PAPER', 'PARKS', 'PARSE', 'PARTS', 'PARTY', 'PASTA',
  'PASTE', 'PASTY', 'PATCH', 'PATHS', 'PATIO', 'PAUSE', 'PEACE', 'PEACH', 'PEAKS', 'PEARL',
  'PEARS', 'PECAN', 'PEDAL', 'PEEKS', 'PEELS', 'PEERS', 'PENAL', 'PENCE', 'PENNY', 'PERCH',
  'PERIL', 'PERKS', 'PERKY', 'PETAL', 'PETTY', 'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PICKS',
  'PIECE', 'PIERS', 'PIGGY', 'PILED', 'PILES', 'PILLS', 'PILOT', 'PINCH', 'PINES', 'PINKY',
  'PINTS', 'PIPER', 'PIPES', 'PITCH', 'PITHY', 'PIVOT', 'PIXEL', 'PIZZA', 'PLACE', 'PLAID',
  'PLAIN', 'PLANE', 'PLANK', 'PLANS', 'PLANT', 'PLATE', 'PLAZA', 'PLEAD',
  'PLEAT', 'PLIER', 'PLOTS', 'PLUCK', 'PLUMB', 'PLUME', 'PLUMP', 'PLUMS', 'PLUNK',
  'PLUSH', 'POACH', 'POEMS', 'POETS', 'POINT', 'POISE', 'POKER', 'POLAR', 'POLES', 'POLLS',
  'PONDS', 'POOLS', 'PORCH', 'PORES', 'PORTS', 'POSED', 'POSER', 'POSES', 'POSTS', 'POTTY',
  'POUCH', 'POUND', 'POURS', 'POWER', 'PRANK', 'PRAWN', 'PRESS', 'PRICE', 'PRIDE', 'PRIME',
  'PRINT', 'PRIOR', 'PRISM', 'PRIZE', 'PROBE', 'PROMO', 'PRONE', 'PRONG', 'PROOF', 'PROSE',
  'PROUD', 'PROVE', 'PROWL', 'PROXY', 'PRUDE', 'PRUNE', 'PUFFS', 'PUFFY', 'PULLS', 'PULSE',
  'PUMPS', 'PUNCH', 'PUNKS', 'PUPIL', 'PUPPY', 'PURGE', 'PURSE', 'PUSHY', 'PUTTY',
  // Q
  'QUACK', 'QUADS', 'QUAIL', 'QUAKE', 'QUALM', 'QUERY', 'QUEST', 'QUEUE', 'QUICK', 'QUIET',
  'QUILT', 'QUIRK', 'QUITE', 'QUOTA', 'QUOTE',
  // R
  'RACER', 'RACES', 'RACKS', 'RADAR', 'RADIO', 'RAIDS', 'RAILS', 'RAINY', 'RAISE', 'RALLY',
  'RAMPS', 'RANCH', 'RANGE', 'RANKS', 'RAPID', 'RATED', 'RATES', 'RATIO',
  'RAZOR', 'REACH', 'REACT', 'READS', 'READY', 'REALM', 'REAMS', 'REBEL', 'RECAP', 'RECUR',
  'REEFS', 'REEKS', 'REELS', 'REFER', 'REIGN', 'RELAX', 'RELAY', 'RELIC', 'REMIT', 'REMIX',
  'RENAL', 'RENEW', 'REPAY', 'REPEL', 'REPLY', 'REPOS', 'RESET', 'RESIN', 'RESTS',
  'RETRO', 'RIDER', 'RIDES', 'RIDGE', 'RIFLE', 'RIFTS', 'RIGHT', 'RIGID', 'RIGOR', 'RINGS',
  'RINSE', 'RIOTS', 'RIPEN', 'RIPER', 'RISEN', 'RISES', 'RISKS', 'RISKY', 'RITZY', 'RIVAL',
  'RIVER', 'ROADS', 'ROAMS', 'ROARS', 'ROAST', 'ROBES', 'ROBIN', 'ROBOT', 'ROCKS', 'ROCKY',
  'RODEO', 'ROGER', 'ROLES', 'ROLLS', 'ROMAN', 'ROOFS', 'ROOMS', 'ROOMY', 'ROOTS', 'ROPES',
  'ROSES', 'ROTOR', 'ROUGE', 'ROUGH', 'ROUND', 'ROUTE', 'ROVER', 'ROWDY', 'ROWED', 'ROWER',
  'ROYAL', 'RUGBY', 'RUINS', 'RULED', 'RULER', 'RULES', 'RUMOR', 'RUPEE', 'RURAL', 'RUSTY',
  // S
  'SADLY', 'SAFER', 'SAINT', 'SALAD', 'SALES', 'SALON', 'SALSA', 'SALTY', 'SALVE', 'SANDS',
  'SANDY', 'SANER', 'SAPPY', 'SATAY', 'SATIN', 'SAUCE', 'SAUCY', 'SAUNA', 'SAUTE', 'SAVED',
  'SAVER', 'SAVES', 'SAVOR', 'SAVVY', 'SCALE', 'SCALP', 'SCALY', 'SCAMS', 'SCANT', 'SCARE',
  'SCARF', 'SCARY', 'SCENE', 'SCENT', 'SCOOP', 'SCOPE', 'SCORE', 'SCORN', 'SCOUT', 'SCOWL',
  'SCRAM', 'SCRAP', 'SCREW', 'SCRUB', 'SEALS', 'SEAMS', 'SEATS', 'SEEDS', 'SEEDY', 'SEEKS',
  'SEEMS', 'SEIZE', 'SELLS', 'SENDS', 'SENSE', 'SERUM', 'SERVE', 'SETUP', 'SEVEN', 'SEVER',
  'SHADE', 'SHADY', 'SHAFT', 'SHAKE', 'SHAKY', 'SHALL', 'SHAME', 'SHANK', 'SHAPE', 'SHARD',
  'SHARE', 'SHARK', 'SHARP', 'SHAVE', 'SHAWL', 'SHEAR', 'SHEDS', 'SHEEN', 'SHEEP', 'SHEER',
  'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHINY', 'SHIPS', 'SHIRE', 'SHIRK', 'SHIRT',
  'SHOCK', 'SHOES', 'SHONE', 'SHOOK', 'SHOOT', 'SHOPS', 'SHORE', 'SHORT', 'SHOTS', 'SHOUT',
  'SHOVE', 'SHOWN', 'SHOWS', 'SHOWY', 'SHRED', 'SHREW', 'SHRUB', 'SHRUG', 'SHUCK', 'SHUNT',
  'SIDED', 'SIDES', 'SIEGE', 'SIEVE', 'SIGHT', 'SIGMA', 'SIGNS', 'SILKS', 'SILKY', 'SILLY',
  'SINCE', 'SINEW', 'SINGE', 'SINKS', 'SIREN', 'SISSY', 'SITES', 'SIXTH', 'SIXTY', 'SIZED',
  'SIZER', 'SIZES', 'SKATE', 'SKIER', 'SKILL', 'SKIMP', 'SKIMS', 'SKINS', 'SKIPS', 'SKIRT',
  'SKULL', 'SKUNK', 'SLACK', 'SLAIN', 'SLANG', 'SLANT', 'SLASH', 'SLATE', 'SLAVE', 'SLEEK',
  'SLEEP', 'SLEET', 'SLEPT', 'SLICE', 'SLICK', 'SLIDE', 'SLIME', 'SLIMY', 'SLING', 'SLINK',
  'SLIPS', 'SLITS', 'SLOPE', 'SLOPS', 'SLOSH', 'SLOTH', 'SLOTS', 'SLUMP', 'SLUMS', 'SLUNG',
  'SLUNK', 'SLURP', 'SLUSH', 'SMALL', 'SMART', 'SMASH', 'SMEAR', 'SMELL', 'SMELT', 'SMILE',
  'SMIRK', 'SMOCK', 'SMOKE', 'SMOKY', 'SNACK', 'SNAGS', 'SNAIL', 'SNAKE', 'SNAPS', 'SNARE',
  'SNARL', 'SNEAK', 'SNEER', 'SNIFF', 'SNOOP', 'SNORE', 'SNORT', 'SNOUT', 'SNOWY', 'SNUBS',
  'SNUCK', 'SNUFF', 'SOAPY', 'SOARS', 'SOBER', 'SOCKS', 'SOILS', 'SOLAR', 'SOLID', 'SOLOS',
  'SOLVE', 'SONAR', 'SONGS', 'SONIC', 'SORRY', 'SORTS', 'SOULS', 'SOUND', 'SOUPS', 'SOUPY',
  'SOUTH', 'SOWED', 'SPACE', 'SPADE', 'SPANK', 'SPANS', 'SPARE', 'SPARK', 'SPARS', 'SPAWN',
  'SPEAK', 'SPEAR', 'SPECS', 'SPEED', 'SPELL', 'SPEND', 'SPENT', 'SPICE', 'SPICY', 'SPIED',
  'SPIKE', 'SPILL', 'SPINE', 'SPINS', 'SPINY', 'SPITE', 'SPLAT', 'SPLIT', 'SPOIL', 'SPOKE',
  'SPOOK', 'SPOOL', 'SPOON', 'SPORT', 'SPOTS', 'SPOUT', 'SPRAY', 'SPREE', 'SPRIG', 'SPUNK',
  'SQUAD', 'SQUAT', 'SQUID', 'STACK', 'STAFF', 'STAGE', 'STAIN', 'STAIR', 'STAKE', 'STALE',
  'STALK', 'STALL', 'STAMP', 'STAND', 'STANK', 'STAPH', 'STARK', 'STARS', 'START', 'STASH',
  'STATE', 'STAVE', 'STAYS', 'STEAD', 'STEAK', 'STEAL', 'STEAM', 'STEEL', 'STEEP', 'STEER',
  'STEMS', 'STEPS', 'STERN', 'STEWS', 'STICK', 'STIFF', 'STILL', 'STING', 'STINK', 'STINT',
  'STOCK', 'STOIC', 'STOKE', 'STOLE', 'STOMP', 'STONE', 'STONY', 'STOOD', 'STOOL', 'STOOP',
  'STOPS', 'STORE', 'STORK', 'STORM', 'STORY', 'STOUT', 'STOVE', 'STRAP', 'STRAW', 'STRAY',
  'STRIP', 'STRUM', 'STRUT', 'STUCK', 'STUDY', 'STUFF', 'STUMP', 'STUNG', 'STUNK', 'STUNT',
  'STYLE', 'SUAVE', 'SUCKS', 'SUGAR', 'SUITE', 'SUITS', 'SULKS', 'SULLY', 'SUNNY', 'SUPER',
  'SURGE', 'SUSHI', 'SWAMP', 'SWANS', 'SWAPS', 'SWARM', 'SWATH', 'SWEAR', 'SWEAT', 'SWEEP',
  'SWEET', 'SWELL', 'SWEPT', 'SWIFT', 'SWIMS', 'SWING', 'SWIPE', 'SWIRL', 'SWISS', 'SWORD',
  'SWORE', 'SWORN', 'SWUNG', 'SYRUP',
  // T
  'TABLE', 'TACIT', 'TACKS', 'TACKY', 'TACOS', 'TAILS', 'TAINT', 'TAKEN', 'TAKER', 'TAKES',
  'TALES', 'TALKS', 'TALLY', 'TALON', 'TAMED', 'TAMER', 'TANGO', 'TANGY', 'TANKS', 'TAPES',
  'TARDY', 'TASKS', 'TASTE', 'TASTY', 'TATTY', 'TAXED', 'TAXES', 'TEACH', 'TEARY', 'TEASE',
  'TEDDY', 'TEENS', 'TEETH', 'TEMPO', 'TEMPS', 'TENDS', 'TENSE', 'TENTH', 'TENTS', 'TEPID',
  'TERMS', 'TESTS', 'TEXTS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK',
  'THIEF', 'THIGH', 'THING', 'THINK', 'THIRD', 'THORN', 'THOSE', 'THREE', 'THREW', 'THROW',
  'THUMB', 'THUMP', 'TIDAL', 'TIDES', 'TIGER', 'TIGHT', 'TILED', 'TILES', 'TILTS', 'TIMER',
  'TIMES', 'TIMID', 'TINGE', 'TIPSY', 'TIRED', 'TITAN', 'TITLE', 'TOAST', 'TODAY', 'TOKEN',
  'TOLLS', 'TOMBS', 'TONED', 'TONER', 'TONES', 'TONGS', 'TONIC', 'TOOLS', 'TOOTH', 'TOPIC',
  'TOPSY', 'TORCH', 'TOTAL', 'TOTEM', 'TOUCH', 'TOUGH', 'TOURS', 'TOWEL', 'TOWER', 'TOWNS',
  'TOXIC', 'TRACE', 'TRACK', 'TRACT', 'TRADE', 'TRAIL', 'TRAIN', 'TRAIT', 'TRAMP', 'TRANS',
  'TRAPS', 'TRASH', 'TREAD', 'TREAT', 'TREES', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED',
  'TRIER', 'TRIES', 'TRIMS', 'TRIPS', 'TRITE', 'TROLL', 'TROOP', 'TROUT', 'TRUCE', 'TRUCK',
  'TRULY', 'TRUMP', 'TRUNK', 'TRUST', 'TRUTH', 'TUBBY', 'TUBES', 'TULIP', 'TUMOR', 'TUNED',
  'TUNER', 'TUNES', 'TUNIC', 'TURBO', 'TURFS', 'TURNS', 'TUTOR', 'TWEAK', 'TWEET', 'TWICE',
  'TWIGS', 'TWILL', 'TWINS', 'TWIRL', 'TWIST', 'TYPED', 'TYPES',
  // U
  'UDDER', 'ULTRA', 'UMBRA', 'UNCLE', 'UNDER', 'UNDID', 'UNDUE', 'UNFED', 'UNFIT', 'UNIFY',
  'UNION', 'UNITE', 'UNITS', 'UNITY', 'UNTIL', 'UNWED', 'UPPER', 'UPSET',
  'URBAN', 'URGED', 'URGES', 'USAGE', 'USHER', 'USING', 'USUAL', 'UTTER',
  // V
  'VAGUE', 'VALID', 'VALOR', 'VALUE', 'VALVE', 'VAPOR', 'VAULT', 'VAUNT', 'VEGAN', 'VEILS',
  'VEINS', 'VENOM', 'VENUE', 'VERGE', 'VERSE', 'VIDEO', 'VIEWS', 'VIGOR', 'VINYL', 'VIOLA',
  'VIPER', 'VIRAL', 'VIRUS', 'VISIT', 'VISOR', 'VISTA', 'VITAL', 'VIVID', 'VIXEN', 'VOCAL',
  'VODKA', 'VOGUE', 'VOICE', 'VOIDS', 'VOLTS', 'VOMIT', 'VOTED', 'VOTER', 'VOTES', 'VOUCH',
  'VOWEL', 'VYING',
  // W
  'WACKY', 'WADED', 'WADER', 'WADES', 'WAFER', 'WAGED', 'WAGER', 'WAGES', 'WAGON', 'WAIST',
  'WAITS', 'WAKEN', 'WAKES', 'WALKS', 'WALLS', 'WALTZ', 'WANDS', 'WANTS', 'WARDS', 'WARMS',
  'WARNS', 'WARPS', 'WARTS', 'WASPS', 'WASTE', 'WATCH', 'WATER', 'WATTS', 'WAVED', 'WAVER',
  'WAVES', 'WEARY', 'WEAVE', 'WEDGE', 'WEEDS', 'WEEDY', 'WEEKS', 'WEIGH', 'WEIRD',
  'WELLS', 'WELSH', 'WENCH', 'WETLY', 'WHALE', 'WHARF', 'WHEAT', 'WHEEL', 'WHERE', 'WHICH',
  'WHIFF', 'WHILE', 'WHIMS', 'WHINE', 'WHINY', 'WHIPS', 'WHIRL', 'WHISK', 'WHITE', 'WHOLE',
  'WHOSE', 'WIDEN', 'WIDER', 'WIDTH', 'WIELD', 'WILLS', 'WIMPY', 'WINCE', 'WINCH', 'WINDS',
  'WINDY', 'WINED', 'WINES', 'WINGS', 'WINKS', 'WIPED', 'WIPER', 'WIPES', 'WIRED', 'WIRES',
  'WISER', 'WITCH', 'WITHE', 'WITTY', 'WOKEN', 'WOMAN', 'WOMEN', 'WOODS', 'WOODY', 'WOOLS',
  'WOOLY', 'WORDS', 'WORDY', 'WORKS', 'WORLD', 'WORMS', 'WORRY', 'WORSE', 'WORST', 'WORTH',
  'WOULD', 'WOUND', 'WOVEN', 'WRACK', 'WRAPS', 'WRATH', 'WREAK', 'WRECK', 'WREST', 'WRING',
  'WRIST', 'WRITE', 'WRONG', 'WROTE', 'WRYLY',
  // Y
  'YACHT', 'YARDS', 'YARNS', 'YEARN', 'YEARS', 'YEAST', 'YELLS', 'YIELD', 'YOLKS', 'YOUNG',
  'YOURS', 'YOUTH', 'YUMMY',
  // Z
  'ZAPPY', 'ZEBRA', 'ZEROS', 'ZESTY', 'ZIPPY', 'ZONAL', 'ZONES', 'ZOOMS',
];

// Validated sets - only include words that exist in TWL06
let validated4L: Set<string> | null = null;
let validated5L: Set<string> | null = null;

function getValidated4L(): Set<string> {
  if (validated4L) return validated4L;
  
  validated4L = new Set<string>();
  const invalid: string[] = [];
  
  for (const word of RAW_CURATED_4L_WORDS) {
    if (isValidScrabbleWord(word)) {
      validated4L.add(word);
    } else {
      invalid.push(word);
    }
  }
  
  if (invalid.length > 0) {
    console.warn(`Curated 4L words not in TWL06: ${invalid.join(', ')}`);
  }
  
  console.log(`Curated 4L dictionary: ${validated4L.size} words (${invalid.length} removed)`);
  return validated4L;
}

function getValidated5L(): Set<string> {
  if (validated5L) return validated5L;
  
  validated5L = new Set<string>();
  const invalid: string[] = [];
  
  for (const word of RAW_CURATED_5L_WORDS) {
    if (isValidScrabbleWord(word)) {
      validated5L.add(word);
    } else {
      invalid.push(word);
    }
  }
  
  if (invalid.length > 0) {
    console.warn(`Curated 5L words not in TWL06: ${invalid.join(', ')}`);
  }
  
  console.log(`Curated 5L dictionary: ${validated5L.size} words (${invalid.length} removed)`);
  return validated5L;
}

// Export validated sets for backwards compatibility
export const CURATED_4L_WORDS = new Proxy(new Set<string>(), {
  get(target, prop) {
    const validated = getValidated4L();
    return Reflect.get(validated, prop, validated);
  }
}) as Set<string>;

export const CURATED_5L_WORDS = new Proxy(new Set<string>(), {
  get(target, prop) {
    const validated = getValidated5L();
    return Reflect.get(validated, prop, validated);
  }
}) as Set<string>;

/**
 * Get the curated dictionary for a specific word length
 */
export const getCuratedDictionary = (wordLength: 4 | 5): Set<string> => {
  return wordLength === 4 ? getValidated4L() : getValidated5L();
};

/**
 * Check if a word is in the curated dictionary
 */
export const isValidCuratedWord = (word: string, wordLength: 4 | 5): boolean => {
  const upper = word.toUpperCase();
  const dict = getCuratedDictionary(wordLength);
  return dict.has(upper);
};

/**
 * Get dictionary size
 */
export const getDictionarySize = (wordLength: 4 | 5): number => {
  return getCuratedDictionary(wordLength).size;
};
