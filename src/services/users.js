import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Set user display name
export async function setUserDisplayName(userId, displayName) {
  await setDoc(doc(db, "users", userId), {
    displayName,
    createdAt: new Date()
  });
}

// Get user display name
export async function getUserDisplayName(userId) {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    return userDoc.data().displayName;
  }
  return null;
}

// Get multiple user display names
export async function getUserDisplayNames(userIds) {
  const promises = userIds.map(async (userId) => {
    const displayName = await getUserDisplayName(userId);
    return { userId, displayName };
  });
  
  const results = await Promise.all(promises);
  
  const displayNames = {};
  results.forEach(result => {
    displayNames[result.userId] = result.displayName || `User ${result.userId.substring(0, 5)}`;
  });
  
  return displayNames;
}