import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Dashboard({ compact }: { compact?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>لوحة التحكم {compact && '(مصغرة)'}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>محتوى لوحة التحكم سيظهر هنا.</p>
      </CardContent>
    </Card>
  )
}