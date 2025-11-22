import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppointmentsContent } from '@/components/appointments/AppointmentsContent';
import { prisma } from '@/lib/prisma';

async function getAppointments() {
  const appointments = await prisma.appointment.findMany({
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      notes: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
          primaryDiagnosis: true,
        },
      },
      therapist: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  });

  // Convert dates to strings for client component
  return appointments.map((apt) => ({
    ...apt,
    startTime: apt.startTime.toISOString(),
    endTime: apt.endTime.toISOString(),
  }));
}

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const appointments = await getAppointments();

  return (
    <DashboardLayout>
      <AppointmentsContent appointments={appointments} />
    </DashboardLayout>
  );
}
