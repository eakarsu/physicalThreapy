'use client';

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  CardActionArea,
} from '@mui/material';
import {
  People,
  CalendarMonth,
  TrendingUp,
  AttachMoney,
  Description,
  Message,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface DashboardData {
  todayAppointments: any[];
  totalAppointments: number;
  upcomingAppointments: number;
  totalPatients: number;
  recentPatients: number;
  totalSessionNotes: number;
  recentSessionNotes: number;
  claimsSummary: { status: string; _count: number }[];
  totalClaims: number;
  pendingClaims: number;
  totalMessages: number;
  unreadMessages: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  link: string;
}

const StatCard = ({ title, value, subtitle, icon, color, link }: StatCardProps) => {
  const router = useRouter();

  return (
    <Card>
      <CardActionArea onClick={() => router.push(link)}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            <Box sx={{ color }}>{icon}</Box>
          </Box>
          <Typography variant="h3" component="div" gutterBottom>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export function DashboardContent({
  userName,
  data,
}: {
  userName: string;
  data: DashboardData;
}) {
  const router = useRouter();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {userName}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Patients"
            value={data.totalPatients}
            subtitle={`+${data.recentPatients} this week`}
            icon={<People sx={{ fontSize: 40 }} />}
            color="primary.main"
            link="/patients"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Appointments"
            value={data.totalAppointments}
            subtitle={`${data.upcomingAppointments} upcoming`}
            icon={<CalendarMonth sx={{ fontSize: 40 }} />}
            color="success.main"
            link="/appointments"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Session Notes"
            value={data.totalSessionNotes}
            subtitle={`${data.recentSessionNotes} this week`}
            icon={<Description sx={{ fontSize: 40 }} />}
            color="info.main"
            link="/sessions"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Pending Claims"
            value={data.pendingClaims}
            subtitle={`${data.totalClaims} total claims`}
            icon={<AttachMoney sx={{ fontSize: 40 }} />}
            color="warning.main"
            link="/billing"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Messages"
            value={data.totalMessages}
            subtitle={`${data.unreadMessages} unread`}
            icon={<Message sx={{ fontSize: 40 }} />}
            color="secondary.main"
            link="/messages"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Today's Schedule"
            value={data.todayAppointments.length}
            subtitle={data.todayAppointments.length > 0 ? 'appointments today' : 'No appointments'}
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="error.main"
            link="/appointments"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Schedule
              </Typography>
              {data.todayAppointments.length > 0 ? (
                <List>
                  {data.todayAppointments.map((apt: any) => (
                    <ListItem
                      key={apt.id}
                      divider
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => router.push('/appointments')}
                    >
                      <ListItemText
                        primary={`${apt.patient.firstName} ${apt.patient.lastName}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {format(new Date(apt.startTime), 'h:mm a')} -{' '}
                              {format(new Date(apt.endTime), 'h:mm a')}
                            </Typography>
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{ ml: 2 }}
                            >
                              with {apt.therapist.name}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={apt.status}
                        size="small"
                        color={
                          apt.status === 'COMPLETED'
                            ? 'success'
                            : apt.status === 'SCHEDULED'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  No appointments scheduled for today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardActionArea onClick={() => router.push('/billing')}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Claims Status
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {data.claimsSummary.length > 0 ? (
                    data.claimsSummary.map((item) => (
                      <Box
                        key={item.status}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 2,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2">{item.status}</Typography>
                        <Chip
                          label={item._count}
                          size="small"
                          color={
                            item.status === 'APPROVED'
                              ? 'success'
                              : item.status === 'SUBMITTED'
                              ? 'warning'
                              : item.status === 'DENIED'
                              ? 'error'
                              : 'default'
                          }
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No claims yet
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
