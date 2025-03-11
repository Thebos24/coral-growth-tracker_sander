import { FirebaseService } from '../services/firebase-db';

export async function migrateAlbums(userId) {
  try {
    const docRef = doc(db, 'albums', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const oldData = docSnap.data();
    if (!oldData.albums) return;
    
    for (const [albumName, photos] of Object.entries(oldData.albums)) {
      for (const photo of photos) {
        await FirebaseService.uploadImage(
          photo.url,
          userId,
          albumName
        );
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}