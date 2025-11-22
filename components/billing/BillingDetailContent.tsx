'use client';

import { Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, Stack, Avatar, Divider, List, ListItem, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ArrowBack, Edit, AttachMoney, Person, CalendarMonth, ReceiptLong, Description } from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BillingDetailProps {
  claim: any;
}

export function BillingDetailContent({ claim }: BillingDetailProps) {
  const router = useRouter();
  const [justificationOpen, setJustificationOpen] = useState(false);
  const [justificationLoading, setJustificationLoading] = useState(false);
  const [justificationText, setJustificationText] = useState('');

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': return 'warning';
      case 'APPROVED': return 'success';
      case 'DENIED': return 'error';
      case 'PAID': return 'primary';
      default: return 'default';
    }
  };

  const handleGenerateJustification = async () => {
    setJustificationOpen(true);
    setJustificationLoading(true);
    setJustificationText('');

    try {
      const response = await fetch('/api/ai/claim-justification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim,
          patient: claim.patient,
          sessionNotes: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate justification');
      }

      const data = await response.json();
      setJustificationText(data.justification);
    } catch (error) {
      console.error('Error generating justification:', error);
      setJustificationText('Failed to generate claim justification. Please try again.');
    } finally {
      setJustificationLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/billing')} variant="outlined">Back to Billing</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<Description />} onClick={handleGenerateJustification} variant="outlined" color="info">
          AI Justification
        </Button>
        <Button startIcon={<Edit />} onClick={() => router.push(`/billing/${claim.id}/edit`)} variant="contained" color="secondary">Edit Claim</Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <AttachMoney sx={{ fontSize: 48, color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5">Claim Details</Typography>
                  <Typography variant="body2" color="text.secondary">ID: {claim.id.slice(0, 13)}</Typography>
                </Box>
                <Chip label={claim.status} color={getStatusColor(claim.status)} size="medium" />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Service Date</Typography>
                  <Typography variant="body1">{format(new Date(claim.serviceDate), 'MMM d, yyyy')}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Amount Billed</Typography>
                  <Typography variant="h6" color="primary.main">${claim.amountBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                  <Typography variant="h6" color={claim.amountPaid > 0 ? 'success.main' : 'text.secondary'}>
                    ${claim.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Balance</Typography>
                  <Typography variant="h6" color="error.main">
                    ${(claim.amountBilled - claim.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">CPT Codes</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    {claim.cptCodes.map((code: string) => <Chip key={code} label={code} size="small" />)}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">ICD Codes</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    {claim.icdCodes.map((code: string) => <Chip key={code} label={code} size="small" variant="outlined" />)}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Patient</Typography>
              <Stack spacing={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                    {claim.patient.firstName[0]}{claim.patient.lastName[0]}
                  </Avatar>
                  <Typography variant="body1">{claim.patient.firstName} {claim.patient.lastName}</Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={() => router.push(`/patients/${claim.patient.id}`)}>View Patient</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Insurance</Typography>
              <Typography variant="body2" fontWeight="bold">{claim.policy.payer.name}</Typography>
              <Typography variant="caption" color="text.secondary">Policy: {claim.policy.policyNumber}</Typography>
              {claim.policy.groupNumber && (
                <Typography variant="caption" color="text.secondary" display="block">Group: {claim.policy.groupNumber}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Created: {format(new Date(claim.createdAt), 'MMM d, yyyy')} • Updated: {format(new Date(claim.updatedAt), 'MMM d, yyyy')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Claim Justification Dialog */}
      <Dialog open={justificationOpen} onClose={() => setJustificationOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Description color="info" />
            <Typography variant="h6">AI Claim Justification</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {justificationLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generating claim justification for insurance review...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50' }} elevation={0}>
                <Typography variant="caption" color="text.secondary">
                  This justification can be included with insurance submissions to establish medical necessity.
                </Typography>
              </Paper>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {justificationText}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJustificationOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
