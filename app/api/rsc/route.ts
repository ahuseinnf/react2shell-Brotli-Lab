import { NextRequest, NextResponse } from 'next/server';
import { brotliDecompressSync } from 'zlib';

// FORCE Node.js runtime (NOT Edge)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const contentEncoding = request.headers.get('content-encoding');
    const nextAction = request.headers.get('next-action');
    
    console.log('[Brotli Proxy] Received request');
    console.log('[Brotli Proxy] Content-Encoding:', contentEncoding);
    console.log('[Brotli Proxy] Next-Action:', nextAction);
    
    let bodyData: Buffer;
    
    // Decompress Brotli if needed
    if (contentEncoding === 'br') {
      console.log('[Brotli Proxy] Decompressing Brotli...');
      const compressedBody = await request.arrayBuffer();
      const compressedData = Buffer.from(compressedBody);
      console.log('[Brotli Proxy] Compressed size:', compressedData.length);
      
      // Decompress using Node.js zlib
      bodyData = brotliDecompressSync(compressedData);
      console.log('[Brotli Proxy] Decompressed size:', bodyData.length);
    } else {
      const rawBody = await request.arrayBuffer();
      bodyData = Buffer.from(rawBody);
    }
    
    // Forward to the actual Next.js Server Action handler
    const origin = request.nextUrl.origin;
    
    console.log('[Brotli Proxy] Forwarding to:', `${origin}/`);
    
    const response = await fetch(`${origin}/`, {
      method: 'POST',
      headers: {
        'Next-Action': nextAction || '',
        'Content-Type': request.headers.get('content-type') || 'text/plain;charset=UTF-8',
      },
      body: bodyData,
    });
    
    console.log('[Brotli Proxy] Response status:', response.status);
    
    const responseData = await response.arrayBuffer();
    
    return new NextResponse(responseData, {
      status: response.status,
      headers: response.headers,
    });
    
  } catch (error) {
    console.error('[Brotli Proxy] Error:', error);
    return new NextResponse('Proxy error: ' + String(error), { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }
}
