import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "FBA Shipment Management System - Streamline Your Amazon Logistics",
  description: "Professional FBA shipment management platform for Admins, Shippers, and Packers. Manage inventory, track shipments, and optimize your Amazon FBA operations.",
  keywords: "FBA, Amazon, Shipment Management, Inventory, Logistics, Shipping",
  authors: [{ name: "FBA Shipment App" }],
  openGraph: {
    title: "FBA Shipment Management System",
    description: "Streamline your Amazon FBA operations with our comprehensive shipment management platform.",
    type: "website",
  },
}

interface RoleFeature {
  icon: string
  title: string
  description: string
  benefits: string[]
}

const roleFeatures: Record<string, RoleFeature[]> = {
  ADMIN: [
    {
      icon: "👥",
      title: "User Management",
      description: "Complete control over user accounts and permissions",
      benefits: ["Create and manage user accounts", "Assign roles and permissions", "Monitor user activity"]
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Comprehensive reporting and business insights",
      benefits: ["Real-time shipment tracking", "Performance metrics", "Custom reports generation"]
    },
    {
      icon: "🔒",
      title: "Security & Compliance",
      description: "Enterprise-grade security and audit trails",
      benefits: ["Activity logging", "Secure access control", "Compliance monitoring"]
    }
  ],
  SHIPPER: [
    {
      icon: "📦",
      title: "Shipment Management",
      description: "Efficiently create and track FBA shipments",
      benefits: ["Bulk CSV import", "Real-time tracking", "Automated notifications"]
    },
    {
      icon: "🔗",
      title: "Picker Links",
      description: "Generate secure links for packers",
      benefits: ["Shareable picker links", "Access control", "Expiration management"]
    },
    {
      icon: "📄",
      title: "Documentation",
      description: "Complete shipping documentation",
      benefits: ["Shipping labels", "Customs forms", "Packing slips"]
    }
  ],
  PACKER: [
    {
      icon: "📋",
      title: "Box Management",
      description: "Organize and manage packing operations",
      benefits: ["Box tracking", "Item management", "Status updates"]
    },
    {
      icon: "✅",
      title: "Quality Control",
      description: "Ensure shipment accuracy and quality",
      benefits: ["Item verification", "Photo documentation", "Comment system"]
    },
    {
      icon: "📱",
      title: "Mobile Operations",
      description: "Work efficiently from any device",
      benefits: ["Mobile-friendly interface", "Barcode scanning", "Quick updates"]
    }
  ]
}

export default async function Home() {
  const session = await auth()

  // Redirect authenticated users to appropriate dashboard
  if (session?.user) {
    switch (session.user.role) {
      case "ADMIN":
        redirect("/dashboard/users")
      case "SHIPPER":
        redirect("/dashboard/upload")
      case "PACKER":
        redirect("/dashboard/shipments")
      default:
        redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">FBA Shipment Manager</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#roles" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">User Roles</a>
                <a href="#benefits" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Benefits</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your
              <span className="text-blue-600"> Amazon FBA </span>
              Operations
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional shipment management platform designed for Admins, Shippers, and Packers. 
              Manage inventory, track shipments, and optimize your FBA workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image/Illustration placeholder */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-semibold">Smart Shipment Tracking</h3>
              <p className="text-gray-600">Real-time visibility into your FBA shipments</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold">Role-Based Access</h3>
              <p className="text-gray-600">Tailored experiences for every team member</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold">Data-Driven Insights</h3>
              <p className="text-gray-600">Make informed decisions with analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Every Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your FBA shipments efficiently in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-3xl mb-2">📤</div>
                <CardTitle>Bulk CSV Import</CardTitle>
                <CardDescription>
                  Import hundreds of shipments at once with our powerful CSV processing engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Drag-and-drop interface</li>
                  <li>• Error validation and reporting</li>
                  <li>• Template downloads</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-3xl mb-2">🔗</div>
                <CardTitle>Secure Picker Links</CardTitle>
                <CardDescription>
                  Generate secure, time-limited links for packers to access specific shipments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Access control</li>
                  <li>• Expiration management</li>
                  <li>• Activity tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-3xl mb-2">📱</div>
                <CardTitle>Mobile-First Design</CardTitle>
                <CardDescription>
                  Work seamlessly from any device with our responsive interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Touch-optimized</li>
                  <li>• Offline capabilities</li>
                  <li>• Progressive Web App</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-3xl mb-2">📊</div>
                <CardTitle>Advanced Reporting</CardTitle>
                <CardDescription>
                  Generate comprehensive reports for business insights and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Custom report builder</li>
                  <li>• Export to PDF/Excel</li>
                  <li>• Scheduled reports</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-3xl mb-2">🔔</div>
                <CardTitle>Real-Time Notifications</CardTitle>
                <CardDescription>
                  Stay informed with instant alerts about shipment status and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Email notifications</li>
                  <li>• In-app alerts</li>
                  <li>• SMS integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-3xl mb-2">🔒</div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level security with comprehensive audit trails and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• SOC 2 compliant</li>
                  <li>• End-to-end encryption</li>
                  <li>• Audit logging</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored experiences designed to meet the specific needs of each team member
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Admin Role */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">👑</div>
                <CardTitle className="text-xl">Administrator</CardTitle>
                <CardDescription>
                  Complete oversight and control of the entire FBA operation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleFeatures.ADMIN.map((feature, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">{feature.icon}</span>
                      <h4 className="font-semibold">{feature.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx}>• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipper Role */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">🚢</div>
                <CardTitle className="text-xl">Shipper</CardTitle>
                <CardDescription>
                  Efficient shipment creation and management tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleFeatures.SHIPPER.map((feature, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">{feature.icon}</span>
                      <h4 className="font-semibold">{feature.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx}>• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Packer Role */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">📦</div>
                <CardTitle className="text-xl">Packer</CardTitle>
                <CardDescription>
                  Streamlined packing and quality control interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleFeatures.PACKER.map((feature, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">{feature.icon}</span>
                      <h4 className="font-semibold">{feature.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx}>• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose FBA Shipment Manager?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join hundreds of businesses that have transformed their FBA operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50%</div>
              <div className="text-blue-100 mb-2">Time Savings</div>
              <p className="text-sm">Reduce shipment processing time with automated workflows</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100 mb-2">Uptime</div>
              <p className="text-sm">Reliable service you can count on for your business</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100 mb-2">Support</div>
              <p className="text-sm">Expert help whenever you need it</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">∞</div>
              <div className="text-blue-100 mb-2">Scalability</div>
              <p className="text-sm">Grow your business without limits</p>
            </div>
          </div>

          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your FBA Operations?</h3>
            <p className="text-blue-100 mb-8">Join thousands of satisfied customers who streamlined their workflow</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FBA Shipment Manager</h3>
              <p className="text-gray-400 text-sm">
                Professional FBA shipment management platform for Amazon sellers.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#roles" className="hover:text-white">User Roles</a></li>
                <li><a href="#benefits" className="hover:text-white">Benefits</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/auth/signin" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">Sign Up</Link></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 FBA Shipment Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}