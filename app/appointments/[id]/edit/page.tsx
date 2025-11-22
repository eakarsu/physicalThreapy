import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppointmentEditContent } from '@/components/appointments/AppointmentEditContent';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

async function getAppointmentForEdit(id: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      therapistId: true,
      startTime: true,
      endTime: true,
      status: true,
      notes: true,
    },
  });

  if (!appointment) {
    return null;
  }

  // Get all patients and therapists for dropdowns
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: {
      lastName: 'asc',
    },
  });

  const therapists = await prisma.user.findMany({
    where: {
      role: 'THERAPIST',
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return {
    appointment: {
      ...appointment,
      startTime: appointment.startTime.toISOString().slice(0, 16), // Format for datetime-local input
      endTime: appointment.endTime.toISOString().slice(0, 16),
    },
    patients,
    therapists,
  };
}

export default async function AppointmentEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const data = await getAppointmentForEdit(params.id);

  if (!data) {
    notFound();
  }

  return (
    <DashboardLayout>
      <AppointmentEditContent
        appointment={data.appointment}
        patients={data.patients}
        therapists={data.therapists}
      />
    </DashboardLayout>
  );
}
