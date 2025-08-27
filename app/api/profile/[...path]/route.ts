import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> } // Add Promise wrapper
) {
  const resolvedParams = await params; // Await the params
  const path = resolvedParams.path.join('/');
  const targetUrl = `https://bahifinal.pythonanywhere.com/api/auth/${path}/`;

  try {
    // Get the JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value || 
                  cookieStore.get('jwt')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token missing' },
        { status: 401 }
      );
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from server' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> } // Add Promise wrapper
) {
  const resolvedParams = await params; // Await the params
  const path = resolvedParams.path.join('/');
  const targetUrl = `https://bahifinal.pythonanywhere.com/api/auth/${path}/`;
  
  try {
    const body = await request.json();
    
    // Get the JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value || 
                  cookieStore.get('jwt')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token missing' },
        { status: 401 }
      );
    }

    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Failed to update: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update data on server' },
      { status: 500 }
    );
  }
}