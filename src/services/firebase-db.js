// src/services/firebase-db.js
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp,deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class FirebaseService {
  static async uploadImage(file, userId, albumName) {
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `users/${userId}/albums/${albumName}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // 2. Get or create album document
      const albumRef = doc(db, 'albums', userId, 'userAlbums', albumName);
      await setDoc(albumRef, {
        name: albumName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. Add photo to subcollection
      const photoRef = collection(albumRef, 'photos');
      await addDoc(photoRef, {
        url: downloadUrl,
        filename: file.name,
        uploadedAt: serverTimestamp(),
        uploadedBy: userId,
        storagePath: storageRef.fullPath
      });

      return {
        url: downloadUrl,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        storagePath: storageRef.fullPath
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error.message);
      throw new Error('Invalid email or password');
    }
  }

  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Error signing out');
    }
  }

  static async signUp(email, password, firstName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user profile data
      const userProfileRef = doc(db, 'userProfiles', userCredential.userId);
      await setDoc(userProfileRef, {
        firstName,
        email,
        createdAt: new Date().toISOString()
      });

      return {
        user: userCredential.user,
        profile: { firstName }
      };
    } catch (error) {
      console.error('Sign up error:', error.message);
      throw new Error('Failed to create account');
    }
  }

  static async saveAlbums(albums, userId) {
    try {
      console.log('Saving albums to Firestore:', {
        userId,
        albumCount: Object.keys(albums).length,
        photoUrls: Object.values(albums).flatMap(photos => 
          photos.map(p => ({ url: p.url, type: typeof p.url }))
        )
      });

      // Add validation and cleanup
      const processedAlbums = Object.entries(albums).reduce((acc, [albumName, photos]) => {
        acc[albumName] = photos.map(photo => {
          // Only include defined fields
          const cleanPhoto = {
            url: photo.url,
            date: photo.date && photo.date.toDate ? photo.date.toDate().toISOString() : photo.date,
            filename: photo.filename,
            uploadedAt: photo.uploadedAt instanceof Date ? photo.uploadedAt.toISOString() : photo.uploadedAt,
            uploadedBy: photo.uploadedBy
          };

          // Remove any undefined values
          Object.keys(cleanPhoto).forEach(key => 
            cleanPhoto[key] === undefined && delete cleanPhoto[key]
          );

          return cleanPhoto;  // Make sure to return the cleaned photo
        }).filter(photo => photo.url && photo.date); // Ensure required fields exist

        return acc;
      }, {});

      const albumsRef = doc(db, 'albums', userId);
      await setDoc(albumsRef, { 
        albums: processedAlbums,
        lastUpdated: new Date().toISOString()
      });

      return processedAlbums;
    } catch (error) {
      console.error('Error saving albums to Firestore:', error);
      throw error;
    }
  }

  static async loadAlbums(userId) {
    try {
      const albumsRef = collection(db, 'albums', userId, 'userAlbums');
      const albumsSnap = await getDocs(albumsRef);
      
      const albums = {};
      
      // Load all albums and their photos
      for (const albumDoc of albumsSnap.docs) {
        const albumName = albumDoc.id;
        const photosRef = collection(albumDoc.ref, 'photos');
        const photosQuery = query(photosRef, orderBy('uploadedAt', 'desc'));
        const photosSnap = await getDocs(photosQuery);
        
        albums[albumName] = photosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert timestamps to ISO strings
          uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
      }

      return albums;
    } catch (error) {
      console.error('Error loading albums:', error);
      throw error;
    }
  }

  static async deletePhoto(userId, albumName, photoData) {
    try {
      // 1. Delete from Storage
      if (photoData.storagePath) {
        const storageRef = ref(storage, photoData.storagePath);
        await deleteObject(storageRef);
      }

      // 2. Delete from Firestore
      const photoRef = doc(db, 'albums', userId, 'userAlbums', albumName, 'photos', photoData.id);
      await deleteDoc(photoRef);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  static async deleteAlbum(albumName, userId) {
    try {
      const userAlbums = await this.loadAlbums(userId);
      const updatedAlbums = { ...userAlbums };
      delete updatedAlbums[albumName];
      
      await this.saveAlbums(updatedAlbums, userId);
      return updatedAlbums;
    } catch (error) {
      console.error('Error deleting album:', error);
      throw new Error('Failed to delete album');
    }
  }

  static async getUserProfile(userId) {
    try {
      const userProfileRef = doc(db, 'userProfiles', userId);
      const docSnap = await getDoc(userProfileRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }
}

