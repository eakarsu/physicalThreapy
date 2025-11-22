'use client';

import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, Person, CalendarMonth, FitnessCenter, Edit, Visibility } from '@mui/icons-material';
import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface SessionNote {
  id: string;
  sessionDate: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    primaryDiagnosis: string;
  };
  therapist: {
    name: string;
  };
  _count: {
    sessionExercises: number;
  };
}

interface SessionsContentProps {
  sessions: SessionNote[];
}

export function SessionsContent({ sessions }: SessionsContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      session.patient.firstName.toLowerCase().includes(searchLower) ||
      session.patient.lastName.toLowerCase().includes(searchLower) ||
      session.therapist.name.toLowerCase().includes(searchLower) ||
      session.patient.primaryDiagnosis.toLowerCase().includes(searchLower) ||
      session.subjective.toLowerCase().includes(searchLower) ||
      session.assessment.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Session Notes</Typography>
        <Chip
          label={`${filteredSessions.length} Session Notes`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by patient, therapist, diagnosis, or note content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {filteredSessions.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {searchTerm
              ? 'No session notes found matching your search.'
              : 'No session notes yet.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSessions.map((session) => (
            <Grid size={{ xs: 12 }} key={session.id}>
              <Card sx={{ '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.3s' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {getInitials(session.patient.firstName, session.patient.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {session.patient.firstName} {session.patient.lastName}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {session.therapist.name}
                          </Typography>
                          <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary', ml: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(session.sessionDate), 'MMM d, yyyy')}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={session.patient.primaryDiagnosis}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                      <Chip
                        icon={<FitnessCenter />}
                        label={`${session._count.sessionExercises} exercises`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Subjective (S)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {session.subjective}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Objective (O)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {session.objective}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="warning.main" gutterBottom>
                        Assessment (A)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {session.assessment}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="error.main" gutterBottom>
                        Plan (P)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {session.plan}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Note ID: {session.id.slice(0, 8)} • Created: {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/sessions/${session.id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Session Note">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => router.push(`/sessions/${session.id}/edit`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
