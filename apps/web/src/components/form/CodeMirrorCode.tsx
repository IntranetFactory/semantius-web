import CodeMirror from '@uiw/react-codemirror'

interface CodeMirrorCodeProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  disabled?: boolean
  readOnly?: boolean
}

export default function CodeMirrorCode({ value, onChange, onBlur, disabled, readOnly }: CodeMirrorCodeProps) {
  return (
    <div 
      className={readOnly ? 'opacity-60' : ''}
      tabIndex={readOnly ? -1 : undefined}
    >
      <CodeMirror
        value={value}
        height="200px"
        extensions={[]} // No extensions = plain text with line numbers
        onChange={onChange}
        onBlur={onBlur}
        editable={!disabled && !readOnly}
        theme="light"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
        }}
      />
    </div>
  )
}
