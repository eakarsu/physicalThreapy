'use client';

import { Box, Typography, Paper, Grid, TextField, Button, Stack, MenuItem, CircularProgress, Alert } from '@mui/material';
import { ArrowBack, Save, AutoAwesome } from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionEditProps {
  session: any;
  patients: any[];
  therapists: any[];
}

export function SessionEditContent({ session, patients, therapists }: SessionEditProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: session.patientId,
    therapistId: session.therapistId,
    subjective: session.subjective,
    objective: session.objective,
    assessment: session.assessment,
    plan: session.plan,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [observations, setObservations] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateSOAP = async () => {
    if (!chiefComplaint && !observations) {
      setAiError('Please enter chief complaint and/or observations to generate SOAP note');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const patient = patients.find(p => p.id === formData.patientId);
      const response = await fetch('/api/ai/soap-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientInfo: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
          chiefComplaint,
          observations,
          previousNotes: session.assessment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SOAP note');
      }

      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        subjective: data.subjective || prev.subjective,
        objective: data.objective || prev.objective,
        assessment: data.assessment || prev.assessment,
        plan: data.plan || prev.plan,
      }));
    } catch (error) {
      console.error('Error generating SOAP note:', error);
      setAiError('Failed to generate SOAP note. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update session note');
      }

      // Navigate back to session detail
      router.push(`/sessions/${session.id}`);
      router.refresh(); // Refresh server components
    } catch (error) {
      console.error('Error updating session note:', error);
      alert('Failed to update session note. Please try again.');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push(`/sessions/${session.id}`)} variant="outlined">Cancel</Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>Edit Session Note</Typography>
      </Stack>

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Patient" name="patientId" value={formData.patientId} onChange={handleChange} required>
                {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Therapist" name="therapistId" value={formData.therapistId} onChange={handleChange} required>
                {therapists.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>AI-Assisted SOAP Note Generation</Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Chief Complaint / Reason for Visit"
                    multiline
                    rows={2}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="What is the patient's main complaint or reason for today's visit?"
                  />
                  <TextField
                    fullWidth
                    label="Clinical Observations / Findings"
                    multiline
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Enter key observations, measurements, test results, or clinical findings..."
                  />
                  {aiError && (
                    <Alert severity="error" onClose={() => setAiError(null)}>
                      {aiError}
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={aiLoading ? <CircularProgress size={20} /> : <AutoAwesome />}
                    onClick={handleGenerateSOAP}
                    disabled={aiLoading}
                    fullWidth
                  >
                    {aiLoading ? 'Generating SOAP Note...' : 'Generate SOAP Note with AI'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    AI will generate professional SOAP note sections based on your inputs above. You can review and edit them below.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>SOAP Note</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Subjective" name="subjective" multiline rows={3} value={formData.subjective} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Objective" name="objective" multiline rows={3} value={formData.objective} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Assessment" name="assessment" multiline rows={3} value={formData.assessment} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Plan" name="plan" multiline rows={3} value={formData.plan} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => router.push(`/sessions/${session.id}`)}>Cancel</Button>
                <Button type="submit" variant="contained" startIcon={<Save />}>Save Changes</Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
