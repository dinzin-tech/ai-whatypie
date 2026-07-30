import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from "@/src/lib/server-api";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization');
    const { id } = await params;
    
    const response = await fetch(`${getBackendApiUrl()}/testimonial/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonial' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const formData = await request.formData();
    const token = request.headers.get('authorization');
    const { id } = await params;
    
    const response = await fetch(`${getBackendApiUrl()}/testimonial/${id}/update`, {
      method: 'PUT',
      headers: {
        ...(token && { 'Authorization': token }),
      },
      body: formData, // Send FormData directly
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}