"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, RefreshCw, AlertTriangle, Mail, Bug } from "lucide-react"

export default function ServerError() {
  const handleRetry = () => {
    window.location.reload()
  }

  const errorId = "ERR-SERVER-500"
  const timestamp = new Date().toISOString()
  const timestampLocal = new Date().toLocaleString()

  return (
    <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 relative">
              <div className="w-32 h-32 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-full flex items-center justify-center">
                <div className="text-6xl font-bold text-destructive/30">500</div>
              </div>
              <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-destructive/10 to-transparent rounded-full animate-pulse"></div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              Server Error
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
              Something went wrong on our end. Our team has been automatically notified and is working to fix this issue.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-sm font-semibold text-destructive">Internal Server Error</p>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                Error Code: <span className="font-mono font-semibold text-foreground">HTTP 500</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Error ID: <span className="font-mono font-semibold text-foreground">{errorId}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Timestamp: {timestamp}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Timestamp: {timestamp}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-center mb-4">Immediate Actions</h3>
              
              <div className="grid gap-3">
                <Button 
                  onClick={handleRetry} 
                  className="w-full h-auto p-4 flex items-center justify-between group" 
                  variant="default"
                >
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Try Again</p>
                      <p className="text-xs opacity-90">Refresh the page to retry</p>
                    </div>
                  </div>
                </Button>

                <Link href="/dashboard">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="outline">
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Go to Dashboard</p>
                        <p className="text-xs text-muted-foreground">Return to the main interface</p>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link href="/auth/signin">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="outline">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Sign Out & In Again</p>
                        <p className="text-xs text-muted-foreground">Reset your session</p>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-muted/30 border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>Contact Support</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    If the problem persists, please contact our technical support team.
                  </p>
                  <div className="space-y-2 text-xs">
                    <p><strong>Email:</strong> support@jmec-fba.com</p>
                    <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                    <p><strong>Hours:</strong> Mon-Fri, 9AM-6PM EST</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => {
                    const currentTimestamp = new Date().toISOString()
                    window.location.href = `mailto:support@jmec-fba.com?subject=Server Error ${errorId}&body=I encountered a server error on ${currentTimestamp}. Error ID: ${errorId}`
                  }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Bug className="h-4 w-4 text-primary" />
                    <span>Report This Issue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    Help us improve by reporting this technical issue.
                  </p>
                  <div className="space-y-2 text-xs">
                    <p><strong>What happened:</strong> Server encountered an unexpected error</p>
                    <p><strong>When:</strong> {timestampLocal}</p>
                    <p><strong>Error ID:</strong> {errorId}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => window.open('https://github.com/sst/opencode/issues', '_blank')}
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Report on GitHub
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="border-t pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong>What we&apos;re doing:</strong> Our engineering team has been automatically notified of this error and is working to resolve it.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Common causes:</strong> Temporary server overload, database connectivity issues, or system maintenance.
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                  <span>System Status: </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>Investigating</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                We apologize for the inconvenience and appreciate your patience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}