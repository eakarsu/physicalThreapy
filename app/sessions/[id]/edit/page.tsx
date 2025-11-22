import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SessionEditContent } from '@/components/sessions/SessionEditContent';
import { prisma } from '@/lib/prisma';

async function getSessionForEdit(id: string) {
  const session = await prisma.sessionNote.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      therapistId: true,
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    },
  });

  if (!session) return null;

  const patients = await prisma.patient.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: 'asc' },
  });

  const therapists = await prisma.user.findMany({
    where: { role: 'THERAPIST' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return { session, patients, therapists };
}

export default async function SessionEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getSessionForEdit(params.id);
  if (!data) notFound();

  return (
    <DashboardLayout>
      <SessionEditContent session={data.session} patients={data.patients} therapists={data.therapists} />
    </DashboardLayout>
  );
}
