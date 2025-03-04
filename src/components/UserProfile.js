import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem,
  IconButton 
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const UserProfile = ({ userProfile, onSignOut }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onSignOut();
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: { xs: 1, sm: 2 },  // Tighter spacing on mobile
      fontSize: { xs: '0.875rem', sm: '1rem' }  // Smaller text on mobile
    }}>
      <Typography>{userProfile?.firstName || 'User'}</Typography>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar sx={{ width: 32, height: 32 }}>
          {userProfile?.firstName?.[0] || '?'}
        </Avatar>
      </IconButton>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'profile-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserProfile;