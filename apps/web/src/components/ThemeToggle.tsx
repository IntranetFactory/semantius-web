import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="h-5 w-5" />
    }
    return <Sun className="h-5 w-5" />
  }

  const getLabel = () => {
    if (theme === 'dark') return 'Dark'
    if (theme === 'light') return 'Light'
    return 'System'
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`Theme: ${getLabel()}`}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme ({getLabel()})</span>
    </Button>
  )
}
