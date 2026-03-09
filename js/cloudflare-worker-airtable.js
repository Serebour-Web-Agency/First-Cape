// Cloudflare Worker - Airtable Proxy
// This replaces your PHP proxy file
// Deploy this as a Cloudflare Worker

export default {
  async fetch(request, env) {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Your Airtable credentials (set in Worker environment variables)
      const AIRTABLE_API_KEY = env.AIRTABLE_API_KEY;
      const AIRTABLE_BASE_ID = env.AIRTABLE_BASE_ID;

      // Determine which table to query
      let tableName = 'Properties'; // default
      
      if (path.includes('/rentals')) {
        tableName = 'Rentals';
      } else if (path.includes('/alerts')) {
        tableName = 'Alerts';
      } else if (path.includes('/analytics')) {
        tableName = 'Analytics';
      }

      // Build Airtable API URL
      const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`;

      // Forward the request to Airtable
      const airtableResponse = await fetch(airtableUrl, {
        method: request.method,
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: request.method !== 'GET' ? await request.text() : null,
      });

      // Get response data
      const data = await airtableResponse.json();

      // Return with CORS headers
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
