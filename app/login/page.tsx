'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LocalHospital sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom>
            PT Flow AI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Physical Therapy Practice Management
          </Typography>
        </Box>

        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Sign In
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Demo Credentials:
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                <strong>Admin:</strong> admin@ptflow.ai
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Therapist:</strong> therapist1@ptflow.ai
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                All passwords: <strong>password123</strong>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
