// SmartHub Airtable Client
// Version: 2.0 - Complete client with fetchRecord and fetchRecords
// Handles all Airtable API interactions

class AirtableClient {
  constructor() {
    this.baseUrl = 'https://api.airtable.com/v0';
    this.config = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  init(config) {
    this.config = config;
    console.log('[AirtableClient] Initialized with base:', config.baseId);
  }

  /**
   * Fetch multiple records with filtering and sorting
   */
  async fetchRecords(tableName, options = {}) {
    if (!this.config) {
      throw new Error('AirtableClient not initialized. Call init() first.');
    }

    const cacheKey = `${tableName}-${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('[AirtableClient] Returning cached records for:', tableName);
        return cached.data;
      }
    }

    try {
      const url = this.buildFetchUrl(tableName, options);
      console.log('[AirtableClient] Fetching records from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AirtableClient] API Error:', response.status, errorText);
        throw new Error(`Airtable API error: ${response.status}`);
      }

      const data = await response.json();
      const records = data.records || [];

      console.log('[AirtableClient] Fetched', records.length, 'records from', tableName);

      // Cache the results
      this.cache.set(cacheKey, {
        data: records,
        timestamp: Date.now()
      });

      return records;

    } catch (error) {
      console.error('[AirtableClient] Error fetching records:', error);
      throw error;
    }
  }

  /**
   * Fetch a single record by ID
   */
  async fetchRecord(tableName, recordId) {
    if (!this.config) {
      throw new Error('AirtableClient not initialized. Call init() first.');
    }

    const cacheKey = `${tableName}-${recordId}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('[AirtableClient] Returning cached record:', recordId);
        return cached.data;
      }
    }

    try {
      const url = `${this.baseUrl}/${this.config.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
      console.log('[AirtableClient] Fetching record from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AirtableClient] API Error:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error('Record not found');
        }
        
        throw new Error(`Airtable API error: ${response.status}`);
      }

      const record = await response.json();
      console.log('[AirtableClient] Fetched record:', record.id);

      // Cache the result
      this.cache.set(cacheKey, {
        data: record,
        timestamp: Date.now()
      });

      return record;

    } catch (error) {
      console.error('[AirtableClient] Error fetching record:', error);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async createRecord(tableName, fields) {
    if (!this.config) {
      throw new Error('AirtableClient not initialized. Call init() first.');
    }

    try {
      const url = `${this.baseUrl}/${this.config.baseId}/${encodeURIComponent(tableName)}`;
      console.log('[AirtableClient] Creating record in:', tableName);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          fields: fields
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AirtableClient] API Error:', response.status, errorText);
        throw new Error(`Airtable API error: ${response.status}`);
      }

      const record = await response.json();
      console.log('[AirtableClient] Created record:', record.id);

      // Clear cache for this table
      this.clearCacheForTable(tableName);

      return record;

    } catch (error) {
      console.error('[AirtableClient] Error creating record:', error);
      throw error;
    }
  }

  /**
   * Update an existing record
   */
  async updateRecord(tableName, recordId, fields) {
    if (!this.config) {
      throw new Error('AirtableClient not initialized. Call init() first.');
    }

    try {
      const url = `${this.baseUrl}/${this.config.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
      console.log('[AirtableClient] Updating record:', recordId);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          fields: fields
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AirtableClient] API Error:', response.status, errorText);
        throw new Error(`Airtable API error: ${response.status}`);
      }

      const record = await response.json();
      console.log('[AirtableClient] Updated record:', record.id);

      // Clear cache
      this.cache.delete(`${tableName}-${recordId}`);
      this.clearCacheForTable(tableName);

      return record;

    } catch (error) {
      console.error('[AirtableClient] Error updating record:', error);
      throw error;
    }
  }

  /**
   * Build URL with query parameters
   */
  buildFetchUrl(tableName, options = {}) {
    const baseUrl = `${this.baseUrl}/${this.config.baseId}/${encodeURIComponent(tableName)}`;
    const params = new URLSearchParams();

    // Add filterByFormula
    if (options.filterByFormula) {
      params.append('filterByFormula', options.filterByFormula);
    }

    // Add fields
    if (options.fields && Array.isArray(options.fields)) {
      options.fields.forEach(field => {
        params.append('fields[]', field);
      });
    }

    // Add maxRecords
    if (options.maxRecords) {
      params.append('maxRecords', options.maxRecords);
    }

    // Add pageSize
    if (options.pageSize) {
      params.append('pageSize', options.pageSize);
    }

    // Add sort
    if (options.sort && Array.isArray(options.sort)) {
      options.sort.forEach((sortItem, index) => {
        params.append(`sort[${index}][field]`, sortItem.field);
        params.append(`sort[${index}][direction]`, sortItem.direction || 'asc');
      });
    }

    // Add view
    if (options.view) {
      params.append('view', options.view);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Get request headers
   */
  getHeaders() {
    if (!this.config) {
      throw new Error('AirtableClient not initialized');
    }

    return {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Clear cache for a specific table
   */
  clearCacheForTable(tableName) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(tableName)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log('[AirtableClient] Cleared cache for table:', tableName);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[AirtableClient] Cleared all cache');
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Create global instance
const airtableClient = new AirtableClient();

// Auto-initialize if SMARTHUB_CONFIG is already loaded
if (typeof SMARTHUB_CONFIG !== 'undefined' && SMARTHUB_CONFIG.airtable) {
  airtableClient.init(SMARTHUB_CONFIG.airtable);
  console.log('[AirtableClient] Auto-initialized from SMARTHUB_CONFIG');
} else {
  // Wait for config to load
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof SMARTHUB_CONFIG !== 'undefined' && SMARTHUB_CONFIG.airtable) {
      airtableClient.init(SMARTHUB_CONFIG.airtable);
      console.log('[AirtableClient] Initialized on DOMContentLoaded');
    } else {
      console.warn('[AirtableClient] SMARTHUB_CONFIG not found. Initialize manually with airtableClient.init(config)');
    }
  });
}

// Make available globally
if (typeof window !== 'undefined') {
  window.airtableClient = airtableClient;
  window.AirtableClient = AirtableClient;
}

console.log('[AirtableClient] v2.0 loaded');