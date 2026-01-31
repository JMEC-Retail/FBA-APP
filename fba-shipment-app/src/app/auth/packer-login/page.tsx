"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserRole } from "@/lib/auth"
import { 
  Package, 
  MapPin, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Monitor,
  Settings,
  HelpCircle
} from "lucide-react"

const formSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  role: z.literal("PACKER"),
  rememberStation: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

// Default credentials for PACKER login
const DEFAULT_PACKER_CREDENTIALS = {
  stationId: "PACKER001",
  role: "PACKER" as const,
  name: "Packer User",
  email: "packer@station.com",
}

// Available stations
const AVAILABLE_STATIONS = [
  { id: "PACKER001", name: "Main Packing Station 1", status: "online" },
  { id: "PACKER002", name: "Main Packing Station 2", status: "online" },
  { id: "PACKER003", name: "Secondary Packing Station 1", status: "online" },
  { id: "PACKER004", name: "Secondary Packing Station 2", status: "offline" },
  { id: "PACKER005", name: "Overflow Packing Station", status: "online" },
]

export default function PackerLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<typeof AVAILABLE_STATIONS[0] | null>(null)
  const [systemTime, setSystemTime] = useState(new Date())
  const [recentStations, setRecentStations] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "PACKER",
      rememberStation: true,
    },
  })

  const watchedStationId = watch("stationId")
  const watchedRememberStation = watch("rememberStation")

  // Update system time
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load recent stations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("packer-recent-stations")
    if (saved) {
      try {
        setRecentStations(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse recent stations:", e)
      }
    }
  }, [])

  // Auto-select station when station ID changes
  useEffect(() => {
    const station = AVAILABLE_STATIONS.find(s => s.id === watchedStationId)
    setSelectedStation(station || null)
    
    // Show warning for offline stations
    if (station && station.status === "offline") {
      setError(`Warning: Station ${station.id} is currently offline. Contact support if needed.`)
    } else {
      setError(null)
    }
  }, [watchedStationId])

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Call PACKER authentication API
      const response = await fetch("/api/auth/packer-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stationId: data.stationId,
          role: data.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Authentication failed")
        return
      }

      if (result.success) {
        // Save to recent stations if remember is checked
        if (data.rememberStation) {
          const updated = [...new Set([data.stationId, ...recentStations.filter(s => s !== data.stationId)])].slice(0, 3)
          setRecentStations(updated)
          localStorage.setItem("packer-recent-stations", JSON.stringify(updated))
        }

        // Store session (in real app, this would be handled by NextAuth)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("packer-session", JSON.stringify({
            user: result.user,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }))
        }

        // Redirect to PACKER dashboard
        router.push("/dashboard")
      }
      
    } catch (err) {
      setError("Login failed. Please try again or contact support.")
    } finally {
      setIsLoading(false)
    }
  }

  // Quick login with default credentials
  const handleQuickLogin = () => {
    setValue("stationId", DEFAULT_PACKER_CREDENTIALS.stationId)
    setValue("role", DEFAULT_PACKER_CREDENTIALS.role)
    setTimeout(() => {
      handleSubmit(onSubmit)()
    }, 100)
  }

  // Fill station ID from recent stations
  const handleSelectRecentStation = (stationId: string) => {
    setValue("stationId", stationId)
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Package className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-black">Packer Station Login</h1>
          <p className="text-black mt-2">Access your packing workstation and manage assigned shipments</p>
          <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-black">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{systemTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{systemTime.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Login Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">Station Authentication</h2>
                {selectedStation && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedStation.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sm text-black capitalize">{selectedStation.status}</span>
                  </div>
                )}
              </div>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Station ID Input */}
                <div>
                  <label htmlFor="stationId" className="block text-sm font-medium text-black mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Station ID
                  </label>
                  <input
                    {...register("stationId")}
                    type="text"
                    autoComplete="off"
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white text-lg font-mono"
                    placeholder="Enter Station ID (e.g., PACKER001)"
                    disabled={isLoading}
                  />
                  {errors.stationId && (
                    <p className="mt-2 text-sm text-red-600">{errors.stationId.message}</p>
                  )}
                  
                  {/* Station Info */}
                  {selectedStation && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-black" />
                        <span className="text-sm font-medium text-black">{selectedStation.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedStation.status === "online" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {selectedStation.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Display */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Role
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-md">
                    <span className="text-lg font-medium text-blue-600">PACKER</span>
                    <p className="text-sm text-black mt-1">Packing station user with box management access</p>
                  </div>
                </div>

                {/* Remember Station */}
                <div className="flex items-center">
                  <input
                    {...register("rememberStation")}
                    type="checkbox"
                    id="rememberStation"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberStation" className="ml-2 block text-sm text-black">
                    Remember this station for quick access
                  </label>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-black text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      "Login to Packing Station"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Login Options */}
            <div className="mt-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Quick Login</h3>
              
              {/* Default Credentials */}
              <div className="mb-4">
                <button
                  onClick={handleQuickLogin}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Login with Default Credentials (PACKER001)</span>
                </button>
                <p className="text-xs text-black mt-2">Use this for immediate access - no authentication required</p>
              </div>

              {/* Recent Stations */}
              {recentStations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-black mb-2">Recent Stations:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {recentStations.map(stationId => {
                      const station = AVAILABLE_STATIONS.find(s => s.id === stationId)
                      return (
                        <button
                          key={stationId}
                          onClick={() => handleSelectRecentStation(stationId)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-black transition-colors text-left"
                        >
                          {station?.name || stationId}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Help & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Station Status */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Station Status</span>
              </h3>
              <div className="space-y-3">
                {AVAILABLE_STATIONS.slice(0, 3).map(station => (
                  <div key={station.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-black">{station.id}</p>
                      <p className="text-xs text-black">{station.name}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${station.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Help & Instructions */}
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center space-x-2">
                <HelpCircle className="h-5 w-5" />
                <span>Help & Instructions</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-black mb-2">How to Login:</h4>
                  <ol className="text-xs text-black space-y-1 list-decimal list-inside">
                    <li>Enter your Station ID (e.g., PACKER001)</li>
                    <li>Ensure your station is online</li>
                    <li>Click "Login to Packing Station"</li>
                    <li>Access your packing dashboard</li>
                  </ol>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-black mb-2">Default Access:</h4>
                  <p className="text-xs text-black">
                    Use "PACKER001" as Station ID for immediate access without authentication.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-black mb-2">Need Help?</h4>
                  <p className="text-xs text-black">
                    Contact system administrator or use the quick login option with default credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>System Information</span>
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>FBA Shipment Management System</p>
                <p>Version: 1.0.0</p>
                <p>Packer Workstation Portal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}