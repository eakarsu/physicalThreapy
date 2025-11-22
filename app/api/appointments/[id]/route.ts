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
      startTime,
      endTime,
      status,
      notes,
    } = body;

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        patientId,
        therapistId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status,
        notes: notes || null,
      },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
