import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await forgotPassword(values.email);
        setSuccess(true);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send reset email');
      } finally {
        setSubmitting(false);
      }
    },
  });

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
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>

        {success ? (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset instructions have been sent to your email.
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please check your email for further instructions.
            </Typography>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <MuiLink component="button" variant="body2">
                Return to Login
              </MuiLink>
            </Link>
          </Box>
        ) : (
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="body2" sx={{ mb: 3 }}>
              Enter your email address and we'll send you instructions to reset your
              password.
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              Send Reset Instructions
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <MuiLink component="button" variant="body2">
                  Remember your password? Sign in
                </MuiLink>
              </Link>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};
