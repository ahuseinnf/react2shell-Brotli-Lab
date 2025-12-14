// server.ts - Custom Next.js server with Brotli decompression (TypeScript)
import { createServer, IncomingMessage, ServerResponse } from 'http';
import next from 'next';
import { brotliDecompressSync } from 'zlib';
import { Readable } from 'stream';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Custom request class that properly handles decompressed body
class DecompressedRequest extends Readable {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  httpVersion: string;
  httpVersionMajor: number;
  httpVersionMinor: number;
  rawHeaders: string[];
  rawTrailers: string[];
  socket: any;
  connection: any;
  complete: boolean = true;
  
  private _decompressedBody: Buffer;
  private _bodyPushed: boolean = false;

  constructor(originalReq: IncomingMessage, decompressedBody: Buffer) {
    super();
    
    // Copy all properties from original request
    this.method = originalReq.method || 'POST';
    this.url = originalReq.url || '/';
    this.headers = { ...originalReq.headers };
    this.httpVersion = originalReq.httpVersion;
    this.httpVersionMajor = originalReq.httpVersionMajor;
    this.httpVersionMinor = originalReq.httpVersionMinor;
    this.rawHeaders = originalReq.rawHeaders;
    this.rawTrailers = originalReq.rawTrailers;
    this.socket = originalReq.socket;
    this.connection = originalReq.connection;
    
    // Update headers - remove encoding, set correct length
    delete this.headers['content-encoding'];
    this.headers['content-length'] = decompressedBody.length.toString();
    
    // Store decompressed body
    this._decompressedBody = decompressedBody;
  }
  
  _read(): void {
    if (!this._bodyPushed) {
      this.push(this._decompressedBody);
      this.push(null); // Signal end of stream
      this._bodyPushed = true;
    }
  }
}

app.prepare().then(() => {
  createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const contentEncoding = req.headers['content-encoding'];
      
      if (contentEncoding === 'br') {
        console.log('[Brotli] 🔥 Brotli request detected');
        console.log('[Brotli] URL:', req.url);
        console.log('[Brotli] Method:', req.method);
        console.log('[Brotli] Next-Action:', req.headers['next-action']);
        
        // Collect compressed body
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }
        const compressedBody = Buffer.concat(chunks);
        
        console.log('[Brotli] Compressed size:', compressedBody.length, 'bytes');
        
        // Decompress using Node.js zlib
        const decompressedBody = brotliDecompressSync(compressedBody);
        
        console.log('[Brotli] Decompressed size:', decompressedBody.length, 'bytes');
        console.log('[Brotli] ✅ Decompression successful');
        
        // Create new request with decompressed body
        const newReq = new DecompressedRequest(req, decompressedBody);
        
        console.log('[Brotli] Forwarding to Next.js Server Actions...');
        
        // Pass to Next.js handler (cast to any to bypass strict typing)
        await handle(newReq as any, res);
        
        console.log('[Brotli] Request completed\n');
        
      } else {
        // Pass through non-Brotli requests
        if (req.method === 'POST') {
          console.log(`[Server] ${req.method} ${req.url} (${contentEncoding || 'uncompressed'})`);
        }
        await handle(req, res);
      }
      
    } catch (err) {
      console.error('[Server] ❌ Error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Server error: ' + (err as Error).message);
      }
    }
  }).listen(port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  Next.js Custom Server - Brotli Decompression (TS)      ║
╚══════════════════════════════════════════════════════════╝

> Ready on http://${hostname}:${port}
> Environment: ${dev ? 'development' : 'production'}
> Brotli decompression: ENABLED ✅
> Runtime: Node.js (zlib)

Request flow:
  1. Client sends Brotli compressed payload
  2. Custom server decompresses with zlib
  3. Next.js processes Server Action
  4. Exploitation via CVE-2025-55182

Test with:
  python3 brotli-waf-bypass.py
  
Target: http://${hostname}:${port}/
`);
  });
});
