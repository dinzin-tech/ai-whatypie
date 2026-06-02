import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: planId } = await params;
    
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }    
    const response = await fetch(`${getBackendApiUrl()}/plan/${planId}`, {
      headers,
    });

    const data = await response.json();
    
    // Check if the response indicates not found
    if (!response.ok && response.status === 404) {
      console.error(`Plan not found with ID: ${planId}`);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: planId } = await params;
    
    const body = await request.json();
    const token = request.headers.get('authorization');
    
    const response = await fetch(`${getBackendApiUrl()}/plan/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

