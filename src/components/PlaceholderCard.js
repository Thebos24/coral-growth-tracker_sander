import React from 'react';
import { Card, Typography } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';

const PlaceholderCard = ({ onClick, type = 'album' }) => {
  return (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
        '&:hover': { 
          transform: 'scale(1.02)',
          transition: 'transform 0.2s',
          bgcolor: 'action.selected'
        },
        minHeight: 300
      }}
    >
      {type === 'album' ? (
        <AddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
      ) : (
        <AddPhotoAlternateIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
      )}
      <Typography variant="h6" color="primary.main">
        {type === 'album' ? 'Create New Album' : 'Upload New Picture'}
      </Typography>
    </Card>
  );
};

export default PlaceholderCard;