// Re-export the friends service from its original location
// This shared path makes the friends system accessible from all games
export {
  getMyFriendCode,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  updatePresence,
  setOffline,
} from '@/lib/morphcode/friendsService';

export type { Friend } from '@/lib/morphcode/friendsService';
