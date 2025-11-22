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
      policyId,
      status,
      serviceDate,
      amountBilled,
      amountPaid,
      cptCodes,
      icdCodes,
    } = body;

    const updatedClaim = await prisma.claim.update({
      where: { id: params.id },
      data: {
        patientId,
        therapistId,
        policyId,
        status,
        serviceDate: new Date(serviceDate),
        amountBilled: parseFloat(amountBilled),
        amountPaid: parseFloat(amountPaid),
        cptCodes: cptCodes.split(',').map((code: string) => code.trim()).filter(Boolean),
        icdCodes: icdCodes.split(',').map((code: string) => code.trim()).filter(Boolean),
      },
    });

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    );
  }
}
