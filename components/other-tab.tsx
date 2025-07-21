import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

export function OtherTab() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Construction className="h-6 w-6" />
        </div>
        <CardTitle>Coming Soon</CardTitle>
        <CardDescription>Additional analytics and insights will be available here in future updates.</CardDescription>
      </CardHeader>
      {/* <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">We're working on bringing you more advanced features including:</p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>• Advanced portfolio tracking</li>
          <li>• Risk assessment metrics</li>
          <li>• Social sentiment analysis</li>
          <li>• Automated alerts and notifications</li>
        </ul>
      </CardContent> */}
    </Card>
  )
}
