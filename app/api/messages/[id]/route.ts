import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, subject } = body;

    const updatedThread = await prisma.messageThread.update({
      where: { id: params.id },
      data: {
        patientId,
        subject,
      },
    });

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error('Error updating message thread:', error);
    return NextResponse.json(
      { error: 'Failed to update message thread' },
      { status: 500 }
    );
  }
}
