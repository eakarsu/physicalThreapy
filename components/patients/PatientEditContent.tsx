'use client';

import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  MenuItem,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PatientEditProps {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    sex: string;
    phone: string;
    email: string | null;
    address: string | null;
    primaryDiagnosis: string;
    medicalHistory: string | null;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
}

export function PatientEditContent({ patient }: PatientEditProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    sex: patient.sex,
    phone: patient.phone,
    email: patient.email || '',
    address: patient.address || '',
    primaryDiagnosis: patient.primaryDiagnosis,
    medicalHistory: patient.medicalHistory || '',
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update patient');
      }

      // Navigate back to patient detail
      router.push(`/patients/${patient.id}`);
      router.refresh(); // Refresh server components
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Failed to update patient. Please try again.');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push(`/patients/${patient.id}`)}
          variant="outlined"
        >
          Cancel
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Edit Patient
        </Typography>
      </Stack>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={2}
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Medical Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Primary Diagnosis"
                name="primaryDiagnosis"
                value={formData.primaryDiagnosis}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Medical History"
                name="medicalHistory"
                multiline
                rows={4}
                value={formData.medicalHistory}
                onChange={handleChange}
                helperText="Include relevant medical conditions, surgeries, allergies, etc."
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Emergency Contact
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  color="primary"
                >
                  Save Changes
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
