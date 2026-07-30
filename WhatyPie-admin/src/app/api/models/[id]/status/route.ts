/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const token = request.headers.get('authorization');
    
    const response = await fetch(`${getBackendApiUrl()}/ai/models/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error toggling AI model status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle AI model status', message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
