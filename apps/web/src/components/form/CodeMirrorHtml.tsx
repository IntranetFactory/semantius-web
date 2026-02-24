import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'

interface CodeMirrorHtmlProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  disabled?: boolean
  readOnly?: boolean
}

export default function CodeMirrorHtml({ value, onChange, onBlur, disabled, readOnly }: CodeMirrorHtmlProps) {
  return (
    <div 
      className={readOnly ? 'opacity-60' : ''}
      tabIndex={readOnly ? -1 : undefined}
    >
      <CodeMirror
        value={value}
        height="200px"
        extensions={[html()]}
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
