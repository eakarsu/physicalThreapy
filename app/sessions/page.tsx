import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SessionsContent } from '@/components/sessions/SessionsContent';
import { prisma } from '@/lib/prisma';

async function getSessionNotes() {
  const sessions = await prisma.sessionNote.findMany({
    select: {
      id: true,
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
      createdAt: true,
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
      appointment: {
        select: {
          startTime: true,
        },
      },
      _count: {
        select: {
          sessionExercises: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert dates to strings for client component
  return sessions.map((session) => ({
    ...session,
    createdAt: session.createdAt.toISOString(),
    sessionDate: session.appointment?.startTime.toISOString() || session.createdAt.toISOString(),
  }));
}

export default async function SessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const sessions = await getSessionNotes();

  return (
    <DashboardLayout>
      <SessionsContent sessions={sessions} />
    </DashboardLayout>
  );
}
