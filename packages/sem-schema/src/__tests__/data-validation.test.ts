/**
 * Tests for data validation using SemSchema vocabulary
 * These tests verify that data correctly validates against schemas using custom keywords
 */
import { validateData } from '../api';

describe('Data Validation Tests', () => {
  describe('Format: json', () => {
    it('should validate valid JSON string', () => {
      const schema = { type: 'string', format: 'json' };
      
      expect(validateData('{"key": "value"}', schema).valid).toBe(true);
      expect(validateData('[]', schema).valid).toBe(true);
      expect(validateData('["x","y"]', schema).valid).toBe(true);
      expect(validateData('[1,2,3]', schema).valid).toBe(true);
      expect(validateData('123', schema).valid).toBe(true);
      expect(validateData('"string"', schema).valid).toBe(true);
    });

    it('should reject invalid JSON string', () => {
      const schema = { type: 'string', format: 'json' };
      
      expect(validateData('{invalid json}', schema).valid).toBe(false);
      expect(validateData('{"incomplete":', schema).valid).toBe(false);
    });
  });

  describe('Format: html', () => {
    it('should validate HTML string', () => {
      const schema = { type: 'string', format: 'html' };
      
      expect(validateData('<p>Hello</p>', schema).valid).toBe(true);
      expect(validateData('<div>World</div>', schema).valid).toBe(true);
      expect(validateData('<a href="#">Link</a>', schema).valid).toBe(true);
    });

    it('should reject non-HTML string', () => {
      const schema = { type: 'string', format: 'html' };
      
      expect(validateData('Just plain text', schema).valid).toBe(false);
      expect(validateData('No tags here', schema).valid).toBe(false);
    });
  });

  describe('Format: text', () => {
    it('should validate text strings including multiline', () => {
      const schema = { type: 'string', format: 'text' };
      
      expect(validateData('Single line', schema).valid).toBe(true);
      expect(validateData('Multi\nline\ntext', schema).valid).toBe(true);
      expect(validateData('', schema).valid).toBe(true);
    });
  });

  describe('Format: code', () => {
    it('should validate code strings', () => {
      const schema = { type: 'string', format: 'code' };
      
      expect(validateData('const x = 1;', schema).valid).toBe(true);
      expect(validateData('function test() { return true; }', schema).valid).toBe(true);
      expect(validateData('Multi\nline\ncode', schema).valid).toBe(true);
      expect(validateData('', schema).valid).toBe(true);
    });
  });

  describe('Format: jsonata', () => {
    it('should validate jsonata strings', () => {
      const schema = { type: 'string', format: 'jsonata' };
      
      expect(validateData('$.fieldName', schema).valid).toBe(true);
      expect(validateData('$sum(items.price)', schema).valid).toBe(true);
      expect(validateData('items[price > 10]', schema).valid).toBe(true);
      expect(validateData('', schema).valid).toBe(true);
    });
  });

  describe('Format: reference', () => {
    it('should validate integer values with integer type', () => {
      const schema = { type: 'integer', format: 'reference' };

      expect(validateData(1, schema).valid).toBe(true);
      expect(validateData(0, schema).valid).toBe(true);
      expect(validateData(-5, schema).valid).toBe(true);
      expect(validateData(999999, schema).valid).toBe(true);
    });

    it('should validate string values with string type', () => {
      const schema = { type: 'string', format: 'reference' };

      expect(validateData('abc-123', schema).valid).toBe(true);
      expect(validateData('550e8400-e29b-41d4-a716-446655440000', schema).valid).toBe(true);
      expect(validateData('1', schema).valid).toBe(true);
    });

    it('should reject non-integer numbers via type: integer', () => {
      const schema = { type: 'integer', format: 'reference' };

      expect(validateData(1.5, schema).valid).toBe(false);
      expect(validateData(0.1, schema).valid).toBe(false);
    });

    it('should reject wrong types', () => {
      const schema = { type: 'integer', format: 'reference' };

      expect(validateData('123', schema).valid).toBe(false);
      expect(validateData(null, schema).valid).toBe(false);
      expect(validateData(true, schema).valid).toBe(false);
    });

    it('should work with inputMode required (integer)', () => {
      const schema = {
        type: 'object',
        properties: {
          userId: { type: 'integer', format: 'reference', inputMode: 'required' }
        }
      };

      expect(validateData({ userId: 1 }, schema).valid).toBe(true);
      expect(validateData({ userId: 0 }, schema).valid).toBe(true);
      expect(validateData({ userId: null }, schema).valid).toBe(false);
      expect(validateData({}, schema).valid).toBe(false);
    });

    it('should work with inputMode required (string)', () => {
      const schema = {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'reference', inputMode: 'required' }
        }
      };

      expect(validateData({ userId: 'abc-123' }, schema).valid).toBe(true);
      expect(validateData({ userId: null }, schema).valid).toBe(false);
      expect(validateData({}, schema).valid).toBe(false);
    });
  });

  describe('Format: parent', () => {
    it('should validate integer values with integer type', () => {
      const schema = { type: 'integer', format: 'parent' };

      expect(validateData(1, schema).valid).toBe(true);
      expect(validateData(0, schema).valid).toBe(true);
      expect(validateData(-5, schema).valid).toBe(true);
      expect(validateData(999999, schema).valid).toBe(true);
    });

    it('should validate string values with string type', () => {
      const schema = { type: 'string', format: 'parent' };

      expect(validateData('abc-123', schema).valid).toBe(true);
      expect(validateData('550e8400-e29b-41d4-a716-446655440000', schema).valid).toBe(true);
      expect(validateData('1', schema).valid).toBe(true);
    });

    it('should reject non-integer numbers via type: integer', () => {
      const schema = { type: 'integer', format: 'parent' };

      expect(validateData(1.5, schema).valid).toBe(false);
      expect(validateData(0.1, schema).valid).toBe(false);
    });

    it('should reject wrong types', () => {
      const schema = { type: 'integer', format: 'parent' };

      expect(validateData('123', schema).valid).toBe(false);
      expect(validateData(null, schema).valid).toBe(false);
      expect(validateData(true, schema).valid).toBe(false);
    });

    it('should work with inputMode required (integer)', () => {
      const schema = {
        type: 'object',
        properties: {
          parentId: { type: 'integer', format: 'parent', inputMode: 'required' }
        }
      };

      expect(validateData({ parentId: 1 }, schema).valid).toBe(true);
      expect(validateData({ parentId: 0 }, schema).valid).toBe(true);
      expect(validateData({ parentId: null }, schema).valid).toBe(false);
      expect(validateData({}, schema).valid).toBe(false);
    });

    it('should work with inputMode required (string)', () => {
      const schema = {
        type: 'object',
        properties: {
          parentId: { type: 'string', format: 'parent', inputMode: 'required' }
        }
      };

      expect(validateData({ parentId: 'abc-123' }, schema).valid).toBe(true);
      expect(validateData({ parentId: null }, schema).valid).toBe(false);
      expect(validateData({}, schema).valid).toBe(false);
    });
  });

  describe('inputMode: required validation', () => {
    it('should reject empty string when inputMode is required', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', inputMode: 'required' }
        }
      };
      
      const result = validateData({ name: '' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.keyword).toBe('inputMode');
      expect(result.errors?.[0]?.message).toContain('must not be empty');
    });

    it('should reject null when inputMode is required', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: ['string', 'null'], inputMode: 'required' }
        }
      };
      
      const result = validateData({ name: null }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.keyword).toBe('inputMode');
      expect(result.errors?.[0]?.message).toContain('must not be null or undefined');
    });

    it('should reject undefined when inputMode is required', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', inputMode: 'required' }
        }
      };
      
      const result = validateData({}, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.keyword).toBe('inputMode');
    });

    it('should accept non-empty string when inputMode is required', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', inputMode: 'required' }
        }
      };
      
      expect(validateData({ name: 'not empty' }, schema).valid).toBe(true);
      expect(validateData({ name: ' ' }, schema).valid).toBe(true);
    });

    it('should reject empty string with any format when inputMode is required', () => {
      const schema = {
        type: 'object',
        properties: {
          jsonField: { type: 'string', format: 'json', inputMode: 'required' },
          htmlField: { type: 'string', format: 'html', inputMode: 'required' },
          textField: { type: 'string', format: 'text', inputMode: 'required' }
        }
      };
      
      expect(validateData({ jsonField: '', htmlField: '', textField: '' }, schema).valid).toBe(false);
      
      const jsonResult = validateData({ jsonField: '', htmlField: '<p>ok</p>', textField: 'ok' }, schema);
      expect(jsonResult.valid).toBe(false);
      
      const htmlResult = validateData({ jsonField: '{}', htmlField: '', textField: 'ok' }, schema);
      expect(htmlResult.valid).toBe(false);
      
      const textResult = validateData({ jsonField: '{}', htmlField: '<p>ok</p>', textField: '' }, schema);
      expect(textResult.valid).toBe(false);
    });

    it('should accept empty string when inputMode is not required', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', inputMode: 'default' }
        }
      };
      
      expect(validateData({ name: '' }, schema).valid).toBe(true);
    });

    it('should validate multiple fields with inputMode required', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', inputMode: 'required' },
          email: { type: 'string', format: 'email', inputMode: 'required' },
          notes: { type: 'string' }
        }
      };
      
      // All required fields filled - valid
      expect(validateData({ 
        name: 'John', 
        email: 'john@example.com',
        notes: 'Some notes'
      }, schema).valid).toBe(true);
      
      // Missing required name - invalid
      const result1 = validateData({ 
        email: 'john@example.com',
        notes: 'Some notes'
      }, schema);
      expect(result1.valid).toBe(false);
      expect(result1.errors?.some((e: any) => e.keyword === 'inputMode')).toBe(true);
      
      // Empty required email - invalid
      const result2 = validateData({ 
        name: 'John',
        email: '',
        notes: 'Some notes'
      }, schema);
      expect(result2.valid).toBe(false);
      expect(result2.errors?.some((e: any) => e.keyword === 'inputMode')).toBe(true);
    });
  });

  describe('Precision keyword', () => {
    it('should validate number with correct precision', () => {
      const schema = { type: 'number', precision: 2 };
      
      expect(validateData(10, schema).valid).toBe(true);
      expect(validateData(10.5, schema).valid).toBe(true);
      expect(validateData(10.55, schema).valid).toBe(true);
    });

    it('should reject number with too many decimal places', () => {
      const schema = { type: 'number', precision: 2 };
      
      const result = validateData(10.555, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.keyword).toBe('precision');
    });

    it('should validate integer with precision 0', () => {
      const schema = { type: 'number', precision: 0 };
      
      expect(validateData(10, schema).valid).toBe(true);
      expect(validateData(0, schema).valid).toBe(true);
      expect(validateData(-5, schema).valid).toBe(true);
    });

    it('should reject decimal with precision 0', () => {
      const schema = { type: 'number', precision: 0 };
      
      expect(validateData(10.5, schema).valid).toBe(false);
    });

    it('should handle precision values between 0 and 4', () => {
      for (let precision = 0; precision <= 4; precision++) {
        const schema = { type: 'number', precision };
        
        const validNumber = parseFloat('10.' + '5'.repeat(precision));
        expect(validateData(validNumber, schema).valid).toBe(true);
        
        if (precision < 4) {
          const invalidNumber = parseFloat('10.' + '5'.repeat(precision + 1));
          expect(validateData(invalidNumber, schema).valid).toBe(false);
        }
      }
    });
  });

  describe('Type inference', () => {
    it('should infer type string when format is provided without type', () => {
      const schema = { format: 'json' };
      
      expect(validateData('{"key": "value"}', schema).valid).toBe(true);
    });

    it('should validate nested properties with inferred types', () => {
      const schema = {
        type: 'object',
        properties: {
          data: { format: 'json' }  // Type inferred as string
        }
      };
      
      expect(validateData({ data: '{"key": "value"}' }, schema).valid).toBe(true);
    });

    it('should validate array items with inferred types', () => {
      const schema = {
        type: 'array',
        items: { format: 'html' }  // Type inferred as string
      };
      
      expect(validateData(['<p>Item 1</p>', '<p>Item 2</p>'], schema).valid).toBe(true);
    });
  });

  describe('Standard Formats - email', () => {
    it('should validate valid email addresses', () => {
      const schema = { type: 'string', format: 'email' };
      
      expect(validateData('user@example.com', schema).valid).toBe(true);
      expect(validateData('john.doe@company.co.uk', schema).valid).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      const schema = { type: 'string', format: 'email' };
      
      expect(validateData('not-an-email', schema).valid).toBe(false);
      expect(validateData('missing@domain', schema).valid).toBe(false);
    });
  });

  describe('Standard Formats - date', () => {
    it('should validate valid dates', () => {
      const schema = { type: 'string', format: 'date' };
      
      expect(validateData('2023-12-07', schema).valid).toBe(true);
      expect(validateData('2024-01-01', schema).valid).toBe(true);
    });

    it('should reject invalid dates', () => {
      const schema = { type: 'string', format: 'date' };
      
      expect(validateData('2023-13-45', schema).valid).toBe(false);
      expect(validateData('not-a-date', schema).valid).toBe(false);
    });
  });

  describe('Standard Formats - date-time', () => {
    it('should validate valid date-time strings with timezone', () => {
      const schema = { type: 'string', format: 'date-time' };

      expect(validateData('2026-02-09T17:43:07Z', schema).valid).toBe(true);
      expect(validateData('2026-02-09T17:43:07.906Z', schema).valid).toBe(true);
      expect(validateData('2026-02-09T17:43:07+00:00', schema).valid).toBe(true);
      expect(validateData('2026-02-09T17:43:07-05:00', schema).valid).toBe(true);
    });

    it('should validate ISO 8601 date-time without timezone (Python isoformat)', () => {
      const schema = { type: 'string', format: 'date-time' };

      expect(validateData('2026-02-09T17:43:07.906138', schema).valid).toBe(true);
      expect(validateData('2026-02-09T17:43:07', schema).valid).toBe(true);
    });

    it('should reject invalid timezone offsets', () => {
      const schema = { type: 'string', format: 'date-time' };

      // 25 hours is not a valid UTC offset (max is ±23:59)
      expect(validateData('2026-02-09T17:43:07+25:00', schema).valid).toBe(false);
      // 61 minutes is not a valid UTC offset
      expect(validateData('2026-02-09T17:43:07+00:61', schema).valid).toBe(false);
    });

    it('should reject impossible calendar dates', () => {
      const schema = { type: 'string', format: 'date-time' };

      // February has at most 29 days — JavaScript Date() would silently roll
      // Feb 30 over to March 2, so this must be caught by the date-part validator
      expect(validateData('2026-02-30T10:00:00Z', schema).valid).toBe(false);
      // April has 30 days, not 31
      expect(validateData('2026-04-31T10:00:00Z', schema).valid).toBe(false);
    });

    it('should reject invalid time components', () => {
      const schema = { type: 'string', format: 'date-time' };

      expect(validateData('2026-02-09T25:43:07Z', schema).valid).toBe(false);
      expect(validateData('2026-02-09T17:61:07Z', schema).valid).toBe(false);
    });

    it('should reject invalid date-time strings', () => {
      const schema = { type: 'string', format: 'date-time' };

      expect(validateData('not-a-datetime', schema).valid).toBe(false);
      expect(validateData('2026-13-09T17:43:07Z', schema).valid).toBe(false);
    });
  });

  describe('Standard Formats - uri', () => {
    it('should validate valid URIs', () => {
      const schema = { type: 'string', format: 'uri' };
      
      expect(validateData('https://example.com', schema).valid).toBe(true);
      expect(validateData('ftp://files.example.org', schema).valid).toBe(true);
    });

    it('should reject invalid URIs', () => {
      const schema = { type: 'string', format: 'uri' };
      
      expect(validateData('not a uri', schema).valid).toBe(false);
    });
  });

  describe('Standard Formats - iri (implemented by us)', () => {
    it('should validate valid IRIs', () => {
      const schema = { type: 'string', format: 'iri' };
      
      expect(validateData('https://example.com', schema).valid).toBe(true);
      expect(validateData('http://例え.jp', schema).valid).toBe(true);
    });

    it('should validate data URLs', () => {
      const schema = { type: 'string', format: 'iri' };
      
      expect(validateData('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zZXR0aW5ncy1pY29uIGx1Y2lkZS1zZXR0aW5ncyI+PHBhdGggZD0iTTkuNjcxIDQuMTM2YTIuMzQgMi4zNCAwIDAgMSA0LjY1OSAwIDIuMzQgMi4zNCAwIDAgMCAzLjMxOSAxLjkxNSAyLjM0IDIuMzQgMCAwIDEgMi4zMyA0LjAzMyAyLjM0IDIuMzQgMCAwIDAgMCAzLjgzMSAyLjM0IDIuMzQgMCAwIDEtMi4zMyA0LjAzMyAyLjM0IDIuMzQgMCAwIDAtMy4zMTkgMS45MTUgMi4zNCAyLjM0IDAgMCAxLTQuNjU5IDAgMi4zNCAyLjM0IDAgMCAwLTMuMzItMS45MTUgMi4zNCAyLjM0IDAgMCAxLTIuMzMtNC4wMzMgMi4zNCAyLjM0IDAgMCAwIDAtMy44MzFBMi4zNCAyLjM0IDAgMCAxIDYuMzUgNi4wNTFhMi4zNCAyLjM0IDAgMCAwIDMuMzE5LTEuOTE1Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPjwvc3ZnPg==', schema).valid).toBe(true);
      expect(validateData('data:text/plain;charset=utf-8,Hello%20World', schema).valid).toBe(true);
      expect(validateData('data:text/html,<h1>Hello</h1>', schema).valid).toBe(true);
    });

    it('should validate mailto URLs', () => {
      const schema = { type: 'string', format: 'iri' };
      
      expect(validateData('mailto:support@test.com', schema).valid).toBe(true);
      expect(validateData('mailto:user@example.org?subject=Test', schema).valid).toBe(true);
    });

    it('should reject invalid IRIs', () => {
      const schema = { type: 'string', format: 'iri' };
      
      expect(validateData('not an iri', schema).valid).toBe(false);
      expect(validateData('', schema).valid).toBe(false);
    });
  });

  describe('Standard Formats - iri-reference (implemented by us)', () => {
    it('should validate valid IRI references', () => {
      const schema = { type: 'string', format: 'iri-reference' };
      
      expect(validateData('https://example.com', schema).valid).toBe(true);
      expect(validateData('/path/to/resource', schema).valid).toBe(true);
      expect(validateData('../relative', schema).valid).toBe(true);
      expect(validateData('#fragment', schema).valid).toBe(true);
    });

    it('should reject invalid IRI references', () => {
      const schema = { type: 'string', format: 'iri-reference' };
      
      expect(validateData('has spaces', schema).valid).toBe(false);
      expect(validateData('has<brackets>', schema).valid).toBe(false);
    });
  });

  describe('Standard Formats - idn-email (implemented by us)', () => {
    it('should validate valid IDN emails', () => {
      const schema = { type: 'string', format: 'idn-email' };
      
      expect(validateData('user@example.com', schema).valid).toBe(true);
      expect(validateData('用户@例え.jp', schema).valid).toBe(true);
    });

    it('should reject invalid IDN emails', () => {
      const schema = { type: 'string', format: 'idn-email' };
      
      expect(validateData('not-an-email', schema).valid).toBe(false);
      expect(validateData('@nodomain', schema).valid).toBe(false);
      expect(validateData('user@', schema).valid).toBe(false);
    });
  });

  describe('Standard Formats - idn-hostname (implemented by us)', () => {
    it('should validate valid IDN hostnames', () => {
      const schema = { type: 'string', format: 'idn-hostname' };
      
      expect(validateData('example.com', schema).valid).toBe(true);
      expect(validateData('例え.jp', schema).valid).toBe(true);
      expect(validateData('subdomain.example.com', schema).valid).toBe(true);
    });

    it('should reject invalid IDN hostnames', () => {
      const schema = { type: 'string', format: 'idn-hostname' };
      
      expect(validateData('.starts-with-dot', schema).valid).toBe(false);
      expect(validateData('ends-with-dot.', schema).valid).toBe(false);
      expect(validateData('-starts-with-dash', schema).valid).toBe(false);
    });
  });

  describe('Standard JSON Schema required array (object-level)', () => {
    it('should reject missing property when in required array', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        },
        required: ['name']
      };
      
      // Missing required 'name' property - should fail
      const result = validateData({ email: 'john@example.com' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]?.keyword).toBe('required');
    });

    it('should accept empty string for property in required array (standard behavior)', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      };
      
      // Property exists but is empty string - should pass (standard JSON Schema)
      const result = validateData({ name: '' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should accept property with value when in required array', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        },
        required: ['name']
      };
      
      expect(validateData({ name: 'John' }, schema).valid).toBe(true);
      expect(validateData({ name: 'John', email: 'john@example.com' }, schema).valid).toBe(true);
    });

    it('should differentiate between required array and inputMode required', () => {
      const schema = {
        type: 'object',
        properties: {
          // Standard required: property must exist, but empty string is OK
          field1: { type: 'string' },
          // inputMode required: property must have non-empty value
          field2: { type: 'string', inputMode: 'required' }
        },
        required: ['field1']
      };
      
      // field1 with empty string - valid (required array allows empty)
      expect(validateData({ field1: '', field2: 'value' }, schema).valid).toBe(true);
      
      // field1 missing - invalid (required array)
      expect(validateData({ field2: 'value' }, schema).valid).toBe(false);
      
      // field2 with empty string - invalid (inputMode: required)
      const result = validateData({ field1: 'value', field2: '' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors?.some((e: any) => e.keyword === 'inputMode')).toBe(true);
    });
  });

  describe('Enum with inputMode validation', () => {
    it('should allow empty string in enum without inputMode: required', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['active', 'inactive', 'pending']
            // No inputMode: required, so empty should be allowed
          }
        }
      };
      
      // Empty string should be valid when inputMode is not "required"
      const result = validateData({ status: '' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should reject empty string in enum with inputMode: required', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            inputMode: 'required'
          }
        }
      };
      
      // Empty string should be invalid when inputMode is "required"
      const result = validateData({ status: '' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]?.keyword).toBe('inputMode');
      expect(result.errors?.[0]?.message).toContain('must not be empty');
    });

    it('should accept valid enum value without inputMode: required', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      };
      
      expect(validateData({ status: 'active' }, schema).valid).toBe(true);
      expect(validateData({ status: 'inactive' }, schema).valid).toBe(true);
      expect(validateData({ status: 'pending' }, schema).valid).toBe(true);
    });

    it('should accept valid enum value with inputMode: required', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            inputMode: 'required'
          }
        }
      };
      
      expect(validateData({ status: 'active' }, schema).valid).toBe(true);
      expect(validateData({ status: 'inactive' }, schema).valid).toBe(true);
      expect(validateData({ status: 'pending' }, schema).valid).toBe(true);
    });

    it('should reject invalid enum value regardless of inputMode', () => {
      const schemaWithoutRequired = {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      };
      
      const schemaWithRequired = {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            inputMode: 'required'
          }
        }
      };
      
      expect(validateData({ status: 'invalid' }, schemaWithoutRequired).valid).toBe(false);
      expect(validateData({ status: 'invalid' }, schemaWithRequired).valid).toBe(false);
    });

    it('should not add empty string to enum if already present', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['', 'active', 'inactive']
            // Empty string already in enum
          }
        }
      };
      
      // Empty string should be valid
      expect(validateData({ status: '' }, schema).valid).toBe(true);
      expect(validateData({ status: 'active' }, schema).valid).toBe(true);
    });
  });

  describe('inputMode: readonly/disabled/hidden validation', () => {
    it('should NOT validate constraints for empty readonly fields', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { 
            type: 'string', 
            minLength: 5,
            inputMode: 'readonly' 
          }
        }
      };
      
      // Empty readonly field should pass even with minLength constraint
      const result = validateData({ name: '' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should NOT validate constraints for empty disabled fields', () => {
      const schema = {
        type: 'object',
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            minLength: 5,
            inputMode: 'disabled' 
          }
        }
      };
      
      // Empty disabled field should pass even with minLength and format constraints
      const result = validateData({ email: '' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should NOT validate constraints for empty hidden fields', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9]+$',
            minLength: 3,
            inputMode: 'hidden' 
          }
        }
      };
      
      // Empty hidden field should pass even with pattern and minLength constraints
      const result = validateData({ id: '' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate format when readonly field has non-empty value', () => {
      const schema = {
        type: 'object',
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            inputMode: 'readonly' 
          }
        }
      };
      
      // Invalid email should fail validation
      const invalidResult = validateData({ email: 'not-an-email' }, schema);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors?.[0]?.keyword).toBe('format');
      
      // Valid email should pass
      const validResult = validateData({ email: 'user@example.com' }, schema);
      expect(validResult.valid).toBe(true);
    });

    it('should validate format when disabled field has non-empty value', () => {
      const schema = {
        type: 'object',
        properties: {
          url: { 
            type: 'string', 
            format: 'uri',
            inputMode: 'disabled' 
          }
        }
      };
      
      // Invalid URL should fail validation
      const invalidResult = validateData({ url: 'not a url' }, schema);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors?.[0]?.keyword).toBe('format');
      
      // Valid URL should pass
      const validResult = validateData({ url: 'https://example.com' }, schema);
      expect(validResult.valid).toBe(true);
    });

    it('should NOT validate pattern for hidden fields regardless of value', () => {
      const schema = {
        type: 'object',
        properties: {
          code: { 
            type: 'string', 
            pattern: '^[A-Z]{3}$',
            inputMode: 'hidden' 
          }
        }
      };
      
      // Invalid pattern should still pass (pattern not enforced on hidden)
      const invalidResult = validateData({ code: 'ABC123' }, schema);
      expect(invalidResult.valid).toBe(true);
      
      // Valid pattern should pass
      const validResult = validateData({ code: 'ABC' }, schema);
      expect(validResult.valid).toBe(true);
    });

    it('should NOT validate minLength/maxLength for empty readonly fields with required', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { 
            type: 'string', 
            minLength: 5,
            maxLength: 50,
            inputMode: 'readonly' 
          }
        },
        required: ['name']
      };
      
      // Empty readonly field should pass even with schema-level required and minLength/maxLength
      const result = validateData({ name: '' }, schema);
      expect(result.valid).toBe(true);
    });

    it('should NOT validate minLength/maxLength/pattern for readonly fields regardless of value', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { 
            type: 'string', 
            minLength: 5,
            inputMode: 'readonly' 
          }
        }
      };
      
      // Too short value should still pass (minLength not enforced on readonly)
      const invalidResult = validateData({ name: 'abc' }, schema);
      expect(invalidResult.valid).toBe(true);
      
      // Any length should pass
      const validResult = validateData({ name: 'abcde' }, schema);
      expect(validResult.valid).toBe(true);
    });

    it('should handle multiple readonly fields with different validation rules', () => {
      const schema = {
        type: 'object',
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            minLength: 5,
            inputMode: 'readonly' 
          },
          age: {
            type: 'number',
            minimum: 0,
            inputMode: 'readonly'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            inputMode: 'disabled'
          }
        }
      };
      
      // All empty should pass
      const emptyResult = validateData({ email: '', age: null, status: '' }, schema);
      expect(emptyResult.valid).toBe(true);
      
      // Valid values should pass
      const validResult = validateData({ 
        email: 'user@example.com', 
        age: 25,
        status: 'active'
      }, schema);
      expect(validResult.valid).toBe(true);
      
      // Invalid email format should fail (has value, so format is checked)
      const invalidEmailResult = validateData({ 
        email: 'invalid', 
        age: 25,
        status: 'active'
      }, schema);
      expect(invalidEmailResult.valid).toBe(false);
      expect(invalidEmailResult.errors?.[0]?.keyword).toBe('format');
    });
  });

});
