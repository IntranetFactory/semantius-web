/**
 * Tests for SemSchema vocabulary definition
 * These tests verify that the custom vocabulary is properly defined and works
 */
import { validateSchema } from '../api';

describe('Vocabulary Definition Tests', () => {
  describe('Schema Validity - Custom formats', () => {
    it('should accept schema with format: json', () => {
      const schema = { type: 'string', format: 'json' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: html', () => {
      const schema = { type: 'string', format: 'html' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: text', () => {
      const schema = { type: 'string', format: 'text' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('Schema Validity - Precision keyword', () => {
    it('should accept schema with precision: 0', () => {
      const schema = { type: 'number', precision: 0 };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with precision: 2', () => {
      const schema = { type: 'number', precision: 2 };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with precision: 4', () => {
      const schema = { type: 'number', precision: 4 };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject schema with invalid precision: -2', () => {
      const schema = { type: 'number', precision: -2 };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('precision');
      expect(result.errors?.[0]?.message).toContain('must be >= 0');
      expect(result.errors?.[0]?.schemaPath).toBe('#');
    });

    it('should reject schema with invalid precision: 1.5', () => {
      const schema = { type: 'number', precision: 1.5 };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('precision');
      expect(result.errors?.[0]?.message).toContain('must be integer');
      expect(result.errors?.[0]?.schemaPath).toBe('#');
    });

    it('should reject schema with invalid precision: 5', () => {
      const schema = { type: 'number', precision: 5 };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('precision');
      expect(result.errors?.[0]?.message).toContain('must be <= 4');
    });
  });

  describe('Schema Validity - Type inference', () => {
    it('should accept schema with only format property (type inferred)', () => {
      const schema = { format: 'json' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('Schema Validity - inputMode keyword', () => {
    it('should accept schema with inputMode: default', () => {
      const schema = { type: 'string', inputMode: 'default' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with inputMode: required', () => {
      const schema = { type: 'string', inputMode: 'required' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with inputMode: readonly', () => {
      const schema = { type: 'string', inputMode: 'readonly' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with inputMode: disabled', () => {
      const schema = { type: 'string', inputMode: 'disabled' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with inputMode: hidden', () => {
      const schema = { type: 'string', inputMode: 'hidden' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject schema with invalid inputMode value', () => {
      const schema = { type: 'string', inputMode: 'invalid' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('inputMode');
      expect(result.errors?.[0]?.message).toContain('must be equal to one of the allowed values');
    });

    it('should reject schema with non-string inputMode', () => {
      const schema = { type: 'string', inputMode: true };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('inputMode');
      expect(result.errors?.[0]?.message).toContain('must be string');
    });
  });

  describe('Schema Validity - required keyword', () => {
    it('should accept schema with valid object-level required array', () => {
      const schema = { 
        type: 'object', 
        properties: { name: { type: 'string' }, email: { type: 'string' } },
        required: ['name', 'email']
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with empty required array', () => {
      const schema = { 
        type: 'object', 
        properties: { name: { type: 'string' } },
        required: []
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject property schema with required: true (invalid at property level)', () => {
      const schema = { type: 'string', required: true };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      // AJV's meta-schema validation will reject this
    });

    it('should reject property schema with required: false (invalid at property level)', () => {
      const schema = { type: 'string', required: false };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      // AJV's meta-schema validation will reject this
    });

    it('should reject schema with required as non-array at object level', () => {
      const schema = { 
        type: 'object', 
        properties: { name: { type: 'string' } },
        required: 'name'  // Should be ['name']
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject schema with required array containing non-string items', () => {
      const schema = { 
        type: 'object', 
        properties: { name: { type: 'string' } },
        required: ['name', 123, true]
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject property schema with format and required: true (invalid at property level)', () => {
      const schema = { format: 'email', required: true };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      // AJV's meta-schema validation will reject this
    });
  });

  describe('Schema Validity - Unknown formats', () => {
    it('should reject schema with unknown format: bratwurst', () => {
      const schema = { type: 'string', format: 'bratwurst' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('Unknown format "bratwurst"');
      expect(result.errors?.[0]?.keyword).toBe('format');
      expect(result.errors?.[0]?.value).toBe('bratwurst');
      expect(result.errors?.[0]?.schemaPath).toBe('#');
    });

    it('should reject schema with unknown format: emailx', () => {
      const schema = { type: 'string', format: 'emailx' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('Unknown format "emailx"');
      expect(result.errors?.[0]?.schemaPath).toBe('#');
    });

    it('should reject schema with unknown format in nested properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'emailx' }
        }
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('Unknown format "emailx"');
      expect(result.errors?.[0]?.schemaPath).toBe('#/properties/email');
    });

    it('should reject schema with unknown format in array items', () => {
      const schema = {
        type: 'array',
        items: { type: 'string', format: 'unknownFormat' }
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('Unknown format "unknownFormat"');
      expect(result.errors?.[0]?.schemaPath).toBe('#/items');
    });
  });

  describe('Schema Validity - Standard formats', () => {
    // Custom SemSchema formats
    it('should accept schema with format: json', () => {
      const schema = { type: 'string', format: 'json' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: html', () => {
      const schema = { type: 'string', format: 'html' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: text', () => {
      const schema = { type: 'string', format: 'text' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // Date/time formats
    it('should accept schema with format: date', () => {
      const schema = { type: 'string', format: 'date' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: time', () => {
      const schema = { type: 'string', format: 'time' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: date-time', () => {
      const schema = { type: 'string', format: 'date-time' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: duration', () => {
      const schema = { type: 'string', format: 'duration' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // URI formats
    it('should accept schema with format: uri', () => {
      const schema = { type: 'string', format: 'uri' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: uri-reference', () => {
      const schema = { type: 'string', format: 'uri-reference' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: iri', () => {
      const schema = { type: 'string', format: 'iri' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: iri-reference', () => {
      const schema = { type: 'string', format: 'iri-reference' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: uri-template', () => {
      const schema = { type: 'string', format: 'uri-template' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: url', () => {
      const schema = { type: 'string', format: 'url' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // Email and hostname formats
    it('should accept schema with format: email', () => {
      const schema = { type: 'string', format: 'email' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: idn-email', () => {
      const schema = { type: 'string', format: 'idn-email' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: hostname', () => {
      const schema = { type: 'string', format: 'hostname' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: idn-hostname', () => {
      const schema = { type: 'string', format: 'idn-hostname' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // IP address formats
    it('should accept schema with format: ipv4', () => {
      const schema = { type: 'string', format: 'ipv4' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: ipv6', () => {
      const schema = { type: 'string', format: 'ipv6' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // Regex format
    it('should accept schema with format: regex', () => {
      const schema = { type: 'string', format: 'regex' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: uuid', () => {
      const schema = { type: 'string', format: 'uuid' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // JSON Pointer formats
    it('should accept schema with format: json-pointer', () => {
      const schema = { type: 'string', format: 'json-pointer' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: json-pointer-uri-fragment', () => {
      const schema = { type: 'string', format: 'json-pointer-uri-fragment' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: relative-json-pointer', () => {
      const schema = { type: 'string', format: 'relative-json-pointer' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // Binary/encoding formats
    it('should accept schema with format: byte', () => {
      const schema = { type: 'string', format: 'byte' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: binary', () => {
      const schema = { type: 'string', format: 'binary' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // Number formats
    it('should accept schema with format: int32', () => {
      const schema = { type: 'string', format: 'int32' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: int64', () => {
      const schema = { type: 'string', format: 'int64' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: float', () => {
      const schema = { type: 'string', format: 'float' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with format: double', () => {
      const schema = { type: 'string', format: 'double' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    // Security formats
    it('should accept schema with format: password', () => {
      const schema = { type: 'string', format: 'password' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('Schema Validity - Invalid types', () => {
    it('should reject schema with invalid type', () => {
      const schema = { type: 'stringy' };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('type');
      expect(result.errors?.[0]?.message).toContain('must be equal to one of the allowed values');
      expect(result.errors?.[0]?.schemaPath).toBe('#');
    });

    it('should reject schema with invalid type in nested property', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'stringx' }
        }
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('type');
      expect(result.errors?.[0]?.message).toContain('must be equal to one of the allowed values');
    });
  });

  describe('Schema Validity - Properties with wrong type', () => {
    it('should reject schema with type: string but has properties object', () => {
      const schema = {
        type: 'string',
        properties: {
          value: {
            type: 'string'
          },
          type: {
            type: 'string'
          }
        }
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('properties');
      expect(result.errors?.[0]?.schemaPath).toBe('#');
    });

    it('should accept schema with properties but no type (partial schema)', () => {
      // When type is not specified, properties is allowed (common in partial schemas)
      const schema = {
        properties: {
          value: {
            type: 'string'
          },
          type: {
            type: 'string'
          }
        }
      };
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
    });

    it('should reject complex schema from issue with incorrect email property', () => {
      const schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Person",
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "age": {
            "type": "integer",
            "minimum": 0,
            "maximum": 120
          },
          "email": {
            "type": "string",
            "properties": {
              "value": {
                "type": "string"
              },
              "type": {
                "type": "string"
              }
            }
          },
          "isActive": {
            "type": "boolean"
          }
        },
        "required": ["name", "email"],
        "additionalProperties": false
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      // Should have an error on the email property
      const emailError = result.errors?.find(e => e.schemaPath.includes('email'));
      expect(emailError).toBeDefined();
      expect(emailError?.message).toContain('properties');
    });
  });

  describe('Schema Validity - Multiple errors', () => {
    it('should report all errors in a schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'stringy',
            required: true  // Unknown keyword - ignored
          },
          email: {
            type: 'stringx',
            format: 'emailx'
          },
          age: {
            type: 'number',
            precision: 1.2
          }
        },
        required: ['name']
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);  // emailx format (type errors caught by AJV at compile time)
      
      // Check that all errors are present
      const errorMessages = result.errors?.map(e => e.message).join(' ');
      const errorPaths = result.errors?.map(e => e.schemaPath).join(' ');
      
      expect(errorMessages).toContain('Unknown format "emailx"');
    });
  });

  describe('Schema Validity - Table property', () => {
    it('should accept schema with table object containing all required properties', () => {
      const schema = {
        type: 'object',
        title: 'Person',
        table: {
          table_name: 'persons',
          singular: 'person',
          plural: 'persons',
          singular_label: 'Person',
          plural_label: 'Persons',
          icon_url: '/icons/person.svg',
          description: 'A person or user profile'
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with table object containing minimal properties', () => {
      const schema = {
        type: 'object',
        title: 'Person',
        table: {
          table_name: 'persons'
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema without table property', () => {
      const schema = {
        type: 'object',
        title: 'Person',
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with empty table object (all properties optional)', () => {
      const schema = {
        type: 'object',
        title: 'Person',
        table: {},
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject schema with table_name as number', () => {
      const schema = {
        type: 'object',
        title: 'Person',
        table: {
          table_name: 123,
          singular: true
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThanOrEqual(1);
      expect(result.errors?.[0]?.message).toContain('table');
      expect(result.errors?.[0]?.message).toContain('must be string');
    });

    it('should reject schema with table as non-object', () => {
      const schema = {
        type: 'object',
        title: 'Person',
        table: 'invalid',
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('table');
      expect(result.errors?.[0]?.message).toContain('must be object');
    });

    it('should reject schema with multiple invalid table properties', () => {
      const schema = {
        type: 'object',
        title: 'Person',
        table: {
          table_name: 123,
          singular: false,
          plural: null,
          icon_url: 456
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThanOrEqual(1); // AJV may combine or separate errors
      
      const errorMessages = result.errors?.map(e => e.message).join(' ');
      expect(errorMessages).toContain('table');
      expect(errorMessages).toContain('must be string');
    });
  });

  describe('Schema Validity - Grid property', () => {
    it('should accept schema with grid object containing all properties', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {
          sortField: 'name',
          sortOrder: 'asc'
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with grid object with sortOrder desc', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {
          sortField: 'createdAt',
          sortOrder: 'desc'
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with grid object containing only sortField', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {
          sortField: 'name'
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema with empty grid object (all properties optional)', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {},
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept schema without grid property', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject schema with grid as non-object', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: 'invalid',
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('grid');
      expect(result.errors?.[0]?.message).toContain('must be object');
    });

    it('should reject schema with sortField as number', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {
          sortField: 123
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('sortField');
      expect(result.errors?.[0]?.message).toContain('must be string');
    });

    it('should reject schema with invalid sortOrder value', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {
          sortField: 'name',
          sortOrder: 'ascending'
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('sortOrder');
      expect(result.errors?.[0]?.message).toContain('must be equal to one of the allowed values');
    });

    it('should reject schema with sortOrder as number', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {
          sortField: 'name',
          sortOrder: 1
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('sortOrder');
      expect(result.errors?.[0]?.message).toContain('must be string');
    });

    it('should reject schema with multiple invalid grid properties', () => {
      const schema = {
        type: 'object',
        title: 'Users',
        grid: {
          sortField: 123,
          sortOrder: 'invalid'
        },
        properties: {
          name: { type: 'string' }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThanOrEqual(1); // AJV may combine errors
      
      const errorMessages = result.errors?.map(e => e.message).join(' ');
      expect(errorMessages).toContain('sortField');
      expect(errorMessages).toContain('sortOrder');
    });
  });

  describe('Unknown Keywords - Should be ignored', () => {
    it('should reject "required: true" in property schema (not a valid unknown keyword)', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            title: 'Name',
            required: true  // Invalid - 'required' is a known JSON Schema keyword
          }
        },
        required: ['name']
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should ignore unknown keyword "bratwurst: false" in property schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            title: 'Name',
            bratwurst: false  // Truly unknown keyword - ignored
          },
          email: {
            type: 'string',
            format: 'email',
            lebercheese: 'yes'  // Truly unknown keyword - ignored
          }
        }
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should handle complex schema with unknown keywords (but reject invalid required)', () => {
      const schema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            title: 'Email',
            bratwurst: false  // Unknown - ignored
          },
          age: {
            type: 'number',
            precision: 0,
            title: 'Age',
            lebercheese: 'yes'  // Unknown - ignored
          }
        },
        required: ['email']
      };
      
      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });
});
