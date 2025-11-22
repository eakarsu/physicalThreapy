import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

async function getDashboardData(userId: string, userRole: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get today's appointments
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: today,
        lt: tomorrow,
      },
      ...(userRole === 'THERAPIST' ? { therapistId: userId } : {}),
    },
    include: {
      patient: true,
      therapist: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  // Get total and upcoming appointments
  const totalAppointments = await prisma.appointment.count();
  const upcomingAppointments = await prisma.appointment.count({
    where: {
      startTime: {
        gte: today,
      },
      status: 'SCHEDULED',
    },
  });

  // Get total patients
  const totalPatients = await prisma.patient.count();

  // Get recent patients (last 7 days)
  const recentPatients = await prisma.patient.count({
    where: {
      createdAt: {
        gte: weekAgo,
      },
    },
  });

  // Get session notes stats
  const totalSessionNotes = await prisma.sessionNote.count();
  const recentSessionNotes = await prisma.sessionNote.count({
    where: {
      createdAt: {
        gte: weekAgo,
      },
    },
  });

  // Get claims summary
  const claimsSummary = await prisma.claim.groupBy({
    by: ['status'],
    _count: true,
  });

  const totalClaims = await prisma.claim.count();
  const pendingClaims = await prisma.claim.count({
    where: {
      status: 'SUBMITTED',
    },
  });

  // Get message stats
  const totalMessages = await prisma.message.count();
  const unreadMessages = await prisma.message.count({
    where: {
      readAt: null,
    },
  });

  return {
    todayAppointments,
    totalAppointments,
    upcomingAppointments,
    totalPatients,
    recentPatients,
    totalSessionNotes,
    recentSessionNotes,
    claimsSummary,
    totalClaims,
    pendingClaims,
    totalMessages,
    unreadMessages,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const data = await getDashboardData(session.user.id, session.user.role);

  return (
    <DashboardLayout>
      <DashboardContent userName={session.user.name} data={data} />
    </DashboardLayout>
  );
}
