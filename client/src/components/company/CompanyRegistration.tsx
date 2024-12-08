import React, { useState } from 'react';
import {
  Box,
  Card,
  Grid,
  TextField,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { companyApi } from '../../services/api';

const steps = ['Company Information', 'Verification', 'Review'];

const validationSchema = Yup.object({
  companyName: Yup.string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters'),
  contactName: Yup.string()
    .required('Contact person name is required')
    .min(2, 'Contact name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .required('Phone number is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

const CompanyRegistration: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  const formik = useFormik({
    initialValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Register company
        await companyApi.register(values);
        
        // Send verification code
        await companyApi.sendVerificationCode({
          method: verificationMethod,
          destination: verificationMethod === 'email' ? values.email : values.phone,
        });
        
        setVerificationDialogOpen(true);
        startVerificationTimer();
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const startVerificationTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const handleVerificationSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      await companyApi.verifyCode({
        code: verificationCode,
        method: verificationMethod,
        destination: verificationMethod === 'email' ? formik.values.email : formik.values.phone,
      });

      setSuccess(true);
      setVerificationDialogOpen(false);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      setError(null);

      await companyApi.sendVerificationCode({
        method: verificationMethod,
        destination: verificationMethod === 'email' ? formik.values.email : formik.values.phone,
      });

      setTimeLeft(900);
      startVerificationTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        Company Registration
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ p: 3 }}>
        {activeStep === 0 && (
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="companyName"
                  label="Company Name"
                  value={formik.values.companyName}
                  onChange={formik.handleChange}
                  error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                  helperText={formik.touched.companyName && formik.errors.companyName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="contactName"
                  label="Contact Person Name"
                  value={formik.values.contactName}
                  onChange={formik.handleChange}
                  error={formik.touched.contactName && Boolean(formik.errors.contactName)}
                  helperText={formik.touched.contactName && formik.errors.contactName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone Number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Registration Complete
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your registration is pending admin approval. You will be notified once your account is approved.
            </Typography>
            <Button
              variant="contained"
              href="/company/dashboard"
            >
              Go to Dashboard
            </Button>
          </Box>
        )}
      </Card>

      {/* Verification Dialog */}
      <Dialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verify Your Account</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ mb: 2 }}>
              Please enter the verification code sent to your {verificationMethod}:
              {verificationMethod === 'email' ? formik.values.email : formik.values.phone}
            </Typography>

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Time remaining: {formatTime(timeLeft)}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="text"
              disabled={timeLeft > 0}
              onClick={handleResendCode}
            >
              Resend Code
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleVerificationSubmit}
            disabled={loading || verificationCode.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyRegistration;
