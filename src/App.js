import React, { useState, useEffect } from 'react';
import EXIF from 'exif-js';
import { FirebaseService } from './services/firebase-db';
import { auth } from './firebase';
import Login from './components/Login';
import SignUp from './components/SignUp';
import AlbumGrid from './components/AlbumGrid';
import Timeline from './components/Timeline';
import {
  Container,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';

function App() {
  const [user, setUser] = useState(null);
  const [albums, setAlbums] = useState({});
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUser(null);
        setAlbums({});
        setSelectedAlbum(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await FirebaseService.signIn(email, password);
      setUser(userCredential);
      const savedAlbums = await FirebaseService.loadAlbums(userCredential.uid);
      setAlbums(savedAlbums || {});
    } catch (error) {
      setError(error.message);
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email, password, firstName) => {
    try {
      setLoading(true);
      setError(null);
      const { user, profile } = await FirebaseService.signUp(email, password, firstName);
      setUser(user);
      setUserProfile(profile);
      await FirebaseService.saveAlbums({}, user.uid);
    } catch (error) {
      setError(error.message);
      console.error('Sign up failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await FirebaseService.signOut();
      setUser(null);
      setAlbums({});
      setSelectedAlbum(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update the albums save effect to use userId
  useEffect(() => {
    if (!user) return;

    const saveAlbums = async () => {
      try {
        await FirebaseService.saveAlbums(albums, user.uid);
      } catch (error) {
        console.error('Error saving albums:', error);
      }
    };
    
    saveAlbums();
  }, [albums, user]);

  // Add effect to load user profile on auth
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      try {
        const profile = await FirebaseService.getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    loadUserProfile();
  }, [user]);

  const handleCreateAlbum = () => {
    const albumName = prompt("Enter album name:");
    if (!albumName) return;
    
    if (albums[albumName]) {
      alert('An album with this name already exists');
      return;
    }

    setAlbums(prev => ({
      ...prev,
      [albumName]: []
    }));
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
  };

  const getImageExifData = (file) => {
    return new Promise((resolve) => {
      EXIF.getData(file, function() {
        const exifDate = EXIF.getTag(this, "DateTimeOriginal");
        if (exifDate) {
          // Convert EXIF date format (YYYY:MM:DD HH:MM:SS) to ISO format
          const [date, time] = exifDate.split(' ');
          const [year, month, day] = date.split(':');
          resolve(`${year}-${month}-${day}T${time}`);
        } else {
          // If no EXIF date, use file's last modified date
          resolve(new Date(file.lastModified).toISOString());
        }
      });
    });
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true; // Enable multiple file selection
    input.accept = 'image/*';
    input.onchange = (e) => uploadPhotos(e);
    input.click();
  };

  const uploadPhotos = async (event) => {
    if (!selectedAlbum) return;
    
    try {
      setLoading(true);
      const files = Array.from(event.target.files);
      
      // Process all files in parallel
      const newPhotos = await Promise.all(
        files.map(async (file) => {
          try {
            const url = await FirebaseService.uploadImage(file);
            const date = await getImageExifData(file);
            
            return { 
              url,
              date,
              contentType: file.type,
              uploadedAt: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            return null;
          }
        })
      );

      // Filter out failed uploads and sort by date
      const validPhotos = newPhotos
        .filter(photo => photo !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (validPhotos.length > 0) {
        // Merge with existing photos and sort
        const updatedPhotos = [
          ...(albums[selectedAlbum] || []),
          ...validPhotos
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        const updatedAlbums = {
          ...albums,
          [selectedAlbum]: updatedPhotos
        };

        await FirebaseService.saveAlbums(updatedAlbums, user.uid);
        setAlbums(updatedAlbums);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error uploading photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photo, index) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete the image from Firebase Storage
      await FirebaseService.deleteImage(photo.url);
      
      // Update local state and Firestore
      const updatedAlbumPhotos = [...albums[selectedAlbum]];
      updatedAlbumPhotos.splice(index, 1);
      
      const updatedAlbums = {
        ...albums,
        [selectedAlbum]: updatedAlbumPhotos
      };

      // Save updated albums to Firestore
      await FirebaseService.saveAlbums(updatedAlbums, user.uid);
      
      // Update local state
      setAlbums(updatedAlbums);
      console.log('Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumName) => {
    try {
      setLoading(true);
      const updatedAlbums = await FirebaseService.deleteAlbum(albumName, user.uid);
      setAlbums(updatedAlbums);
    } catch (error) {
      console.error('Error deleting album:', error);
      setError('Failed to delete album');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysBetween = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sortPhotosByDate = (photos) => {
    return [...photos].sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const renderAlbumList = () => (
    <Box sx={{ mb: 4 }}>
      {Object.keys(albums).map((albumName) => (
        <Box
          key={albumName}
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            p: 2,
            bgcolor: selectedAlbum === albumName ? 'primary.light' : 'background.paper',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box
            onClick={() => setSelectedAlbum(albumName)}
            sx={{ flex: 1 }}
          >
            <Typography>{albumName}</Typography>
          </Box>
          <IconButton
            onClick={() => {
              setAlbumToDelete(albumName);
              setDeleteDialogOpen(true);
            }}
            sx={{
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.light',
              },
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
    </Box>
  );

  console.log('Current albums:', albums);
  console.log('Selected album:', selectedAlbum);
  console.log('Current photos:', selectedAlbum ? albums[selectedAlbum] : []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : !user ? (
        isSignUp ? (
          <SignUp 
            onSignUp={handleSignUp}
            onBackToLogin={() => setIsSignUp(false)}
            error={error}
          />
        ) : (
          <Login 
            onLogin={handleLogin}
            onSignUpClick={() => setIsSignUp(true)}
            error={error}
          />
        )
      ) : (
        selectedAlbum ? (
          <Timeline
            albumName={selectedAlbum}
            photos={sortPhotosByDate(albums[selectedAlbum] || [])}
            calculateDaysBetween={calculateDaysBetween}
            onDeletePhoto={handleDeletePhoto}
            onUploadPhotos={handleUpload}
            onBack={handleBackToAlbums}
            onSignOut={handleSignOut}
            userProfile={userProfile}
          />
        ) : (
          <AlbumGrid
            albums={albums}
            onAlbumClick={setSelectedAlbum}
            onDeleteAlbum={handleDeleteAlbum}
            onCreateAlbum={handleCreateAlbum}
            onSignOut={handleSignOut}
            userProfile={userProfile}
          />
        )
      )}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        albumName={albumToDelete}
        onConfirm={handleDeleteAlbum}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setAlbumToDelete(null);
        }}
      />
    </Container>
  );
}

export default App;
