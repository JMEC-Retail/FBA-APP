"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Search, ArrowLeft, LifeBuoy } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 relative">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <div className="text-6xl font-bold text-primary/30">404</div>
              </div>
              <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full animate-pulse"></div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
              Oops! The page you&apos;re looking for seems to have vanished into the shipping void.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Error Code: <span className="font-mono font-semibold text-foreground">HTTP 404</span>
              </p>
              <p className="text-xs text-muted-foreground">
                The requested resource could not be found on this server.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-center mb-4">What can you do?</h3>
              
              <div className="grid gap-3">
                <Link href="/dashboard">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="outline">
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Return to Dashboard</p>
                        <p className="text-xs text-muted-foreground">Get back to your main workspace</p>
                      </div>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors rotate-180" />
                  </Button>
                </Link>

                <Button 
                  onClick={() => window.history.back()} 
                  className="w-full h-auto p-4 flex items-center justify-between group" 
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Search className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Go Back</p>
                      <p className="text-xs text-muted-foreground">Return to the previous page</p>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Button>

                <Link href="/auth/signin">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="ghost">
                    <div className="flex items-center space-x-3">
                      <LifeBuoy className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Sign In Again</p>
                        <p className="text-xs text-muted-foreground">Check your authentication status</p>
                      </div>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors rotate-180" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Check URL</p>
                  <p className="text-xs text-muted-foreground">Verify the address is correct</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Use Search</p>
                  <p className="text-xs text-muted-foreground">Find what you need quickly</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <LifeBuoy className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Get Help</p>
                  <p className="text-xs text-muted-foreground">Contact support if needed</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact our support team with this error code.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Timestamp: {new Date().toISOString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="m17 5-9 3-3-1 9-3 3 1z" />
      <path d="M21 8.5v7c0 .6-.4 1.2-1 1.4l-8 3.3c-.3.1-.7.1-1 0l-8-3.3c-.6-.2-1-.8-1-1.4v-7" />
    </svg>
  )
}