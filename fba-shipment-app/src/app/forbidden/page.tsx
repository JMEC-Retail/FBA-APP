"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, Home, UserCheck, AlertCircle, Mail, Key } from "lucide-react"

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 relative">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
                <ShieldX className="w-16 h-16 text-orange-500/30" />
              </div>
              <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-orange-100/50 to-transparent rounded-full animate-pulse"></div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              Access Forbidden
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
              You don&apos;t have the required permissions to access this page or perform this action.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <p className="text-sm font-semibold text-orange-700">Permission Denied</p>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                Error Code: <span className="font-mono font-semibold text-foreground">HTTP 403</span>
              </p>
              <p className="text-xs text-muted-foreground">
                You don&apos;t have sufficient privileges for this resource
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Timestamp: {new Date().toISOString()}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-center mb-4">What You Can Do</h3>
              
              <div className="grid gap-3">
                <Link href="/dashboard">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="default">
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">Return to Dashboard</p>
                        <p className="text-xs opacity-90">Go back to your authorized workspace</p>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Button 
                  onClick={() => window.history.back()} 
                  className="w-full h-auto p-4 flex items-center justify-between group" 
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div className="text-left">
                      <p className="font-medium">Go Back</p>
                      <p className="text-xs text-muted-foreground">Return to the previous page</p>
                    </div>
                  </div>
                </Button>

                <Link href="/auth/signin">
                  <Button className="w-full h-auto p-4 flex items-center justify-between group" variant="outline">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">Sign In Again</p>
                        <p className="text-xs text-muted-foreground">Check your account permissions</p>
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
                    <Key className="h-4 w-4 text-orange-500" />
                    <span>Permission Levels</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Admin</span>
                      </span>
                      <span className="text-muted-foreground">Full Access</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Shipper</span>
                      </span>
                      <span className="text-muted-foreground">Shipments & Boxes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Packer</span>
                      </span>
                      <span className="text-muted-foreground">Box Management</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Contact your admin to request permission changes.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <span>Request Access</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    If you believe this is an error, contact your system administrator.
                  </p>
                  <div className="space-y-2 text-xs">
                    <p><strong>Your Admin:</strong> Check your company directory</p>
                    <p><strong>IT Support:</strong> it-support@company.com</p>
                    <p><strong>System Owner:</strong> fba-admin@jmec.com</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => window.location.href = `mailto:admin@jmec-fba.com?subject=Access Request&body=I need access to a resource in the FBA Shipment Management System. I was trying to access ${window.location.pathname} and received a 403 Forbidden error.`}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Request Access
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="border-t pt-6">
              <div className="space-y-4">
                <h4 className="font-medium text-center text-sm">Common Scenarios</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                      <ShieldX className="h-5 w-5 text-orange-600" />
                    </div>
                    <h5 className="text-xs font-medium">Role Restriction</h5>
                    <p className="text-xs text-muted-foreground">
                      Your current role doesn&apos;t include access to this feature
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                      <Key className="h-5 w-5 text-orange-600" />
                    </div>
                    <h5 className="text-xs font-medium">Expired Permission</h5>
                    <p className="text-xs text-muted-foreground">
                      Your access may have been temporarily revoked
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <h5 className="text-xs font-medium">System Update</h5>
                    <p className="text-xs text-muted-foreground">
                      Recent changes may have affected your access levels
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                <strong>Security Notice:</strong> Access attempts are logged for security purposes.
              </p>
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact your administrator immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}