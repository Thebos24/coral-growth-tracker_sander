// src/services/firebase-db.js
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class FirebaseService {
  static async uploadImage(file) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to upload images');
      }

      const filename = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `photos/${user.uid}/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      console.log('Image uploaded successfully:', url);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
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
      const userProfileRef = doc(db, 'userProfiles', userCredential.user.uid);
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
      const docRef = doc(db, 'albums', userId);
      await setDoc(docRef, { albums });
      console.log('Albums saved to Firestore');
    } catch (error) {
      console.error('Error saving albums to Firestore:', error);
      throw error;
    }
  }

  static async loadAlbums(userId) {
    try {
      const docRef = doc(db, 'albums', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data().albums : {};
    } catch (error) {
      throw new Error('Error loading albums');
    }
  }

  static async deleteImage(imageUrl) {
    try {
      // Create reference from the full URL
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log('Image deleted from storage:', imageUrl);
    } catch (error) {
      console.error('Error deleting image from storage:', error);
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

