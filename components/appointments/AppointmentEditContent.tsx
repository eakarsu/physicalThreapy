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

interface AppointmentEditProps {
  appointment: {
    id: string;
    patientId: string;
    therapistId: string;
    startTime: string;
    endTime: string;
    status: string;
    notes: string | null;
  };
  patients: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  therapists: Array<{
    id: string;
    name: string;
  }>;
}

export function AppointmentEditContent({ appointment, patients, therapists }: AppointmentEditProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: appointment.patientId,
    therapistId: appointment.therapistId,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    notes: appointment.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      // Navigate back to appointment detail
      router.push(`/appointments/${appointment.id}`);
      router.refresh(); // Refresh server components
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push(`/appointments/${appointment.id}`)}
          variant="outlined"
        >
          Cancel
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Edit Appointment
        </Typography>
      </Stack>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Appointment Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Patient"
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Therapist"
                name="therapistId"
                value={formData.therapistId}
                onChange={handleChange}
                required
              >
                {therapists.map((therapist) => (
                  <MenuItem key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Start Time"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="End Time"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="NO_SHOW">No Show</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                helperText="Add any additional notes or special instructions"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/appointments/${appointment.id}`)}
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
