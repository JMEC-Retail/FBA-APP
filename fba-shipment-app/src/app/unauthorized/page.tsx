"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Shield, Home, LifeBuoy, Clock, Lock } from "lucide-react"

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 relative">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Lock className="w-16 h-16 text-primary/30" />
              </div>
              <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full animate-pulse"></div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              Authentication Required
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
              You need to sign in to access this page. Please authenticate to continue using the FBA shipment management system.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-primary">Access Denied</p>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                Error Code: <span className="font-mono font-semibold text-foreground">HTTP 401</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Authentication required to access this resource
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Timestamp: {new Date().toISOString()}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-center mb-4">Next Steps</h3>
              
              <div className="grid gap-3">
                <Link href="/auth/signin">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="default">
                    <div className="flex items-center space-x-3">
                      <LogIn className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">Sign In</p>
                        <p className="text-xs opacity-90">Access your account securely</p>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link href="/auth/signup">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="outline">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Create Account</p>
                        <p className="text-xs text-muted-foreground">Register for a new account</p>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link href="/">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="outline">
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Go to Homepage</p>
                        <p className="text-xs text-muted-foreground">Return to the landing page</p>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm mb-2">Why this happens?</h4>
                  <p className="text-xs text-muted-foreground">
                    Your session may have expired or you haven&apos;t signed in yet
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm mb-2">Session Timeout</h4>
                  <p className="text-xs text-muted-foreground">
                    For security, sessions automatically expire after inactivity
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm mb-2">Stay Protected</h4>
                  <p className="text-xs text-muted-foreground">
                    Authentication keeps your data and shipments secure
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="border-t pt-6">
              <div className="space-y-4">
                <h4 className="font-medium text-center text-sm">Authentication Benefits</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-xs font-medium">Secure Access</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium">Manage Shipments</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium">Team Collaboration</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-xs font-medium">Reports & Analytics</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                <strong>Need help?</strong> If you&apos;re having trouble signing in, please contact our support team.
              </p>
              <Button variant="ghost" size="sm" className="text-xs">
                <LifeBuoy className="h-3 w-3 mr-1" />
                Contact Support
              </Button>
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

function Users({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m22 21-3.5-3.5a2.121 2.121 0 0 0-3 0L12 21" />
    </svg>
  )
}

function FileText({ className }: { className?: string }) {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  )
}