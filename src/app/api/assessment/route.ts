import { NextResponse } from 'next/server';
import { calculateHealthMetrics } from '@/lib/assessment-calculator';
import { HealthAssessmentData } from '@/types';

export async function POST(req: Request) {
  try {
    const body: HealthAssessmentData = await req.json();

    if (!body.age || !body.heightCm || !body.weightKg) {
      return NextResponse.json(
        { error: 'Missing required biometric fields (age, heightCm, weightKg).' },
        { status: 400 }
      );
    }

    const metrics = calculateHealthMetrics(body);

    return NextResponse.json({
      success: true,
      data: {
        assessment: body,
        metrics,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal calculation error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
