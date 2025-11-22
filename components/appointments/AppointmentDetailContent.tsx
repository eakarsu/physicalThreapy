'use client';

import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  CalendarMonth,
  AccessTime,
  Phone,
  Email,
  LocalHospital,
  Description,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface AppointmentDetailProps {
  appointment: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string | null;
      primaryDiagnosis: string;
    };
    therapist: {
      id: string;
      name: string;
      email: string;
    };
    sessionNotes: Array<{
      id: string;
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
      createdAt: string;
    }>;
  };
}

export function AppointmentDetailContent({ appointment }: AppointmentDetailProps) {
  const router = useRouter();

  const getStatusColor = (status: string): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case 'SCHEDULED': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'NO_SHOW': return 'warning';
      default: return 'default';
    }
  };

  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/appointments')}
          variant="outlined"
        >
          Back to Appointments
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<Edit />}
          onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
          variant="contained"
          color="secondary"
        >
          Edit Appointment
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Appointment Overview */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <CalendarMonth sx={{ fontSize: 48, color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    Appointment Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(startTime, 'EEEE, MMMM d, yyyy')}
                  </Typography>
                </Box>
                <Chip
                  label={appointment.status}
                  color={getStatusColor(appointment.status)}
                  size="medium"
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Start Time
                      </Typography>
                      <Typography variant="body1">
                        {format(startTime, 'h:mm a')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        End Time
                      </Typography>
                      <Typography variant="body1">
                        {format(endTime, 'h:mm a')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonth color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1">
                        {duration} minutes
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {appointment.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Description color="action" sx={{ mt: 0.5 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {appointment.notes}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 1,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                    }}
                  >
                    {appointment.patient.firstName[0]}{appointment.patient.lastName[0]}
                  </Avatar>
                  <Typography variant="h6">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </Typography>
                  <Chip
                    label={appointment.patient.primaryDiagnosis}
                    size="small"
                    color="info"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider />

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{appointment.patient.phone}</Typography>
                  </Stack>
                  {appointment.patient.email && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{appointment.patient.email}</Typography>
                    </Stack>
                  )}
                </Stack>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push(`/patients/${appointment.patient.id}`)}
                >
                  View Patient Profile
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Therapist
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Person color="action" />
                  <Typography variant="body1">{appointment.therapist.name}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{appointment.therapist.email}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Notes */}
        {appointment.sessionNotes.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Notes
                </Typography>
                {appointment.sessionNotes.map((note) => (
                  <Paper key={note.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="primary">
                          Subjective
                        </Typography>
                        <Typography variant="body2">{note.subjective}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="success.main">
                          Objective
                        </Typography>
                        <Typography variant="body2">{note.objective}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="warning.main">
                          Assessment
                        </Typography>
                        <Typography variant="body2">{note.assessment}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="error.main">
                          Plan
                        </Typography>
                        <Typography variant="body2">{note.plan}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Metadata */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Appointment ID: {appointment.id} • Created: {format(new Date(appointment.createdAt), 'MMM d, yyyy')} •
              Last Updated: {format(new Date(appointment.updatedAt), 'MMM d, yyyy')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
