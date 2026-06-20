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

      if (response.ok) {
        if (tableName === 'Leads') {
          await sendLeadEmails(env, body);
        } else if (tableName === 'Alerts') {
          await sendAlertEmails(env, body);
        }
      }

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
    if (event.cron === '0 * * * *') {
      ctx.waitUntil(syncInstagram(env));
    } else {
      ctx.waitUntil(runNewsBot(env));
    }
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

// ============================================================
// EMAIL NOTIFICATIONS (via Resend)
// Requires env.RESEND_API_KEY and env.STAFF_NOTIFICATION_EMAIL
// (Worker secrets). Sender address must be on a domain verified
// in Resend, e.g. notifications@firstcapeestatemanagement.com.
// ============================================================
const FROM_EMAIL = 'FirstCape Estate Management <notifications@firstcapeestatemanagement.com>';

async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) {
    console.error('Email skipped: RESEND_API_KEY not configured');
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend error (${res.status}):`, err);
    }
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendLeadEmails(env, fields) {
  const name = fields['Full Name'] || 'A visitor';
  const phone = fields['Phone / WhatsApp'] || '—';
  const email = fields['Email'] || '';
  const notes = fields['Notes'] || '—';

  if (env.STAFF_NOTIFICATION_EMAIL) {
    await sendEmail(env, {
      to: env.STAFF_NOTIFICATION_EMAIL,
      subject: `New website enquiry: ${name}`,
      html: `
        <h2>New Enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Phone/WhatsApp:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong><br>${escapeHtml(notes)}</p>
      `
    });
  }

  if (email) {
    await sendEmail(env, {
      to: email,
      subject: 'Thanks for reaching out to FirstCape Estate Management',
      html: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for getting in touch with FirstCape Estate Management. We've received your enquiry and will respond shortly.</p>
        <p>Best regards,<br>FirstCape Estate Management</p>
      `
    });
  }
}

async function sendAlertEmails(env, fields) {
  const email = fields['Email'] || '';
  const minBedrooms = fields['Min Bedrooms'] || '';
  const minBathrooms = fields['Min Bathrooms'] || '';
  const priceMax = fields['Price Max'];
  const currency = fields['Currency'] === 'USD' ? '$' : 'GH₵';
  const priceLine = priceMax ? `${currency}${Number(priceMax).toLocaleString()}` : 'Any';

  if (env.STAFF_NOTIFICATION_EMAIL) {
    await sendEmail(env, {
      to: env.STAFF_NOTIFICATION_EMAIL,
      subject: `New price alert signup: ${email || 'unknown email'}`,
      html: `
        <h2>New Price Alert</h2>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Max Price:</strong> ${escapeHtml(priceLine)}</p>
        <p><strong>Min Bedrooms:</strong> ${escapeHtml(minBedrooms)}</p>
        <p><strong>Min Bathrooms:</strong> ${escapeHtml(minBathrooms)}</p>
      `
    });
  }

  if (email) {
    await sendEmail(env, {
      to: email,
      subject: 'Your FirstCape property alert is set up',
      html: `
        <p>Hi,</p>
        <p>Your property alert has been created. We'll keep an eye out for listings matching your criteria (max price ${escapeHtml(priceLine)}).</p>
        <p>Best regards,<br>FirstCape Estate Management</p>
      `
    });
  }
}

// ============================================================
// INSTAGRAM SYNC
// Requires env.IG_USER_ID and env.IG_ACCESS_TOKEN (Worker secrets),
// and an "Instagram Media ID" text field on the Properties table.
// Check developers.facebook.com for the current Graph API version
// if this one becomes deprecated.
// ============================================================
const IG_API_VERSION = 'v21.0';

async function syncInstagram(env) {
  if (!env.IG_USER_ID || !env.IG_ACCESS_TOKEN) {
    console.error('Instagram sync skipped: IG_USER_ID or IG_ACCESS_TOKEN not configured');
    return;
  }
  await publishNewListings(env);
  await removeDelistedPosts(env);
}

function getPropertyImages(f) {
  let imgs = [];
  if (f['CDN Main Image URL']) imgs.push(f['CDN Main Image URL']);
  if (f['CDN Gallery JSON']) {
    try { const g = JSON.parse(f['CDN Gallery JSON']); if (Array.isArray(g)) imgs = imgs.concat(g); } catch (e) {}
  }
  if (f['Main Image']) f['Main Image'].forEach(a => imgs.push(a.url));
  if (f['Photos']) f['Photos'].forEach(a => imgs.push(a.url));
  return [...new Set(imgs)];
}

function buildCaption(f) {
  const cur = f['Currency'] === 'USD' ? '$' : 'GH₵';
  const price = f['Price'] ? cur + Number(f['Price']).toLocaleString() : '';
  return [f['Property Name'], price].filter(Boolean).join(' — ');
}

async function airtableListProperties(env, formula, fields) {
  const fieldParams = fields.map(f => 'fields%5B%5D=' + encodeURIComponent(f)).join('&');
  const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Properties?filterByFormula=${encodeURIComponent(formula)}&pageSize=100&${fieldParams}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` } });
  const data = await res.json();
  return data.records || [];
}

async function airtableUpdateProperty(env, recordId, fields) {
  await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Properties/${recordId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
}

async function publishNewListings(env) {
  const records = await airtableListProperties(
    env,
    "AND({Status}='Active', {Instagram Media ID}='')",
    ['Property Name', 'Price', 'Currency', 'CDN Main Image URL', 'CDN Gallery JSON', 'Main Image', 'Photos', 'Instagram Media ID']
  );
  for (const rec of records) {
    try {
      const images = getPropertyImages(rec.fields).slice(0, 10); // Instagram carousel max = 10
      if (images.length === 0) { console.error(`IG publish skipped, no images: ${rec.id}`); continue; }
      const caption = buildCaption(rec.fields);
      const mediaId = images.length === 1
        ? await igPublishSingleImage(env, images[0], caption)
        : await igPublishCarousel(env, images, caption);
      await airtableUpdateProperty(env, rec.id, { 'Instagram Media ID': mediaId });
      await sleep(1500); // be gentle between posts
    } catch (err) {
      console.error(`IG publish failed for ${rec.id}:`, err.message);
    }
  }
}

async function removeDelistedPosts(env) {
  const records = await airtableListProperties(
    env,
    "AND({Instagram Media ID}!='', {Status}!='Active')",
    ['Instagram Media ID']
  );
  for (const rec of records) {
    try {
      await igDeleteMedia(env, rec.fields['Instagram Media ID']);
      await airtableUpdateProperty(env, rec.id, { 'Instagram Media ID': '' });
      await sleep(1000);
    } catch (err) {
      console.error(`IG delete failed for ${rec.id}:`, err.message);
    }
  }
}

async function igCreateContainer(env, params) {
  const url = `https://graph.facebook.com/${IG_API_VERSION}/${env.IG_USER_ID}/media`;
  const body = new URLSearchParams({ ...params, access_token: env.IG_ACCESS_TOKEN });
  const res = await fetch(url, { method: 'POST', body });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`IG container error: ${JSON.stringify(data.error || data)}`);
  return data.id;
}

async function igWaitUntilReady(env, containerId, maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    const url = `https://graph.facebook.com/${IG_API_VERSION}/${containerId}?fields=status_code&access_token=${encodeURIComponent(env.IG_ACCESS_TOKEN)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error('IG container processing failed: ' + JSON.stringify(data));
    await sleep(2000);
  }
}

async function igPublish(env, creationId) {
  await igWaitUntilReady(env, creationId);
  const url = `https://graph.facebook.com/${IG_API_VERSION}/${env.IG_USER_ID}/media_publish`;
  const body = new URLSearchParams({ creation_id: creationId, access_token: env.IG_ACCESS_TOKEN });
  const res = await fetch(url, { method: 'POST', body });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`IG publish error: ${JSON.stringify(data.error || data)}`);
  return data.id;
}

async function igPublishSingleImage(env, imageUrl, caption) {
  const containerId = await igCreateContainer(env, { image_url: imageUrl, caption });
  return await igPublish(env, containerId);
}

async function igPublishCarousel(env, imageUrls, caption) {
  const childIds = [];
  for (const url of imageUrls) {
    const childId = await igCreateContainer(env, { image_url: url, is_carousel_item: 'true' });
    childIds.push(childId);
    await sleep(500);
  }
  const carouselId = await igCreateContainer(env, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption
  });
  return await igPublish(env, carouselId);
}

async function igDeleteMedia(env, mediaId) {
  const url = `https://graph.facebook.com/${IG_API_VERSION}/${mediaId}?access_token=${encodeURIComponent(env.IG_ACCESS_TOKEN)}`;
  const res = await fetch(url, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`IG delete error: ${JSON.stringify(data.error || data)}`);
  return data;
}
