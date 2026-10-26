const { normalizeUrl, validateFetchUrl, extractHostname } = require('../../utils/urlUtils');

describe('urlUtils', () => {
  describe('normalizeUrl', () => {
    test('should return empty string for null/undefined/empty input', () => {
      expect(normalizeUrl(null)).toBe('');
      expect(normalizeUrl(undefined)).toBe('');
      expect(normalizeUrl('')).toBe('');
    });

    test('should strip common tracking parameters', () => {
      const url = 'https://example.com/article?utm_source=twitter&utm_medium=social&id=123';
      const normalized = normalizeUrl(url);
      expect(normalized).toContain('id=123');
      expect(normalized).not.toContain('utm_source');
      expect(normalized).not.toContain('utm_medium');
    });

    test('should strip fbclid and gclid', () => {
      const url = 'https://example.com/page?fbclid=abc123&title=test';
      const normalized = normalizeUrl(url);
      expect(normalized).not.toContain('fbclid');
      expect(normalized).toContain('title=test');
    });

    test('should remove trailing slashes from path', () => {
      const url = 'https://example.com/article/test/';
      const normalized = normalizeUrl(url);
      expect(normalized).toBe('https://example.com/article/test');
    });

    test('should not remove the root path slash', () => {
      const url = 'https://example.com/';
      const normalized = normalizeUrl(url);
      expect(normalized).toBe('https://example.com/');
    });

    test('should remove hash fragments', () => {
      const url = 'https://example.com/article#comments';
      const normalized = normalizeUrl(url);
      expect(normalized).not.toContain('#comments');
    });

    test('should lowercase hostname', () => {
      const url = 'https://EXAMPLE.COM/Article';
      const normalized = normalizeUrl(url);
      expect(normalized).toContain('example.com');
      // Path casing should be preserved
      expect(normalized).toContain('/Article');
    });

    test('should reject non-http(s) protocols', () => {
      expect(normalizeUrl('ftp://example.com/file')).toBe('');
      expect(normalizeUrl('javascript:alert(1)')).toBe('');
      expect(normalizeUrl('file:///etc/passwd')).toBe('');
    });

    test('should sort remaining query params for consistent dedup', () => {
      const url1 = 'https://example.com/page?b=2&a=1';
      const url2 = 'https://example.com/page?a=1&b=2';
      expect(normalizeUrl(url1)).toBe(normalizeUrl(url2));
    });

    test('should handle malformed URLs gracefully', () => {
      expect(normalizeUrl('not a url')).toBe('');
      expect(normalizeUrl('://missing-protocol')).toBe('');
    });
  });

  describe('validateFetchUrl', () => {
    test('should reject empty/null URLs', () => {
      expect(validateFetchUrl(null).valid).toBe(false);
      expect(validateFetchUrl('').valid).toBe(false);
    });

    test('should reject non-http protocols', () => {
      expect(validateFetchUrl('ftp://example.com').valid).toBe(false);
      expect(validateFetchUrl('file:///etc/passwd').valid).toBe(false);
    });

    test('should block localhost', () => {
      const result = validateFetchUrl('http://localhost:3000/api');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Blocked host');
    });

    test('should block private IP ranges', () => {
      expect(validateFetchUrl('http://127.0.0.1/api').valid).toBe(false);
      expect(validateFetchUrl('http://10.0.0.1/internal').valid).toBe(false);
      expect(validateFetchUrl('http://192.168.1.1/admin').valid).toBe(false);
      expect(validateFetchUrl('http://172.16.0.1/api').valid).toBe(false);
    });

    test('should block 0.0.0.0', () => {
      expect(validateFetchUrl('http://0.0.0.0/api').valid).toBe(false);
    });

    test('should allow valid public URLs', () => {
      expect(validateFetchUrl('https://rss.example.com/feed.xml').valid).toBe(true);
      expect(validateFetchUrl('https://news.google.com/rss').valid).toBe(true);
    });

    test('should enforce allowedHosts when specified', () => {
      const result1 = validateFetchUrl('https://evil.com/feed', ['example.com']);
      expect(result1.valid).toBe(false);

      const result2 = validateFetchUrl('https://rss.example.com/feed', ['example.com']);
      expect(result2.valid).toBe(true);

      const result3 = validateFetchUrl('https://example.com/feed', ['example.com']);
      expect(result3.valid).toBe(true);
    });

    test('should allow any public host when allowedHosts is empty', () => {
      expect(validateFetchUrl('https://anything.com/feed', []).valid).toBe(true);
    });
  });

  describe('extractHostname', () => {
    test('should extract hostname from valid URL', () => {
      expect(extractHostname('https://www.example.com/path')).toBe('www.example.com');
      expect(extractHostname('https://EXAMPLE.COM/path')).toBe('example.com');
    });

    test('should return empty string for invalid input', () => {
      expect(extractHostname(null)).toBe('');
      expect(extractHostname('')).toBe('');
      expect(extractHostname('not a url')).toBe('');
    });
  });
});
