// First names - friendly, diverse, easy to distinguish
export const PERSON_NAMES = [
  "Maya", "Leo", "Nina", "Omar", "Lena", "Eli",
  "Ava", "Jonah", "Iris", "Noah", "Zoe", "Kai",
  "Mila", "Ethan", "Luca", "Sara", "Dylan", "Riya",
  "Hugo", "Amir", "Tessa", "Felix", "Clara", "Max",
  "Ruby", "Oscar", "Ivy", "Theo", "Luna", "Jack"
];

// Everyday locations - relatable, NYT-friendly
export const LOCATION_POOL = [
  "Park", "Library", "Museum", "Café", "Train Station", "Bakery",
  "Cinema", "Bookshop", "Gallery", "Plaza", "Courtyard", "Market",
  "Garden", "Pier", "Fountain", "Theater", "Post Office", "Bank"
];

// Time slots in 30-minute increments
export const TIME_POOL = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM"
];

// Objects/activities that make sense in various locations
export const OBJECT_POOL = [
  "Umbrella", "Sketchbook", "Coffee", "Newspaper",
  "Camera", "Ticket", "Backpack", "Bouquet",
  "Map", "Laptop", "Ice Cream", "Book",
  "Sunglasses", "Journal", "Scarf", "Phone"
];

// Helper function to shuffle an array with a seeded RNG
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentIndex = result.length;
  
  // Simple seeded random number generator (mulberry32)
  const random = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  while (currentIndex > 0) {
    const randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;
    [result[currentIndex], result[randomIndex]] = [result[randomIndex], result[currentIndex]];
  }

  return result;
}

// Pick n distinct items from a pool using a seeded shuffle
export function pickDistinct<T>(pool: T[], count: number, seed: number): T[] {
  const shuffled = seededShuffle(pool, seed);
  return shuffled.slice(0, count);
}

// Sort times chronologically
export function sortTimes(times: string[]): string[] {
  return [...times].sort((a, b) => {
    const parseTime = (t: string) => {
      const [time, period] = t.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    return parseTime(a) - parseTime(b);
  });
}
