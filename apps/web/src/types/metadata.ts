// JSON Schema property definition
export interface JsonSchemaProperty {
  type: string | string[]
  required?: boolean
  title?: string
  description?: string
  format?: string
  enum?: string[]
  default?: unknown
  minimum?: number
  maximum?: number
  pattern?: string
  items?: JsonSchemaProperty
  additionalProperties?: boolean | JsonSchemaProperty
  // Foreign key reference fields (Sem Schema extension)
  reference_table?: string
  reference_table_id_column?: string
  reference_table_label_column?: string
  reference_delete_mode?: string
}

// Sem Schema table metadata
export interface SemSchemaTable {
  table_name: string
  singular: string
  plural: string
  singular_label: string
  plural_label: string
  icon_url?: string
  description?: string
  module_id?: number
  view_permission?: string | null
  edit_permission?: string | null
  id_column: string
  label_column: string
  managed?: boolean
  searchable?: boolean
  created_at?: string
  updated_at?: string
}

export type { SemSchemaTable as TableMetadata }

// Entity metadata with JSON Schema support
export interface EntityMetadata {
  $schema?: string
  $id?: string
  $vocabulary?: Record<string, boolean>
  title?: string
  description?: string
  type?: string
  additionalProperties?: boolean
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  table?: SemSchemaTable
  
  // Legacy fields for backward compatibility
  table_name?: string
  label?: string
  fields?: Array<{
    name: string
    type: string
    required: boolean
  }>
}

export interface ViewProps {
  moduleId: string
  table_name: string
  recordId: string
  metadata: EntityMetadata
}
