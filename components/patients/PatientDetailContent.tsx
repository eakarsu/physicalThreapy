'use client';

import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  Phone,
  Email,
  Home,
  CalendarMonth,
  LocalHospital,
  ContactEmergency,
  AutoAwesome,
  FitnessCenter,
  Timeline,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PatientDetailProps {
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
    createdAt: string;
    updatedAt: string;
    _count: {
      appointments: number;
      sessionNotes: number;
      insurancePolicies: number;
    };
    appointments: Array<{
      id: string;
      startTime: string;
      status: string;
      therapist: { name: string };
    }>;
    sessionNotes: Array<{
      id: string;
      createdAt: string;
      therapist: { name: string };
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    }>;
  };
}

export function PatientDetailContent({ patient }: PatientDetailProps) {
  const router = useRouter();
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [homePlanOpen, setHomePlanOpen] = useState(false);
  const [homePlanLoading, setHomePlanLoading] = useState(false);
  const [homePlanText, setHomePlanText] = useState('');
  const [progressSummaryOpen, setProgressSummaryOpen] = useState(false);
  const [progressSummaryLoading, setProgressSummaryLoading] = useState(false);
  const [progressSummaryText, setProgressSummaryText] = useState('');

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleGenerateAnalysis = async () => {
    setAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisText('');

    try {
      const sessionHistory = patient.sessionNotes
        .map((note) => {
          const parts = [];
          if (note.assessment) parts.push(`Assessment: ${note.assessment}`);
          if (note.objective) parts.push(`Objective: ${note.objective}`);
          return parts.join(' | ');
        })
        .filter(Boolean)
        .join('\n');

      const response = await fetch('/api/ai/progress-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: `${patient.firstName} ${patient.lastName}`,
          diagnosis: patient.primaryDiagnosis,
          sessionHistory: sessionHistory || 'No detailed session history available',
          initialEval: patient.medicalHistory || 'No initial evaluation data',
          currentStatus: `${patient._count.sessionNotes} sessions completed, ${patient._count.appointments} total appointments`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate progress analysis');
      }

      const data = await response.json();
      setAnalysisText(data.analysis);
    } catch (error) {
      console.error('Error generating progress analysis:', error);
      setAnalysisText('Failed to generate progress analysis. Please try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGenerateHomePlan = async () => {
    setHomePlanOpen(true);
    setHomePlanLoading(true);
    setHomePlanText('');

    try {
      const response = await fetch('/api/ai/home-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosis: patient.primaryDiagnosis,
          bodyRegion: patient.primaryDiagnosis.split(' ')[0], // Extract body region from diagnosis
          goals: 'Improve strength, ROM, and function',
          equipment: 'Minimal equipment (resistance bands, household items)',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate home exercise plan');
      }

      const data = await response.json();
      setHomePlanText(data.exercisePlan);
    } catch (error) {
      console.error('Error generating home plan:', error);
      setHomePlanText('Failed to generate home exercise plan. Please try again.');
    } finally {
      setHomePlanLoading(false);
    }
  };

  const handleGenerateProgressSummary = async () => {
    setProgressSummaryOpen(true);
    setProgressSummaryLoading(true);
    setProgressSummaryText('');

    try {
      // For now, create mock metrics. In production, you'd fetch actual patient metrics
      const mockMetrics = [
        {
          type: 'ROM',
          label: 'Knee Flexion',
          valueNumeric: 120,
          unit: 'degrees',
          measuredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: 'ROM',
          label: 'Knee Flexion',
          valueNumeric: 135,
          unit: 'degrees',
          measuredAt: new Date().toISOString(),
        },
      ];

      const response = await fetch('/api/ai/progress-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient: {
            firstName: patient.firstName,
            lastName: patient.lastName,
            primaryDiagnosis: patient.primaryDiagnosis,
          },
          metrics: mockMetrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate progress summary');
      }

      const data = await response.json();
      setProgressSummaryText(data.progressSummary);
    } catch (error) {
      console.error('Error generating progress summary:', error);
      setProgressSummaryText('Failed to generate progress summary. Please try again.');
    } finally {
      setProgressSummaryLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/patients')}
          variant="outlined"
        >
          Back to Patients
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<FitnessCenter />}
          onClick={handleGenerateHomePlan}
          variant="outlined"
          color="info"
        >
          AI Home Plan
        </Button>
        <Button
          startIcon={<Timeline />}
          onClick={handleGenerateProgressSummary}
          variant="outlined"
          color="success"
        >
          AI Progress Summary
        </Button>
        <Button
          startIcon={<AutoAwesome />}
          onClick={handleGenerateAnalysis}
          variant="outlined"
          color="secondary"
        >
          AI Progress Analysis
        </Button>
        <Button
          startIcon={<Edit />}
          onClick={() => router.push(`/patients/${patient.id}/edit`)}
          variant="contained"
          color="secondary"
        >
          Edit Patient
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Patient Overview */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {getInitials(patient.firstName, patient.lastName)}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {patient.firstName} {patient.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {getAge(patient.dateOfBirth)} years old • {patient.sex === 'MALE' ? 'Male' : 'Female'}
              </Typography>
              <Chip
                label={patient.primaryDiagnosis}
                color="primary"
                sx={{ mt: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="h6">{patient._count.appointments}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Appointments
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="h6">{patient._count.sessionNotes}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sessions
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="h6">{patient._count.insurancePolicies}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Policies
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Phone fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2">{patient.phone}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Email fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2">{patient.email || 'N/A'}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Home fontSize="small" color="action" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body2">{patient.address || 'N/A'}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Person fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body2">{patient.emergencyContactName}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ContactEmergency fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2">{patient.emergencyContactPhone}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocalHospital fontSize="small" color="action" sx={{ mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Medical History
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {patient.medicalHistory || 'No medical history recorded.'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Appointments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Appointments
              </Typography>
              {patient.appointments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No appointments yet
                </Typography>
              ) : (
                <List dense>
                  {patient.appointments.map((apt) => (
                    <ListItem key={apt.id} divider>
                      <ListItemText
                        primary={format(new Date(apt.startTime), 'MMM d, yyyy h:mm a')}
                        secondary={`${apt.therapist.name} • ${apt.status}`}
                      />
                      <Chip label={apt.status} size="small" />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Session Notes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Session Notes
              </Typography>
              {patient.sessionNotes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No session notes yet
                </Typography>
              ) : (
                <List dense>
                  {patient.sessionNotes.map((note) => (
                    <ListItem key={note.id} divider>
                      <ListItemText
                        primary={format(new Date(note.createdAt), 'MMM d, yyyy')}
                        secondary={note.therapist.name}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Metadata */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Patient ID: {patient.id} • Created: {format(new Date(patient.createdAt), 'MMM d, yyyy')} •
              Last Updated: {format(new Date(patient.updatedAt), 'MMM d, yyyy')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Home Plan Dialog */}
      <Dialog open={homePlanOpen} onClose={() => setHomePlanOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <FitnessCenter color="info" />
            <Typography variant="h6">AI Home Exercise Plan</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {homePlanLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generating personalized home exercise plan...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50' }} elevation={0}>
                <Typography variant="caption" color="text.secondary">
                  This plan can be printed and given to the patient for home exercises.
                </Typography>
              </Paper>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {homePlanText}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHomePlanOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* AI Progress Summary Dialog */}
      <Dialog open={progressSummaryOpen} onClose={() => setProgressSummaryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Timeline color="success" />
            <Typography variant="h6">AI Progress Summary</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {progressSummaryLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generating patient-friendly progress summary...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.50' }} elevation={0}>
                <Typography variant="caption" color="text.secondary">
                  This summary can be shared with the patient to help them understand their progress.
                </Typography>
              </Paper>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {progressSummaryText}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressSummaryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* AI Progress Analysis Dialog */}
      <Dialog open={analysisOpen} onClose={() => setAnalysisOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesome color="secondary" />
            <Typography variant="h6">AI Progress Analysis</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {analysisLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Analyzing patient progress...
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {analysisText}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
