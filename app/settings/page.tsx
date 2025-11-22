import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SettingsContent } from '@/components/settings/SettingsContent';
import { prisma } from '@/lib/prisma';

async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get user stats
  const stats = {
    appointments: await prisma.appointment.count({
      where: { therapistId: userId },
    }),
    sessionNotes: await prisma.sessionNote.count({
      where: { therapistId: userId },
    }),
    claims: await prisma.claim.count({
      where: { therapistId: userId },
    }),
    sentMessages: await prisma.message.count({
      where: { senderUserId: userId },
    }),
  };

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
    stats,
  };
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const { user, stats } = await getUserSettings(session.user.id);

  return (
    <DashboardLayout>
      <SettingsContent user={user} stats={stats} />
    </DashboardLayout>
  );
}
