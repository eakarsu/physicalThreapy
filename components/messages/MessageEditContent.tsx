'use client';

import { Box, Typography, Paper, Grid, TextField, Button, Stack, MenuItem } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MessageEditProps {
  thread: {
    id: string;
    patientId: string;
    subject: string;
  };
  patients: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
}

export function MessageEditContent({ thread, patients }: MessageEditProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: thread.patientId,
    subject: thread.subject,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/messages/${thread.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update message thread');
      }

      // Navigate back to messages
      router.push('/messages');
      router.refresh(); // Refresh server components
    } catch (error) {
      console.error('Error updating message thread:', error);
      alert('Failed to update message thread. Please try again.');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/messages')} variant="outlined">
          Cancel
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Edit Message Thread
        </Typography>
      </Stack>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
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

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                helperText="Describe the topic of this conversation"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => router.push('/messages')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" startIcon={<Save />}>
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
