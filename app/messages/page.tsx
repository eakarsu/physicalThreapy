import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MessagesContent } from '@/components/messages/MessagesContent';
import { prisma } from '@/lib/prisma';

async function getMessageThreads() {
  const threads = await prisma.messageThread.findMany({
    select: {
      id: true,
      subject: true,
      createdAt: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      createdBy: {
        select: {
          name: true,
        },
      },
      messages: {
        select: {
          id: true,
          content: true,
          sentAt: true,
          readAt: true,
          sender: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          sentAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert dates to strings for client component
  return threads.map((thread) => ({
    ...thread,
    createdAt: thread.createdAt.toISOString(),
    messages: thread.messages.map((msg) => ({
      ...msg,
      sentAt: msg.sentAt.toISOString(),
      readAt: msg.readAt ? msg.readAt.toISOString() : null,
    })),
  }));
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const threads = await getMessageThreads();

  return (
    <DashboardLayout>
      <MessagesContent threads={threads} />
    </DashboardLayout>
  );
}
