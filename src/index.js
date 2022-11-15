export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    switch (request.method) {
      case 'OPTIONS':
        return new Response('', { headers: corsHeaders })
      case 'GET':
        const object = await env.KEY_BUCKET.get(key);

        if (object === null) {
          return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
          headers,
        });

      default:
        return new Response('Method Not Allowed', {
          status: 405,
          headers: {
            Allow: 'GET, OPTIONS',
          },
        });
    }
  },
};

