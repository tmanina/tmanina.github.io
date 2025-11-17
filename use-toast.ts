import { useState, useCallback } from 'react'

export const useToast = () => {
  const [toast, setToast] = useState<{ title: string; variant?: 'default' | 'destructive'; duration?: number } | null>(null)

  const showToast = useCallback((props: { title: string; variant?: 'default' | 'destructive'; duration?: number }) => {
    setToast(props)
    setTimeout(() => setToast(null), props.duration || 3000)
  }, [])

  return { toast, toast: showToast }
}