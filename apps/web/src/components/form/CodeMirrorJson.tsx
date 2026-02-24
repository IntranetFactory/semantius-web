import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'

interface CodeMirrorJsonProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  disabled?: boolean
  readOnly?: boolean
}

export default function CodeMirrorJson({ value, onChange, onBlur, disabled, readOnly }: CodeMirrorJsonProps) {
  return (
    <div 
      className={readOnly ? 'opacity-60' : ''}
      tabIndex={readOnly ? -1 : undefined}
    >
      <CodeMirror
        value={value}
        height="200px"
        extensions={[json()]}
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
