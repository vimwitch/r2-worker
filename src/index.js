export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    const list = await env.KEY_BUCKET.list({
      prefix: key,
    })
    if (list.objects.length > 1 && request.method === 'GET') {
      // treat as a directory and list it
      const headers = new Headers(corsHeaders)
      headers.set('content-type', 'application/json')
      return new Response(buildJsonFromList(list.objects, key), {
        headers,
      })
    }

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

function buildJsonFromList(list, prefix) {
  const items = list.map(item => {
    return {
      key: item.key.replace(prefix, ''),
      size: item.size,
      uploaded: +item.uploaded,
    }
  })
  return JSON.stringify({ items }, null, 2)
}
