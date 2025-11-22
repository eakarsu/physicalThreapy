'use client';

import { Box, Typography, Paper, Grid, TextField, Button, Stack, MenuItem, CircularProgress, Alert, Divider } from '@mui/material';
import { ArrowBack, Save, AutoAwesome, Description } from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BillingEditProps {
  claim: any;
  patients: any[];
  therapists: any[];
  policies: any[];
}

export function BillingEditContent({ claim, patients, therapists, policies }: BillingEditProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: claim.patientId,
    therapistId: claim.therapistId,
    policyId: claim.policyId,
    status: claim.status,
    serviceDate: claim.serviceDate,
    amountBilled: claim.amountBilled.toString(),
    amountPaid: claim.amountPaid.toString(),
    cptCodes: claim.cptCodes.join(', '),
    icdCodes: claim.icdCodes.join(', '),
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [justificationText, setJustificationText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCodeSuggestions = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      const patient = patients.find(p => p.id === formData.patientId);
      const response = await fetch('/api/ai/code-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosis: patient?.primaryDiagnosis || 'Unknown',
          procedures: 'Physical therapy session',
          sessionNotes: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get code suggestions');
      }

      const data = await response.json();

      if (data.icdCodes && data.icdCodes.length > 0) {
        setFormData(prev => ({ ...prev, icdCodes: data.icdCodes.join(', ') }));
      }
      if (data.cptCodes && data.cptCodes.length > 0) {
        setFormData(prev => ({ ...prev, cptCodes: data.cptCodes.join(', ') }));
      }

      setAiSuccess('Code suggestions applied! Review and edit as needed.');
    } catch (error) {
      console.error('Error getting code suggestions:', error);
      setAiError('Failed to get code suggestions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateJustification = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const patient = patients.find(p => p.id === formData.patientId);
      const response = await fetch('/api/ai/claim-justification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosis: patient?.primaryDiagnosis || 'Unknown',
          cptCodes: formData.cptCodes,
          icdCodes: formData.icdCodes,
          sessionNotes: '',
          functionalLimitations: patient?.medicalHistory || 'Not specified',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate justification');
      }

      const data = await response.json();
      setJustificationText(data.justification);
    } catch (error) {
      console.error('Error generating justification:', error);
      setAiError('Failed to generate claim justification. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/billing/${claim.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update claim');
      }

      // Navigate back to claim detail
      router.push(`/billing/${claim.id}`);
      router.refresh(); // Refresh server components
    } catch (error) {
      console.error('Error updating claim:', error);
      alert('Failed to update claim. Please try again.');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push(`/billing/${claim.id}`)} variant="outlined">Cancel</Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>Edit Claim</Typography>
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
              <TextField fullWidth select label="Insurance Policy" name="policyId" value={formData.policyId} onChange={handleChange} required>
                {policies.map((pol) => (
                  <MenuItem key={pol.id} value={pol.id}>
                    {pol.payer.name} - {pol.patient.firstName} {pol.patient.lastName} ({pol.policyNumber})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="date" label="Service Date" name="serviceDate" value={formData.serviceDate} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Amount Billed" name="amountBilled" value={formData.amountBilled} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Amount Paid" name="amountPaid" value={formData.amountPaid} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange} required>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="SUBMITTED">Submitted</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="DENIED">Denied</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>AI Billing Assistant</Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'secondary.50' }}>
                <Stack spacing={2}>
                  {aiError && (
                    <Alert severity="error" onClose={() => setAiError(null)}>
                      {aiError}
                    </Alert>
                  )}
                  {aiSuccess && (
                    <Alert severity="success" onClose={() => setAiSuccess(null)}>
                      {aiSuccess}
                    </Alert>
                  )}
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={aiLoading ? <CircularProgress size={20} /> : <AutoAwesome />}
                    onClick={handleCodeSuggestions}
                    disabled={aiLoading}
                    fullWidth
                  >
                    {aiLoading ? 'Getting Suggestions...' : 'Suggest CPT/ICD Codes with AI'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    AI will suggest appropriate billing codes based on patient diagnosis and procedures
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="CPT Codes" name="cptCodes" value={formData.cptCodes} onChange={handleChange} helperText="Comma-separated" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="ICD Codes" name="icdCodes" value={formData.icdCodes} onChange={handleChange} helperText="Comma-separated" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Claim Justification</Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50' }}>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={aiLoading ? <CircularProgress size={20} /> : <Description />}
                    onClick={handleGenerateJustification}
                    disabled={aiLoading || !formData.cptCodes || !formData.icdCodes}
                    fullWidth
                  >
                    {aiLoading ? 'Generating...' : 'Generate Claim Justification with AI'}
                  </Button>
                  {justificationText && (
                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }} elevation={0} variant="outlined">
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {justificationText}
                      </Typography>
                    </Paper>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    AI will generate a professional medical necessity justification for insurance review
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => router.push(`/billing/${claim.id}`)}>Cancel</Button>
                <Button type="submit" variant="contained" startIcon={<Save />}>Save Changes</Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
