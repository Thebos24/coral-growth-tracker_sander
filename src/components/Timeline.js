import React from 'react';
import { Box, Card, CardMedia, CardContent, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import LogoutIcon from '@mui/icons-material/Logout';
import PlaceholderCard from './PlaceholderCard';

const convertDate = (date) =>
    date && date.toDate ? date.toDate() : new Date(date);
  

const Timeline = ({ 
  albumName,
  photos,
  calculateDaysBetween,
  onDeletePhoto,
  onUploadPhotos,
  onBack,
  onSignOut,
  userProfile,
  userId,
  loading  // Add loading prop
}) => {
  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3,
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={onBack} 
            sx={{ 
              width: { xs: '40px', sm: 'auto' },
              height: { xs: '40px', sm: 'auto' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ flex: 1 }}>{albumName}</Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          justifyContent: { xs: 'flex-end', sm: 'flex-start' }
        }}>
          <IconButton 
            onClick={onUploadPhotos}
            sx={{
              width: { xs: '40px', sm: 'auto' },
              height: { xs: '40px', sm: 'auto' },
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <AddPhotoAlternateIcon />
          </IconButton>
          <IconButton 
            onClick={onSignOut}
            sx={{
              width: { xs: '40px', sm: 'auto' },
              height: { xs: '40px', sm: 'auto' },
              bgcolor: 'grey.500',
              color: 'white',
              '&:hover': { bgcolor: 'grey.700' }
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ 
        maxWidth: { 
          xs: '100%',
          sm: 800 
        },
        px: { xs: 2, sm: 0 },  // Add padding on mobile
        mx: 'auto'
      }}>
        {photos.length === 0 ? (
          <PlaceholderCard onClick={onUploadPhotos} type="photo" />
        ) : (
          <Box sx={{ 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 600,
            margin: '0 auto',
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.3s',
            pointerEvents: loading ? 'none' : 'auto'
          }}>
            {/* Vertical Timeline Line */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: 0,
                bottom: 0,
                width: '2px',
                bgcolor: 'primary.main',
                zIndex: 0
              }}
            />

            {photos.map((photo, index, array) => {
              console.log('Photo object:', {
                url: photo.url,
                type: typeof photo.url,
                photo
              });
              
              return (
                <Box
                  key={index}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    mb: index < photos.length - 1 ? 0 : 0 // Remove margin bottom
                  }}
                >
                  {/* Photo Card */}
                  <Card
                    elevation={2}
                    sx={{
                      width: '100%',
                      touchAction: 'pan-y',  // Enable vertical scrolling on touch devices
                      WebkitOverflowScrolling: 'touch',  // Smooth scrolling on iOS
                      maxWidth: 600,
                      zIndex: 1,
                      mb: 4 // Fixed space after card
                    }}
                  >
                    {/* Add delete button */}
                    <Box sx={{ position: 'relative' }}>
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                          zIndex: 2,
                        }}
                        onClick={() => onDeletePhoto(photo, index)}
                      >
                        <DeleteIcon sx={{ color: 'white' }} />
                      </IconButton>
                      <CardMedia
                        component="img"
                        image={photo.url}
                        alt={`Photo from ${photo.uploadedAt}`}
                        sx={{
                          height: { xs: 200, sm: 300 },
                          objectFit: 'contain',
                          maxWidth: '100%'
                        }}
                      />
                    </Box>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Date: {convertDate(photo.date).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Days Count and Connection Line */}
                  {index < photos.length - 1 && (
                    <Box 
                      sx={{
                        height: '80px', // Fixed height for connection space
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        mb: 4 // Fixed space after connection
                      }}
                    >
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          bgcolor: 'background.paper',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          zIndex: 1,
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {calculateDaysBetween(photo.date, convertDate(array[index + 1].date))} days
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Timeline;