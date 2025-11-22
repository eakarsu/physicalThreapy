import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SessionDetailContent } from '@/components/sessions/SessionDetailContent';
import { prisma } from '@/lib/prisma';

async function getSessionDetail(id: string) {
  const session = await prisma.sessionNote.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, primaryDiagnosis: true } },
      therapist: { select: { id: true, name: true, email: true } },
      appointment: { select: { id: true, startTime: true } },
      sessionExercises: {
        include: {
          exercise: { select: { name: true, description: true, bodyRegion: true, difficulty: true } },
        },
      },
    },
  });

  if (!session) return null;

  return {
    ...session,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    appointment: session.appointment ? {
      ...session.appointment,
      startTime: session.appointment.startTime.toISOString(),
    } : null,
    sessionExercises: session.sessionExercises.map(se => ({
      ...se,
      createdAt: se.createdAt.toISOString(),
      updatedAt: se.updatedAt.toISOString(),
    })),
  };
}

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const sessionNote = await getSessionDetail(params.id);
  if (!sessionNote) notFound();

  return (
    <DashboardLayout>
      <SessionDetailContent session={sessionNote} />
    </DashboardLayout>
  );
}
