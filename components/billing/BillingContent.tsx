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
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, AttachMoney, TrendingUp, TrendingDown, PendingActions, Edit, Visibility } from '@mui/icons-material';
import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Claim {
  id: string;
  status: string;
  amountBilled: number;
  amountPaid: number;
  serviceDate: string;
  cptCodes: string[];
  icdCodes: string[];
  createdAt: string;
  updatedAt: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  therapist: {
    name: string;
  };
  policy: {
    policyNumber: string;
    payer: {
      name: string;
    };
  };
}

interface BillingContentProps {
  claims: Claim[];
}

export function BillingContent({ claims }: BillingContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredClaims = claims.filter((claim) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      claim.id.toLowerCase().includes(searchLower) ||
      claim.patient.firstName.toLowerCase().includes(searchLower) ||
      claim.patient.lastName.toLowerCase().includes(searchLower) ||
      claim.policy.payer.name.toLowerCase().includes(searchLower) ||
      claim.therapist.name.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getStatusColor = (status: string): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'SUBMITTED':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'DENIED':
        return 'error';
      case 'PAID':
        return 'primary';
      default:
        return 'default';
    }
  };

  const statusCounts = {
    ALL: claims.length,
    DRAFT: claims.filter(c => c.status === 'DRAFT').length,
    SUBMITTED: claims.filter(c => c.status === 'SUBMITTED').length,
    APPROVED: claims.filter(c => c.status === 'APPROVED').length,
    DENIED: claims.filter(c => c.status === 'DENIED').length,
    PAID: claims.filter(c => c.status === 'PAID').length,
  };

  // Calculate summary stats
  const totalAmount = claims.reduce((sum, claim) => sum + claim.amountBilled, 0);
  const totalPaid = claims.reduce((sum, claim) => sum + claim.amountPaid, 0);
  const totalPending = claims
    .filter(c => c.status === 'SUBMITTED')
    .reduce((sum, claim) => sum + claim.amountBilled, 0);
  const totalDenied = claims
    .filter(c => c.status === 'DENIED')
    .reduce((sum, claim) => sum + claim.amountBilled, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Billing & Claims</Typography>
        <Chip
          label={`${filteredClaims.length} Claims`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoney sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Billed
                  </Typography>
                  <Typography variant="h5">
                    ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Paid
                  </Typography>
                  <Typography variant="h5">
                    ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PendingActions sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h5">
                    ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingDown sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Denied
                  </Typography>
                  <Typography variant="h5">
                    ${totalDenied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by claim ID, patient name, or insurance payer..."
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
          <Tab label={`Draft (${statusCounts.DRAFT})`} value="DRAFT" />
          <Tab label={`Submitted (${statusCounts.SUBMITTED})`} value="SUBMITTED" />
          <Tab label={`Approved (${statusCounts.APPROVED})`} value="APPROVED" />
          <Tab label={`Paid (${statusCounts.PAID})`} value="PAID" />
          <Tab label={`Denied (${statusCounts.DENIED})`} value="DENIED" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Claim ID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Insurance Payer</TableCell>
              <TableCell>Service Date</TableCell>
              <TableCell>Codes</TableCell>
              <TableCell>Amount Billed</TableCell>
              <TableCell>Amount Paid</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">
                    {searchTerm || statusFilter !== 'ALL'
                      ? 'No claims found matching your criteria.'
                      : 'No claims yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredClaims.map((claim) => (
                <TableRow key={claim.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {claim.id.slice(0, 8)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {claim.therapist.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {getInitials(claim.patient.firstName, claim.patient.lastName)}
                      </Avatar>
                      <Typography variant="body2">
                        {claim.patient.firstName} {claim.patient.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {claim.policy.payer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Policy: {claim.policy.policyNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(claim.serviceDate), 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {claim.cptCodes.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          CPT: {claim.cptCodes.join(', ')}
                        </Typography>
                      )}
                      {claim.icdCodes.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          ICD: {claim.icdCodes.join(', ')}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ${claim.amountBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color={claim.amountPaid > 0 ? 'success.main' : 'text.secondary'}
                    >
                      ${claim.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={claim.status}
                      size="small"
                      color={getStatusColor(claim.status)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/billing/${claim.id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Claim">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => router.push(`/billing/${claim.id}/edit`)}
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
