'use client';

import { Box, Typography, Paper, Grid, Card, CardContent, Button, Stack, Divider, Avatar, Chip, List, ListItem, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ArrowBack, Edit, Person, CalendarMonth, FitnessCenter, AutoAwesome, Psychology, Description } from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SessionDetailProps {
  session: any;
}

export function SessionDetailContent({ session }: SessionDetailProps) {
  const router = useRouter();
  const [treatmentPlanOpen, setTreatmentPlanOpen] = useState(false);
  const [treatmentPlanLoading, setTreatmentPlanLoading] = useState(false);
  const [treatmentPlanText, setTreatmentPlanText] = useState('');
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false);
  const [sessionSummaryLoading, setSessionSummaryLoading] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [patientSummary, setPatientSummary] = useState('');

  const handleGenerateTreatmentPlan = async () => {
    setTreatmentPlanOpen(true);
    setTreatmentPlanLoading(true);
    setTreatmentPlanText('');

    try {
      const response = await fetch('/api/ai/treatment-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosis: session.patient.primaryDiagnosis,
          currentStatus: `Assessment: ${session.assessment}\nObjective Findings: ${session.objective}`,
          goals: `Plan: ${session.plan}`,
          limitations: session.patient.medicalHistory || 'None specified',
          sessionHistory: `Recent session - Subjective: ${session.subjective}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate treatment plan');
      }

      const data = await response.json();
      setTreatmentPlanText(data.recommendation);
    } catch (error) {
      console.error('Error generating treatment plan:', error);
      setTreatmentPlanText('Failed to generate treatment plan. Please try again.');
    } finally {
      setTreatmentPlanLoading(false);
    }
  };

  const handleGenerateSessionSummary = async () => {
    setSessionSummaryOpen(true);
    setSessionSummaryLoading(true);
    setClinicalSummary('');
    setPatientSummary('');

    try {
      const response = await fetch('/api/ai/session-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionNote: {
            subjective: session.subjective,
            objective: session.objective,
            assessment: session.assessment,
            plan: session.plan,
          },
          patient: {
            firstName: session.patient.firstName,
            lastName: session.patient.lastName,
            primaryDiagnosis: session.patient.primaryDiagnosis,
          },
          exercises: session.exercises || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate session summary');
      }

      const data = await response.json();
      setClinicalSummary(data.clinicalSummary);
      setPatientSummary(data.patientFriendlySummary);
    } catch (error) {
      console.error('Error generating session summary:', error);
      setClinicalSummary('Failed to generate session summary. Please try again.');
      setPatientSummary('');
    } finally {
      setSessionSummaryLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/sessions')} variant="outlined">
          Back to Sessions
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<Description />} onClick={handleGenerateSessionSummary} variant="outlined" color="info">
          AI Session Summary
        </Button>
        <Button startIcon={<Psychology />} onClick={handleGenerateTreatmentPlan} variant="outlined" color="secondary">
          AI Treatment Plan
        </Button>
        <Button startIcon={<Edit />} onClick={() => router.push(`/sessions/${session.id}/edit`)} variant="contained" color="secondary">
          Edit Session
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem' }}>
                {session.patient.firstName[0]}{session.patient.lastName[0]}
              </Avatar>
              <Typography variant="h6">{session.patient.firstName} {session.patient.lastName}</Typography>
              <Chip label={session.patient.primaryDiagnosis} color="primary" size="small" sx={{ mt: 1 }} />
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">{session.therapist.name}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <CalendarMonth fontSize="small" color="action" />
                  <Typography variant="body2">
                    {session.appointment ? format(new Date(session.appointment.startTime), 'MMM d, yyyy') : format(new Date(session.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <FitnessCenter fontSize="small" color="action" />
                  <Typography variant="body2">{session.sessionExercises.length} exercises</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">Subjective (S)</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{session.subjective}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">Objective (O)</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{session.objective}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">Assessment (A)</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{session.assessment}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">Plan (P)</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{session.plan}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {session.sessionExercises.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Exercises Prescribed</Typography>
                <List>
                  {session.sessionExercises.map((se: any) => (
                    <ListItem key={se.id} divider>
                      <ListItemText
                        primary={se.exercise.name}
                        secondary={
                          <>
                            {se.exercise.description}<br />
                            Sets: {se.sets} | Reps: {se.reps} | {se.exercise.bodyRegion} | {se.exercise.difficulty}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Session ID: {session.id} • Created: {format(new Date(session.createdAt), 'MMM d, yyyy')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Session Summary Dialog */}
      <Dialog open={sessionSummaryOpen} onClose={() => setSessionSummaryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Description color="info" />
            <Typography variant="h6">AI Session Summary</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {sessionSummaryLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generating session summaries...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }} elevation={0}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Clinical Summary
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  For clinical documentation and medical records
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {clinicalSummary}
                </Typography>
              </Paper>
              {patientSummary && (
                <Paper sx={{ p: 2, bgcolor: 'info.50' }} elevation={0}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Patient-Friendly Summary
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    For sharing with the patient
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {patientSummary}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionSummaryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* AI Treatment Plan Dialog */}
      <Dialog open={treatmentPlanOpen} onClose={() => setTreatmentPlanOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Psychology color="secondary" />
            <Typography variant="h6">AI Treatment Plan Recommendations</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {treatmentPlanLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generating treatment plan recommendations...
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {treatmentPlanText}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTreatmentPlanOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
