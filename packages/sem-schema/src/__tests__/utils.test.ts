import { getDefaultWidthForForm, getDefaultWidthForGrid } from '../utils';

describe('getDefaultWidthForForm', () => {
  it('should return "w" for text format', () => {
    expect(getDefaultWidthForForm('text')).toBe('w');
  });

  it('should return "w" for json format', () => {
    expect(getDefaultWidthForForm('json')).toBe('w');
  });

  it('should return "w" for html format', () => {
    expect(getDefaultWidthForForm('html')).toBe('w');
  });

  it('should return "w" for jsonata format', () => {
    expect(getDefaultWidthForForm('jsonata')).toBe('w');
  });

  it('should return "s" for number type', () => {
    expect(getDefaultWidthForForm(undefined, 'number')).toBe('s');
  });

  it('should return "s" for integer type', () => {
    expect(getDefaultWidthForForm(undefined, 'integer')).toBe('s');
  });

  it('should return "m" for email format', () => {
    expect(getDefaultWidthForForm('email')).toBe('m');
  });

  it('should return "m" for date format', () => {
    expect(getDefaultWidthForForm('date')).toBe('m');
  });

  it('should return "m" for string type', () => {
    expect(getDefaultWidthForForm(undefined, 'string')).toBe('m');
  });

  it('should return "m" when no format or type is given', () => {
    expect(getDefaultWidthForForm()).toBe('m');
  });

  it('should prioritise format over type (text format with number type returns "w")', () => {
    expect(getDefaultWidthForForm('text', 'number')).toBe('w');
  });

  it('should return "m" for boolean type (boolean is not small in forms)', () => {
    expect(getDefaultWidthForForm(undefined, 'boolean')).toBe('m');
  });

  it('should return "m" for code format', () => {
    expect(getDefaultWidthForForm('code')).toBe('m');
  });

  it('should return "m" for reference format with number type (format overrides type)', () => {
    expect(getDefaultWidthForForm('reference', 'number')).toBe('m');
  });

  it('should return "m" for parent format with number type (format overrides type)', () => {
    expect(getDefaultWidthForForm('parent', 'number')).toBe('m');
  });
});

describe('getDefaultWidthForGrid', () => {
  it('should return "s" for boolean type', () => {
    expect(getDefaultWidthForGrid(undefined, 'boolean')).toBe('s');
  });

  it('should return "w" for text format (same as form)', () => {
    expect(getDefaultWidthForGrid('text')).toBe('w');
  });

  it('should return "w" for json format (same as form)', () => {
    expect(getDefaultWidthForGrid('json')).toBe('w');
  });

  it('should return "w" for html format (same as form)', () => {
    expect(getDefaultWidthForGrid('html')).toBe('w');
  });

  it('should return "w" for jsonata format (same as form)', () => {
    expect(getDefaultWidthForGrid('jsonata')).toBe('w');
  });

  it('should return "s" for number type (same as form)', () => {
    expect(getDefaultWidthForGrid(undefined, 'number')).toBe('s');
  });

  it('should return "s" for integer type (same as form)', () => {
    expect(getDefaultWidthForGrid(undefined, 'integer')).toBe('s');
  });

  it('should return "m" for email format (same as form)', () => {
    expect(getDefaultWidthForGrid('email')).toBe('m');
  });

  it('should return "m" for string type (same as form)', () => {
    expect(getDefaultWidthForGrid(undefined, 'string')).toBe('m');
  });

  it('should return "m" when no format or type is given (same as form)', () => {
    expect(getDefaultWidthForGrid()).toBe('m');
  });
});
