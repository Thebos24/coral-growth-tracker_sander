import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import UserProfile from './UserProfile';
import PlaceholderCard from './PlaceholderCard';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const getAlbumCover = (photos) => {
  if (photos.length > 0) {
    return photos[0].url;
  }
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f0f9ff"/>
      <g fill="none" stroke="#90caf9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M200,250 C200,220 200,190 200,160" />
        <path d="M200,250 C180,220 170,190 160,160" />
        <path d="M200,160 C190,140 180,120 170,100" />
        <path d="M200,250 C220,220 230,190 240,160" />
        <path d="M200,160 C210,140 220,120 230,100" />
      </g>
      <text x="200" y="280" fill="#90caf9" font-size="20" text-anchor="middle" font-family="Arial, sans-serif">
        Empty Album
      </text>
    </svg>
  `)}`;
};

const AlbumGrid = ({ albums, onAlbumClick, onDeleteAlbum, onCreateAlbum, onSignOut, userProfile }) => {
  const [albumToDelete, setAlbumToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e, albumName) => {
    e.stopPropagation();
    setAlbumToDelete(albumName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (albumToDelete) {
      await onDeleteAlbum(albumToDelete);
      setDeleteDialogOpen(false);
      setAlbumToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAlbumToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography 
          variant="h5" 
          sx={{ color: 'primary.main' }}
        >
          Coral Growth Tracker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <UserProfile userProfile={userProfile} onSignOut={onSignOut} />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Create Album Card */}
        <Grid item xs={12} sm={6} md={4}>
          <PlaceholderCard onClick={onCreateAlbum} type="album" />
        </Grid>

        {/* Existing Albums */}
        {Object.entries(albums).map(([name, photos]) => (
          <Grid item xs={12} sm={6} md={4} key={name}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.02)' },
                minHeight: { xs: 200, sm: 300 }  // Adjust height for mobile
              }}
              onClick={() => onAlbumClick(name)}
            >
              <CardMedia
                component="img"
                height="200"
                image={getAlbumCover(photos)}
                alt={name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date(Math.max(...photos.map(p => new Date(p.date)))).toLocaleDateString()}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={(e) => handleDeleteClick(e, name)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        albumName={albumToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
};

export default AlbumGrid;