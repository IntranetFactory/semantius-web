# SemSchema

Custom JSON Schema vocabulary (SemSchema) with additional validation features for use with AJV.

## Features

### Custom Formats
- **`json`**: Validates parseable JSON strings
- **`html`**: Validates HTML markup (requires HTML tags)
- **`text`**: Allows multiline text strings

### Standard Formats
SemSchema also supports all standard JSON Schema formats via `ajv-formats`:
- **Date/Time**: `date`, `time`, `date-time`, `duration`
- **Network**: `email`, `hostname`, `ipv4`, `ipv6`, `uri`, `uri-reference`, `url`
- **Other**: `uuid`, `regex`, `json-pointer`, and more

### Format Validation
- **Unknown formats are rejected**: Using an unrecognized format (e.g., `emailx` instead of `email`) will throw an error during schema validation
- This prevents typos and ensures all formats are properly validated

### Custom Keywords

#### ⚠️ CRITICAL: `inputMode` Keyword for Required Fields

SemSchema uses the **`inputMode: "required"`** keyword that serves BOTH UI and validation purposes:

- **UI Purpose**: Displays red asterisk (*) next to field label in forms
- **Validation Purpose**: Validates MEANINGFUL values (not just existence)
  - `null` → FAILS validation
  - `undefined` → FAILS validation  
  - `""` (empty string) → FAILS validation
  - **Applies to ALL string types** (json, html, text, date, email, enum, or any format)

**Valid `inputMode` values**:
- `"default"` - Normal field (no special UI or validation)
- `"required"` - Shows asterisk AND validates non-empty values
- `"readonly"` - Field is read-only
- `"disabled"` - Field is disabled
- `"hidden"` - Field is hidden from UI

**Example**:
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "inputMode": "required"    // ← Shows asterisk + validates non-empty
    },
    "email": {
      "type": "string",
      "format": "email",
      "inputMode": "required"    // ← Also validates empty string
    },
    "notes": {
      "type": "string",
      "inputMode": "readonly"    // ← Read-only field
    }
  }
}
```

**Important for Form Validation**: The `inputMode: "required"` keyword is checked during data validation in the `validateData` function, and form components use it to display asterisks and determine field behavior.

#### `precision` Keyword
- **`precision`**: Integer (0-4) limiting decimal places in numbers
  - Example: `precision: 2` allows 99.99 but rejects 99.999

### Type Inference
- When `format` is provided without `type`, defaults to `type: "string"`
- Allows schemas like `{ "format": "json" }` without explicit type declaration

## Installation

```bash
pnpm add sem-schema
```

## Usage

### Basic Usage

```typescript
import { validateSchema, validateData } from 'sem-schema';

// Define schema
const schema = {
  type: 'object',
  properties: {
    email: { 
      type: 'string',
      format: 'email',
      inputMode: 'required'  // Shows asterisk + validates non-empty
    },
    config: { 
      format: 'json'  // Type: string inferred
    },
    price: { 
      type: 'number', 
      precision: 2  // Up to 2 decimal places
    }
  }
};

// Validate the schema itself
validateSchema(schema); // Returns true or throws error

// Validate data against the schema
const result = validateData({ 
  email: 'user@example.com', 
  config: '{"key":"value"}', 
  price: 99.99 
}, schema);

console.log(result.valid); // true
console.log(result.errors); // null

// Invalid data
const invalid = validateData({ 
  email: '', 
  config: '{invalid}', 
  price: 99.999 
}, schema);

console.log(invalid.valid); // false
console.log(invalid.errors); // Array of error objects
```

## API

### `validateSchema(schemaJson)`

Validates that a JSON Schema is valid according to SemSchema vocabulary.

**Parameters**:
- `schemaJson`: SchemaObject - The JSON Schema to validate

**Returns**: `true` if valid

**Throws**: Error if schema is invalid

### `validateData(data, schemaJson)`

Validates data against a JSON Schema using SemSchema vocabulary.

**Parameters**:
- `data`: any - The data to validate
- `schemaJson`: SchemaObject - The JSON Schema to validate against

**Returns**: Object with:
- `valid`: boolean - true if data is valid, false otherwise
- `errors`: array | null - Array of validation error objects if invalid, null if valid

## Project Structure

```
sem-schema/
├── src/
│   ├── formats/           # Custom format validators (internal)
│   ├── keywords/          # Custom keyword validators (internal)
│   ├── __tests__/
│   │   ├── vocabulary.test.ts      # Vocabulary definition tests
│   │   └── data-validation.test.ts # Data validation tests
│   ├── api.ts             # Public API
│   ├── validator.ts       # Validator creation (internal)
│   ├── utils.ts           # Utilities (internal)
│   ├── vocabulary.json    # Vocabulary definition (internal)
│   └── index.ts           # Main exports
└── dist/                  # Compiled output
```

## Testing

```bash
pnpm test          # Run all tests
pnpm test:watch    # Run tests in watch mode
```

The test suite includes:
- **Vocabulary Definition Tests**: Verify schemas with custom keywords can be compiled
- **Data Validation Tests**: Verify data correctly validates against schemas

## Extending SemSchema

SemSchema is designed to be extensible. You can add custom formats and keywords to suit your needs.

### Supported Formats

**Custom SemSchema formats (3):**
- `json`, `html`, `text`

**Standard JSON Schema formats from ajv-formats (24):**
- **Date/time:** `date`, `time`, `date-time`, `duration`
- **URI:** `uri`, `uri-reference`, `uri-template`, `url`
- **Email/Network:** `email`, `hostname`, `ipv4`, `ipv6`
- **Other:** `regex`, `uuid`, `json-pointer`, `json-pointer-uri-fragment`, `relative-json-pointer`, `byte`, `binary`, `int32`, `int64`, `float`, `double`, `password`

The complete list is maintained in `KNOWN_FORMATS` in [src/utils.ts](src/utils.ts).

### Adding a Custom Format

Follow these steps to add a new custom format (e.g., `phone`):

#### Step 1: Add to KNOWN_FORMATS

Edit `src/utils.ts` and add your format to the set:

```typescript
const KNOWN_FORMATS = new Set([
  // Custom SemSchema formats
  'json',
  'html',
  'text',
  'phone', // ← Add your format here
  // Standard JSON Schema formats (from ajv-formats)
  // ...
]);
```

#### Step 2: Create format validator

Create `src/formats/phone.ts`:

```typescript
import type { Format } from 'ajv';

/**
 * Validates phone number in E.164 format
 */
export const phoneFormat: Format = {
  validate: (data: string): boolean => {
    // E.164 format: +[country code][number]
    return /^\+?[1-9]\d{1,14}$/.test(data);
  }
};
```

#### Step 3: Export from formats/index.ts

```typescript
export { jsonFormat } from './json';
export { htmlFormat } from './html';
export { textFormat } from './text';
export { phoneFormat } from './phone'; // ← Add export
```

#### Step 4: Register in validator.ts

Edit `src/validator.ts` and register your format:

```typescript
import { jsonFormat, htmlFormat, textFormat, phoneFormat } from './formats';

export function createSemSchemaValidator(): Ajv {
  // ... existing setup code
  
  // Add custom formats
  ajv.addFormat('json', jsonFormat);
  ajv.addFormat('html', htmlFormat);
  ajv.addFormat('text', textFormat);
  ajv.addFormat('phone', phoneFormat); // ← Add format
  
  // ...
}
```

#### Step 5: Add schema validation test

Add to `src/__tests__/vocabulary.test.ts`:

```typescript
describe('Schema Validity - Standard formats', () => {
  // ... existing tests
  
  it('should accept schema with format: phone', () => {
    const schema = { type: 'string', format: 'phone' };
    const result = validateSchema(schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeNull();
  });
});
```

#### Step 6: Add data validation tests

Add to `src/__tests__/data-validation.test.ts`:

```typescript
describe('Format Validation - phone', () => {
  it('should validate phone format with valid E.164 number', () => {
    const schema = { type: 'string', format: 'phone' };
    const result = validateData('+12025551234', schema);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid phone number', () => {
    const schema = { type: 'string', format: 'phone' };
    const result = validateData('not-a-phone', schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
```

**That's it!** Your format will now:
- ✅ Be recognized as valid in schemas
- ✅ Validate data correctly
- ✅ Reject unknown formats and catch typos
- ✅ Be fully tested

### Adding a Custom Keyword

To add a new custom keyword (e.g., `maxWords`):

#### Step 1: Create keyword file

Create `src/keywords/maxWords.ts`:

```typescript
import type Ajv from 'ajv';
import type { KeywordDefinition } from 'ajv';

/**
 * Custom keyword that limits the number of words in a string
 */
export const maxWordsKeyword: KeywordDefinition = {
  keyword: 'maxWords',
  type: 'string',
  schemaType: 'number',
  compile(max: number) {
    return function validate(data: string): boolean {
      const wordCount = data.trim().split(/\s+/).length;
      if (wordCount > max) {
        validate.errors = [{
          keyword: 'maxWords',
          message: `must have at most ${max} words`,
          params: { max, actual: wordCount }
        }];
        return false;
      }
      return true;
    };
  },
  errors: true
};
```

#### Step 2: Export from keywords/index.ts

```typescript
export { precisionKeyword } from './precision';
export { maxWordsKeyword } from './maxWords'; // ← Add export
```

#### Step 3: Register in validator.ts

```typescript
import { precisionKeyword, maxWordsKeyword } from './keywords';

export function createSemSchemaValidator(): Ajv {
  // ... existing setup
  
  ajv.addKeyword(precisionKeyword);
  ajv.addKeyword(maxWordsKeyword); // ← Add keyword
  
  // ...
}
```

#### Step 4: Add validation in utils.ts (optional)

If you need schema-level validation for your keyword's value:

```typescript
export function validateSchemaStructure(schema: SchemaObject, path: string = '#'): SchemaValidationError[] {
  // ... existing validations
  
  // Validate maxWords keyword
  if (schema.maxWords !== undefined) {
    if (typeof schema.maxWords !== 'number') {
      errors.push({
        schemaPath: path,
        message: 'maxWords must be a number',
        keyword: 'maxWords',
        value: schema.maxWords
      });
    } else if (schema.maxWords < 1 || !Number.isInteger(schema.maxWords)) {
      errors.push({
        schemaPath: path,
        message: 'maxWords must be a positive integer',
        keyword: 'maxWords',
        value: schema.maxWords
      });
    }
  }
  
  return errors;
}
```

#### Step 5: Add tests

Add both schema and data validation tests as shown in the format example.

### Testing Your Extensions

Always add comprehensive tests:

- **Schema validation tests** (`vocabulary.test.ts`): Verify schemas with your extension are accepted/rejected correctly
- **Data validation tests** (`data-validation.test.ts`): Verify data validates correctly against your extension
- Test both valid and invalid cases
- Test edge cases and error messages

## Vocabulary Definition

The vocabulary includes:
- Custom formats: `json`, `html`, `text`
- Standard formats: All formats from `ajv-formats` (email, date, uri, uuid, etc.)
- Custom keywords: `required` (property-level), `precision`

## License

ISC
