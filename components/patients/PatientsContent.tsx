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
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, Phone, Email, Edit, Visibility } from '@mui/icons-material';
import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  phone: string;
  email: string | null;
  primaryDiagnosis: string;
  _count: {
    appointments: number;
    sessionNotes: number;
  };
}

interface PatientsContentProps {
  patients: Patient[];
}

export function PatientsContent({ patients }: PatientsContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.primaryDiagnosis.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Patients</Typography>
        <Chip
          label={`${filteredPatients.length} Total Patients`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search patients by name, email, or diagnosis..."
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Age / Sex</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Primary Diagnosis</TableCell>
              <TableCell align="center">Appointments</TableCell>
              <TableCell align="center">Session Notes</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'No patients found matching your search.' : 'No patients yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getInitials(patient.firstName, patient.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {patient.id.slice(0, 8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getAge(patient.dateOfBirth)} yrs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {patient.sex === 'MALE' ? 'Male' : 'Female'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{patient.phone}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{patient.email}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={patient.primaryDiagnosis}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={patient._count.appointments}
                      size="small"
                      color={patient._count.appointments > 0 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={patient._count.sessionNotes}
                      size="small"
                      color={patient._count.sessionNotes > 0 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/patients/${patient.id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Patient">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => router.push(`/patients/${patient.id}/edit`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
