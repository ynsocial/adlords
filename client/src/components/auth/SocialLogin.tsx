import React from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import {
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const SocialLogin: React.FC = () => {
  const { loginWithGoogle, loginWithFacebook, loginWithLinkedIn } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
    } catch (error) {
      console.error('Facebook login failed:', error);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      await loginWithLinkedIn();
    } catch (error) {
      console.error('LinkedIn login failed:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Divider>
        <Typography variant="body2" color="text.secondary">
          OR CONTINUE WITH
        </Typography>
      </Divider>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{
            borderColor: '#DB4437',
            color: '#DB4437',
            '&:hover': {
              borderColor: '#DB4437',
              backgroundColor: 'rgba(219, 68, 55, 0.04)',
            },
          }}
        >
          Continue with Google
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<FacebookIcon />}
          onClick={handleFacebookLogin}
          sx={{
            borderColor: '#4267B2',
            color: '#4267B2',
            '&:hover': {
              borderColor: '#4267B2',
              backgroundColor: 'rgba(66, 103, 178, 0.04)',
            },
          }}
        >
          Continue with Facebook
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<LinkedInIcon />}
          onClick={handleLinkedInLogin}
          sx={{
            borderColor: '#0077B5',
            color: '#0077B5',
            '&:hover': {
              borderColor: '#0077B5',
              backgroundColor: 'rgba(0, 119, 181, 0.04)',
            },
          }}
        >
          Continue with LinkedIn
        </Button>
      </Box>
    </Box>
  );
};

export default SocialLogin;
