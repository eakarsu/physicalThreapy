'use client';

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, CalendarMonth, AccessTime, Edit, Visibility } from '@mui/icons-material';
import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  patient: {
    firstName: string;
    lastName: string;
    primaryDiagnosis: string;
  };
  therapist: {
    name: string;
  };
}

interface AppointmentsContentProps {
  appointments: Appointment[];
}

export function AppointmentsContent({ appointments }: AppointmentsContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredAppointments = appointments.filter((apt) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      apt.patient.firstName.toLowerCase().includes(searchLower) ||
      apt.patient.lastName.toLowerCase().includes(searchLower) ||
      apt.therapist.name.toLowerCase().includes(searchLower) ||
      apt.patient.primaryDiagnosis.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getStatusColor = (status: string): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case 'SCHEDULED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'NO_SHOW':
        return 'warning';
      default:
        return 'default';
    }
  };

  const statusCounts = {
    ALL: appointments.length,
    SCHEDULED: appointments.filter(a => a.status === 'SCHEDULED').length,
    COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
    CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
    NO_SHOW: appointments.filter(a => a.status === 'NO_SHOW').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Appointments</Typography>
        <Chip
          label={`${filteredAppointments.length} Appointments`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by patient name, therapist, or diagnosis..."
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

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => setStatusFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All (${statusCounts.ALL})`} value="ALL" />
          <Tab label={`Scheduled (${statusCounts.SCHEDULED})`} value="SCHEDULED" />
          <Tab label={`Completed (${statusCounts.COMPLETED})`} value="COMPLETED" />
          <Tab label={`Cancelled (${statusCounts.CANCELLED})`} value="CANCELLED" />
          <Tab label={`No Show (${statusCounts.NO_SHOW})`} value="NO_SHOW" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Therapist</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Diagnosis</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">
                    {searchTerm || statusFilter !== 'ALL'
                      ? 'No appointments found matching your criteria.'
                      : 'No appointments scheduled yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((apt) => {
                const startTime = new Date(apt.startTime);
                const endTime = new Date(apt.endTime);
                const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

                return (
                  <TableRow key={apt.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(apt.patient.firstName, apt.patient.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {apt.patient.firstName} {apt.patient.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {apt.id.slice(0, 8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{apt.therapist.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {format(startTime, 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{duration} min</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={apt.patient.primaryDiagnosis}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={apt.status}
                        size="small"
                        color={getStatusColor(apt.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => router.push(`/appointments/${apt.id}`)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Appointment">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => router.push(`/appointments/${apt.id}/edit`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
