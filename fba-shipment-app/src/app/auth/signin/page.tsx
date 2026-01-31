"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { UserRole } from "../../../../auth"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Key, 
  Hash, 
  Users, 
  ArrowRight, 
  Info,
  Shield,
  Package
} from "lucide-react"

// Form schemas for different login types
const emailFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const pickerFormSchema = z.object({
  identifier: z.string().min(1, "UUID or nickname is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type EmailFormData = z.infer<typeof emailFormSchema>
type PickerFormData = z.infer<typeof pickerFormSchema>

// Available picker users (matching the API)
const PICKER_USERS = [
  { uuid: "f1eb2b00-90d4-4033-9c71-885fb7bf07da", nickname: "Alpha" },
  { uuid: "bdd1883a-c9f2-4c8e-8088-81c3e323753d", nickname: "Beta" },
  { uuid: "b4e41c2a-5d68-49d9-8541-08dac2a47012", nickname: "Gamma" },
  { uuid: "4579ea58-dc4e-43eb-ad2e-35fbfaad27b2", nickname: "Delta" },
  { uuid: "2fe31dda-cd38-40fd-9704-6615e814385d", nickname: "Epsilon" },
  { uuid: "af7d724a-35bf-48c3-a893-6435490d9d1a", nickname: "Zeta" },
  { uuid: "4d5edb4d-9e53-42a1-b50a-7e114c2bcabf", nickname: "Eta" },
  { uuid: "e1dad35b-bfe2-483c-90eb-360964494cc7", nickname: "Theta" },
  { uuid: "eca9cda4-9bfa-4a93-af22-67ba2c12e5d4", nickname: "Iota" },
  { uuid: "e99ce147-8ebb-4d76-92b4-1a4d9865a8fe", nickname: "Kappa" },
]

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loginType, setLoginType] = useState<"email" | "picker">("email")

  // Email login form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
    reset: resetEmail,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
  })

  // Picker login form
  const {
    register: registerPicker,
    handleSubmit: handleSubmitPicker,
    formState: { errors: pickerErrors },
    reset: resetPicker,
    setValue: setPickerValue,
  } = useForm<PickerFormData>({
    resolver: zodResolver(pickerFormSchema),
  })

  // Handle email login
  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        return
      }

      if (result?.ok) {
        // Fetch user session to determine role for redirect
        const response = await fetch("/api/auth/session")
        const session = await response.json()

        if (session?.user?.role) {
          switch (session.user.role) {
            case "ADMIN":
              router.push("/dashboard/users")
              break
            case "SHIPPER":
              router.push("/dashboard/upload")
              break
            case "PACKER":
              router.push("/dashboard")
              break
            default:
              router.push("/dashboard")
          }
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle picker login
  const onPickerSubmit = async (data: PickerFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/picker-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginType: "picker",
          identifier: data.identifier,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Picker authentication failed")
        return
      }

      if (result.success) {
        // Store picker session in sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("packer-session", JSON.stringify({
            user: result.user,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }))
        }

        setSuccess(`Welcome ${result.user.nickname || result.user.name}!`)
        setTimeout(() => {
          router.push(result.redirectUrl)
        }, 1000)
      }
    } catch (err) {
      setError("Picker authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Quick login functions
  const quickLoginPicker = (uuid: string, nickname: string) => {
    setPickerValue("identifier", uuid)
    setPickerValue("password", "picker123")
  }

  const switchLoginType = (type: "email" | "picker") => {
    setLoginType(type)
    setError(null)
    setSuccess(null)
    resetEmail()
    resetPicker()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">FBA Shipment System</h1>
          <p className="text-black mt-2">Choose your login method</p>
          
          <div className="text-center mt-4">
            <Link
              href="/auth/packer-login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              ← Back to Packer Station Login
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Login */}
          <div className={`border-2 rounded-lg p-6 ${loginType === "email" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-black">Email Login</h2>
              <Badge className="ml-auto bg-green-100 text-green-800">Recommended</Badge>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-black">For ADMIN and SHIPPER users</p>
              <div className="flex items-center mt-2 text-xs text-black">
                <Shield className="h-4 w-4 mr-1" />
                Secure authentication with email and password
              </div>
            </div>

            {loginType !== "email" ? (
              <button
                onClick={() => switchLoginType("email")}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Use Email Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                    Email address
                  </label>
                  <input
                    {...registerEmail("email")}
                    type="email"
                    autoComplete="email"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    placeholder="admin@system.local"
                    disabled={isLoading}
                  />
                  {emailErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{emailErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                    Password
                  </label>
                  <input
                    {...registerEmail("password")}
                    type="password"
                    autoComplete="current-password"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {emailErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{emailErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-black text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/auth/signup"
                    className="text-sm text-black underline hover:no-underline transition-colors"
                  >
                    Create a new account
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Picker Login */}
          <div className={`border-2 rounded-lg p-6 ${loginType === "picker" ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}>
            <div className="flex items-center mb-6">
              <Hash className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-black">Picker Login</h2>
              <Badge className="ml-auto bg-purple-100 text-purple-800">UUID Access</Badge>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-black">For PICKER users</p>
              <div className="flex items-center mt-2 text-xs text-black">
                <Key className="h-4 w-4 mr-1" />
                Login with UUID or nickname
              </div>
            </div>

            {loginType !== "picker" ? (
              <button
                onClick={() => switchLoginType("picker")}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                Use Picker Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <div>
                <form onSubmit={handleSubmitPicker(onPickerSubmit)} className="space-y-4 mb-4">
                  <div>
                    <label htmlFor="identifier" className="block text-sm font-medium text-black mb-1">
                      UUID or Nickname
                    </label>
                    <input
                      {...registerPicker("identifier")}
                      type="text"
                      autoComplete="off"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white font-mono"
                      placeholder="f1eb2b00-... or Alpha"
                      disabled={isLoading}
                    />
                    {pickerErrors.identifier && (
                      <p className="mt-1 text-sm text-red-600">{pickerErrors.identifier.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                      Password
                    </label>
                    <input
                      {...registerPicker("password")}
                      type="password"
                      autoComplete="current-password"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                      placeholder="picker123"
                      disabled={isLoading}
                    />
                    {pickerErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{pickerErrors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-black text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Authenticating...
                      </>
                    ) : (
                      "Picker Login"
                    )}
                  </button>
                </form>

                {/* Quick Login Options */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-black mb-2">Quick Login:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PICKER_USERS.slice(0, 6).map((picker) => (
                      <button
                        key={picker.uuid}
                        onClick={() => quickLoginPicker(picker.uuid, picker.nickname)}
                        className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 py-1 rounded transition-colors"
                        title={`UUID: ${picker.uuid}`}
                      >
                        {picker.nickname}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mt-6 rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Default Credentials Info */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Default Credentials:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
                <div>
                  <strong>ADMIN:</strong> admin@system.local / admin123
                </div>
                <div>
                  <strong>SHIPPER:</strong> shipper@system.local / shipper123
                </div>
                <div>
                  <strong>PICKER:</strong> Alpha / picker123 (or use UUID)
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                For immediate access, use the quick login buttons or try picker login with "Alpha" as identifier.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}