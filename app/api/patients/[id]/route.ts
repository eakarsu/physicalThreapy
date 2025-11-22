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
      firstName,
      lastName,
      dateOfBirth,
      sex,
      phone,
      email,
      address,
      primaryDiagnosis,
      medicalHistory,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    const updatedPatient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        sex,
        phone,
        email: email || null,
        address: address || null,
        primaryDiagnosis,
        medicalHistory: medicalHistory || null,
        emergencyContactName,
        emergencyContactPhone,
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}
