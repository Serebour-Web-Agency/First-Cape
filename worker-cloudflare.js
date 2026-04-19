export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (!env.AIRTABLE_API_KEY || !env.AIRTABLE_BASE_ID) {
      return new Response(JSON.stringify({ error: 'Worker not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');

    if (request.method === 'POST') {
      let tableName;
      if (path.endsWith('/leads'))       tableName = 'Leads';
      else if (path.endsWith('/alerts')) tableName = 'Alerts';
      else return new Response(JSON.stringify({ error: 'Unknown POST endpoint' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

      let body;
      try { body = await request.json(); }
      catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }); }

      const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
      const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: body })
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'GET') {
      if (path.endsWith('/run-bot')) {
        await runNewsBot(env);
        return new Response(JSON.stringify({ ok: true, message: 'Bot ran' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let tableName;
      if (path.endsWith('/articles'))       tableName = 'Articles';
      else if (path.endsWith('/resources')) tableName = 'Resources';
      else                                  tableName = 'Properties';

      const airtableUrl = new URL(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`
      );
      url.searchParams.forEach((value, key) => {
        airtableUrl.searchParams.append(key, value);
      });

      const response = await fetch(airtableUrl.toString(), {
        headers: { 'Authorization': `Bearer ${env.AIRTABLE_API_KEY}` }
      });
      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Airtable error', details: data }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runNewsBot(env));
  }
};

async function runNewsBot(env) {
  const existingUrls = await getExistingUrls(env);
  console.log(`News bot: ${existingUrls.size} existing resources`);

  const articles = await fetchAllRSS();
  console.log(`News bot: ${articles.length} relevant RSS articles found`);

  let added = 0;
  for (const article of articles) {
    try {
      if (!article.url || existingUrls.has(article.url)) continue;
      await createResourceRecord(env, {
        Title: article.title,
        Description: article.description,
        URL: article.url,
        Source: article.source,
        Category: classifyArticle(article.title + ' ' + article.description),
        Status: 'Active'
      });
      existingUrls.add(article.url);
      added++;
      await sleep(300);
    } catch (err) {
      console.error('News bot error:', err.message);
    }
  }
  console.log(`News bot: added ${added} new resources`);
}

async function fetchRSSFeed(url, sourceName) {
  const res = await fetch(url, { headers: { 'User-Agent': 'FirstCape/1.0' } });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(item) ||
                   /<title>(.*?)<\/title>/.exec(item) || [])[1] || '';
    const desc  = (/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(item) ||
                   /<description>([\s\S]*?)<\/description>/.exec(item) || [])[1] || '';
    const link  = (/<link>(.*?)<\/link>/.exec(item) || [])[1] || '';
    if (title && link) {
      items.push({
        title: title.trim(),
        description: desc.replace(/<[^>]*>/g, '').trim().substring(0, 300),
        url: link.trim(),
        source: sourceName
      });
    }
  }
  return items;
}

async function fetchAllRSS() {
  const feeds = [
    { url: 'https://www.myjoyonline.com/feed/',                          source: 'MyJoyOnline' },
    { url: 'https://citinewsroom.com/feed/',                             source: 'Citi Newsroom' },
    { url: 'https://graphic.com.gh/feed',                               source: 'Graphic Online' },
    { url: 'https://www.ghanaweb.com/GhanaHomePage/RSS/business.xml',   source: 'GhanaWeb Business' },
    { url: 'https://thebftonline.com/feed/',                             source: 'BFT Online' }
  ];

  const keywords = ['real estate', 'property market', 'property prices',
                    'housing market', 'mortgage', 'landlord', 'rental property',
                    'land title', 'lands commission', 'property developer',
                    'property investment', 'property tax', 'house prices',
                    'home ownership', 'property management', 'estate agent',
                    'apartment', 'property for sale', 'property for rent'];

  const allArticles = [];
  for (const feed of feeds) {
    try {
      const items = await fetchRSSFeed(feed.url, feed.source);
      for (const item of items) {
        const text = (item.title + ' ' + item.description).toLowerCase();
        if (keywords.some(k => text.includes(k))) {
          allArticles.push(item);
        }
      }
    } catch (err) {
      console.error(`RSS error for ${feed.source}:`, err.message);
    }
  }
  return allArticles;
}

async function getExistingUrls(env) {
  const urls = new Set();
  let offset = null;
  do {
    let airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Resources?fields%5B%5D=URL&pageSize=100`;
    if (offset) airtableUrl += `&offset=${encodeURIComponent(offset)}`;
    const res = await fetch(airtableUrl, {
      headers: { 'Authorization': `Bearer ${env.AIRTABLE_API_KEY}` }
    });
    const data = await res.json();
    (data.records || []).forEach(r => { if (r.fields.URL) urls.add(r.fields.URL); });
    offset = data.offset || null;
  } while (offset);
  return urls;
}

async function createResourceRecord(env, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Resources`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Airtable create failed: ${JSON.stringify(err)}`);
  }
  return res.json();
}

function classifyArticle(text) {
  const t = text.toLowerCase();
  if (t.includes('law') || t.includes('legal') || t.includes('act') || t.includes('court')) return 'Legal';
  if (t.includes('mortgage') || t.includes('loan') || t.includes('bank') || t.includes('finance')) return 'Finance';
  if (t.includes('government') || t.includes('ministry') || t.includes('policy') || t.includes('lands commission')) return 'Government';
  if (t.includes('price') || t.includes('market') || t.includes('data') || t.includes('statistic') || t.includes('index')) return 'Market Data';
  return 'General';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
