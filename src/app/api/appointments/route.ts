import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { providerId, date, time, patientId, agenda } = body;

    if (!providerId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing appointment details (providerId, date, time).' },
        { status: 400 }
      );
    }

    const newAppointment = {
      id: `apt_${Date.now()}`,
      providerId,
      patientId: patientId || 'usr_aarav_01',
      date,
      time,
      status: 'Confirmed',
      telehealthRoomId: `room_${Date.now()}`,
      agenda: agenda || 'General Sports Consultation',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Booking error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
