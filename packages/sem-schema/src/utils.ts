import type { SchemaObject } from 'ajv';

/**
 * Known formats - includes both custom and standard formats
 */
const KNOWN_FORMATS = new Set([
  // Custom SemSchema formats (not in JSON Schema spec)
  'json',
  'html',
  'text',
  'code',
  'jsonata',
  // Standard JSON Schema formats (missing from ajv-formats, implemented by us)
  'iri',
  'iri-reference',
  'idn-email',
  'idn-hostname',
  // Standard JSON Schema formats (from ajv-formats)
  'date',
  'time',
  'date-time',
  'duration',
  'uri',
  'uri-reference',
  'uri-template',
  'url',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'regex',
  'uuid',
  'json-pointer',
  'json-pointer-uri-fragment',
  'relative-json-pointer',
  'byte',
  'int32',
  'int64',
  'float',
  'double',
  'password',
  'binary',
]);

/**
 * Schema validation error
 */
export interface SchemaValidationError {
  schemaPath: string;
  message: string;
  keyword?: string;
  value?: any;
}

/**
 * Validate a schema and collect all errors
 * 
 * @param schema - The schema to validate
 * @param path - Current path in schema (for error messages)
 * @returns Array of validation errors (empty if valid)
 */
export function validateSchemaStructure(schema: SchemaObject, path: string = '#'): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (typeof schema !== 'object' || schema === null) {
    return errors;
  }

  // Validate format (AJV only warns about unknown formats, doesn't fail)
  if (schema.format && typeof schema.format === 'string') {
    if (!KNOWN_FORMATS.has(schema.format)) {
      errors.push({
        schemaPath: path,
        message: `Unknown format "${schema.format}"`,
        keyword: 'format',
        value: schema.format
      });
    }
  }

  // Type validation is handled by vocabulary.json with draft-2020-12
  // Custom keyword validation (inputMode, precision, table, grid) is also handled by vocabulary.json

  // Validate properties keyword usage and recursively validate property schemas
  if (schema.properties && typeof schema.properties === 'object') {
    // If properties is present, type must be 'object' (or not specified, which is okay for partial schemas)
    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      // Check if 'object' is one of the types
      if (!types.includes('object')) {
        errors.push({
        schemaPath: path,
          message: `Schema has "properties" keyword but type is "${Array.isArray(schema.type) ? schema.type.join('|') : schema.type}". When "properties" is present, type must be "object" or not specified`,
          keyword: 'properties',
          value: schema.properties
        });
      }
    }

    // Recursively validate each property
    for (const [key, value] of Object.entries(schema.properties)) {
      if (typeof value === 'object' && value !== null) {
        errors.push(...validateSchemaStructure(value as SchemaObject, `${path}/properties/${key}`));
      }
    }
  }

  // Validate items
  if (schema.items && typeof schema.items === 'object') {
    errors.push(...validateSchemaStructure(schema.items as SchemaObject, `${path}/items`));
  }

  // Validate oneOf, anyOf, allOf
  const compositionKeywords = ['oneOf', 'anyOf', 'allOf'] as const;
  for (const keyword of compositionKeywords) {
    const value = schema[keyword];
    if (Array.isArray(value)) {
      value.forEach((subSchema, index) => {
        if (typeof subSchema === 'object' && subSchema !== null) {
          errors.push(...validateSchemaStructure(subSchema as SchemaObject, `${path}/${keyword}/${index}`));
        }
      });
    }
  }

  // Validate not
  if (schema.not && typeof schema.not === 'object') {
    errors.push(...validateSchemaStructure(schema.not as SchemaObject, `${path}/not`));
  }

  // Validate if/then/else
  if (schema.if && typeof schema.if === 'object') {
    errors.push(...validateSchemaStructure(schema.if as SchemaObject, `${path}/if`));
  }
  if (schema.then && typeof schema.then === 'object') {
    errors.push(...validateSchemaStructure(schema.then as SchemaObject, `${path}/then`));
  }
  if (schema.else && typeof schema.else === 'object') {
    errors.push(...validateSchemaStructure(schema.else as SchemaObject, `${path}/else`));
  }

  return errors;
}

/**
 * Preprocess schema to handle default type as string and enum empty string handling
 * 
 * When a schema has a format but no type, this function adds type: "string"
 * This allows schemas like { format: "json" } to work correctly
 * 
 * When a schema has an enum but inputMode is not "required", this function adds "" to the enum
 * This allows empty strings to be valid for optional enum fields
 */
export function preprocessSchema(schema: SchemaObject): SchemaObject {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  const processed: SchemaObject = { ...schema };

  // If format is provided but type is not, default to string
  if (processed.format && !processed.type) {
    processed.type = 'string';
  }

  // If enum is present and inputMode is not "required", add "" to enum if not already present
  // This allows empty strings for optional enum fields
  if (processed.enum && Array.isArray(processed.enum) && (processed as any).inputMode !== 'required') {
    if (!processed.enum.includes('')) {
      processed.enum = ['', ...processed.enum];
    }
  }

  // Process properties recursively
  if (processed.properties && typeof processed.properties === 'object') {
    const newProperties: Record<string, SchemaObject> = {};
    for (const [key, value] of Object.entries(processed.properties)) {
      if (typeof value === 'object' && value !== null) {
        newProperties[key] = preprocessSchema(value as SchemaObject);
      } else {
        newProperties[key] = value as SchemaObject;
      }
    }
    processed.properties = newProperties;
  }

  // Process items if it's an array schema
  if (processed.items && typeof processed.items === 'object') {
    processed.items = preprocessSchema(processed.items as SchemaObject);
  }

  // Process oneOf, anyOf, allOf
  ['oneOf', 'anyOf', 'allOf'].forEach((keyword) => {
    if (Array.isArray(processed[keyword])) {
      processed[keyword] = (processed[keyword] as SchemaObject[]).map(s => preprocessSchema(s));
    }
  });

  return processed;
}
