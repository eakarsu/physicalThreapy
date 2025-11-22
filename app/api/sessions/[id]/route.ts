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
    const {
      patientId,
      therapistId,
      subjective,
      objective,
      assessment,
      plan,
    } = body;

    const updatedSession = await prisma.sessionNote.update({
      where: { id: params.id },
      data: {
        patientId,
        therapistId,
        subjective,
        objective,
        assessment,
        plan,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session note:', error);
    return NextResponse.json(
      { error: 'Failed to update session note' },
      { status: 500 }
    );
  }
}
