export class NextRequest extends Request {
  nextUrl: URL;
  constructor(input: string | URL, init?: RequestInit) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    super(urlStr, init);
    this.nextUrl = new URL(urlStr);
  }
}

export class NextResponse extends Response {
  static json(body: any, init?: ResponseInit) {
    return new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers || {})
      }
    });
  }

  static redirect(url: string | URL, status: number = 307) {
    return new NextResponse(null, {
      status,
      headers: {
        'Location': typeof url === 'string' ? url : url.toString()
      }
    });
  }
}
