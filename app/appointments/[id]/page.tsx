import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppointmentDetailContent } from '@/components/appointments/AppointmentDetailContent';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

async function getAppointmentDetail(id: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          primaryDiagnosis: true,
        },
      },
      therapist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sessionNotes: {
        select: {
          id: true,
          subjective: true,
          objective: true,
          assessment: true,
          plan: true,
          createdAt: true,
        },
      },
    },
  });

  if (!appointment) {
    return null;
  }

  return {
    ...appointment,
    startTime: appointment.startTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
    sessionNotes: appointment.sessionNotes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
    })),
  };
}

export default async function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const appointment = await getAppointmentDetail(params.id);

  if (!appointment) {
    notFound();
  }

  return (
    <DashboardLayout>
      <AppointmentDetailContent appointment={appointment} />
    </DashboardLayout>
  );
}
