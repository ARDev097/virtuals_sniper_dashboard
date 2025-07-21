import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function TestPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">Styling Test Page</h1>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This is a test card to verify styling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button>Test Button</Button>
          <Badge>Test Badge</Badge>
          <div className="p-4 bg-muted rounded-lg">
            <p>This should have proper styling with Tailwind CSS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
