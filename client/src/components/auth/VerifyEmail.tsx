import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Button,
  Link,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          setStatus('error');
          setMessage('Verification token is missing');
          return;
        }

        await verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Email verified successfully. Please log in.' },
          });
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };

    verifyToken();
  }, [token, verifyEmail, navigate]);

  const handleResendVerification = async () => {
    try {
      await resendVerification(email);
      setMessage('Verification email has been resent. Please check your inbox.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to resend verification email');
    }
  };

  if (status === 'loading') {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying your email...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Alert severity={status === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>

        {status === 'success' ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Redirecting you to login page...
            </Typography>
            <Link component={RouterLink} to="/login">
              Click here if you're not redirected automatically
            </Link>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              If you need a new verification link, please enter your email address:
            </Typography>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleResendVerification();
              }}
              sx={{ mt: 1 }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 1, mb: 2 }}
              >
                Resend Verification Email
              </Button>
            </Box>
            <Link component={RouterLink} to="/login">
              Back to Login
            </Link>
          </Box>
        )}
      </Box>
    </Container>
  );
};
