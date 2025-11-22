import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MessageEditContent } from '@/components/messages/MessageEditContent';
import { prisma } from '@/lib/prisma';

async function getThreadForEdit(id: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id },
    select: { id: true, patientId: true, subject: true },
  });

  if (!thread) return null;

  const patients = await prisma.patient.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: 'asc' },
  });

  return { thread, patients };
}

export default async function MessageEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getThreadForEdit(params.id);
  if (!data) notFound();

  return (
    <DashboardLayout>
      <MessageEditContent thread={data.thread} patients={data.patients} />
    </DashboardLayout>
  );
}
