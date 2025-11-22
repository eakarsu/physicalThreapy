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
  ListItemIcon,
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  CalendarMonth,
  Description,
  AttachMoney,
  Message,
  LocalHospital,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface UserStats {
  appointments: number;
  sessionNotes: number;
  claims: number;
  sentMessages: number;
}

interface SettingsContentProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
  stats: UserStats;
}

export function SettingsContent({ user, stats }: SettingsContentProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string): "default" | "primary" | "success" | "error" | "warning" | "info" => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'THERAPIST':
        return 'success';
      case 'STAFF':
        return 'info';
      case 'PATIENT_PORTAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                }}
              >
                {getInitials(user.name)}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Chip
                label={user.role}
                color={getRoleBadgeColor(user.role)}
                size="small"
                sx={{ mt: 1 }}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="User ID"
                    secondary={user.id.slice(0, 13) + '...'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText primary="Email" secondary={user.email} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AdminPanelSettings />
                  </ListItemIcon>
                  <ListItemText primary="Role" secondary={user.role} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarMonth />
                  </ListItemIcon>
                  <ListItemText
                    primary="Joined"
                    secondary={format(new Date(user.createdAt), 'MMM d, yyyy')}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Stats */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Activity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Overview of your contributions to the system
              </Typography>

              <Grid container spacing={3}>
                {user.role === 'THERAPIST' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light' }}>
                        <CalendarMonth sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" color="primary.main">
                          {stats.appointments}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Appointments
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light' }}>
                        <Description sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4" color="success.main">
                          {stats.sessionNotes}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Session Notes Created
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light' }}>
                        <AttachMoney sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4" color="warning.main">
                          {stats.claims}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Claims Submitted
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light' }}>
                        <Message sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                        <Typography variant="h4" color="info.main">
                          {stats.sentMessages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Messages Sent
                        </Typography>
                      </Paper>
                    </Grid>
                  </>
                )}

                {user.role !== 'THERAPIST' && (
                  <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                      <LocalHospital sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Activity Stats
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Activity tracking is available for therapist accounts
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Additional settings and preferences coming soon
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Profile Management"
                    secondary="Update your personal information and password"
                  />
                  <Chip label="Coming Soon" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Notification Preferences"
                    secondary="Configure email and in-app notifications"
                  />
                  <Chip label="Coming Soon" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Security Settings"
                    secondary="Two-factor authentication and session management"
                  />
                  <Chip label="Coming Soon" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Theme Customization"
                    secondary="Choose your preferred color scheme"
                  />
                  <Chip label="Coming Soon" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
