'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Scan, 
  Box, 
  CheckCircle, 
  Circle, 
  MessageSquare, 
  Plus,
  CheckSquare,
  Square,
  AlertCircle,
  PackageOpen
} from 'lucide-react'

interface ShipmentItem {
  id: string
  sku: string
  fnSku: string
  quantity: number
  pickedQty: number
  identifier: string
  remainingQty: number
}

interface ShipmentBox {
  id: string
  name: string
  status: 'OPEN' | 'CONCLUDED'
  concludedAt: string | null
  createdAt: string
  items: ShipmentItem[]
}

interface ShipmentData {
  id: string
  name: string
  status: string
  shipper: {
    id: string
    name: string
    email: string
  }
  items: ShipmentItem[]
  boxes: ShipmentBox[]
}

interface PickerResponse {
  pickerLink: {
    id: string
    uuid: string
    isActive: boolean
    createdAt: string
  }
  shipment: ShipmentData
  packer?: {
    id: string
    name: string
    email: string
  }
}

export default function PickerPage() {
  const params = useParams()
  const uuid = params.uuid as string

  const [shipmentData, setShipmentData] = useState<PickerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanInput, setScanInput] = useState('')
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [itemComments, setItemComments] = useState<Record<string, string>>({})
  const [scanSuccess, setScanSuccess] = useState(false)
  const [lastScannedItem, setLastScannedItem] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // Fetch shipment data
  const fetchShipmentData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/picker-links/${uuid}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch shipment')
      }

      const data = await response.json()
      setShipmentData(data)
      
      // Set first open box as selected box
      const openBoxes = data.shipment.boxes.filter((box: ShipmentBox) => box.status === 'OPEN')
      if (openBoxes.length > 0) {
        setSelectedBoxId(openBoxes[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [uuid])

  useEffect(() => {
    if (uuid) {
      fetchShipmentData()
    }
  }, [uuid, fetchShipmentData])

  // Handle scan input
  const handleScan = async () => {
    if (!scanInput.trim() || !selectedBoxId) return

    setIsScanning(true)
    try {
      // Find item by SKU or FNSKU
      const item = shipmentData?.shipment.items.find(
        item => item.sku === scanInput.trim() || item.fnSku === scanInput.trim()
      )

      if (!item) {
        alert(`Item ${scanInput} not found in this shipment`)
        return
      }

      // Check if more items need to be picked
      if (item.pickedQty >= item.quantity) {
        alert(`All ${item.quantity} units of ${item.sku} have already been picked`)
        return
      }

      // Add item to current box (you'll need to create this API endpoint)
      const response = await fetch(`/api/boxes/${selectedBoxId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          quantity: 1
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add item to box')
      }

      // Show success feedback
      setScanSuccess(true)
      setLastScannedItem(item.sku)
      setScanInput('')

      // Refresh data
      await fetchShipmentData()

      // Reset success animation
      setTimeout(() => {
        setScanSuccess(false)
        setLastScannedItem(null)
      }, 2000)

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setIsScanning(false)
    }
  }

  // Handle box conclusion
  const concludeBox = async (boxId: string) => {
    if (!confirm('Are you sure you want to conclude this box?')) return

    try {
      const response = await fetch(`/api/boxes/${boxId}/conclude`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to conclude box')
      }

      // Refresh data and select next open box
      await fetchShipmentData()
      const openBoxes = shipmentData?.shipment.boxes.filter((box: ShipmentBox) => box.status === 'OPEN')
      if (openBoxes && openBoxes.length > 0) {
        setSelectedBoxId(openBoxes[0].id)
      } else {
        setSelectedBoxId(null)
      }

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to conclude box')
    }
  }

  // Handle adding comment to item
  const updateItemComment = (itemId: string, comment: string) => {
    setItemComments(prev => ({ ...prev, [itemId]: comment }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Package className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading shipment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Shipment</h2>
                <p className="text-gray-600">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!shipmentData) return null

  const selectedBox = shipmentData.shipment.boxes.find(box => box.id === selectedBoxId)
  const totalProgress = shipmentData.shipment.items.reduce((acc, item) => {
    return acc + (item.quantity > 0 ? (item.pickedQty / item.quantity) * 100 : 0)
  }, 0) / shipmentData.shipment.items.length

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-6 h-6 text-blue-500" />
                <span>{shipmentData.shipment.name}</span>
              </div>
              <Badge variant={shipmentData.shipment.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {shipmentData.shipment.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Shipper</p>
                <p className="font-medium">{shipmentData.shipment.shipper.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Progress</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{Math.round(totalProgress)}%</span>
                </div>
              </div>
              {shipmentData.packer && (
                <div>
                  <p className="text-sm text-gray-500">Packer</p>
                  <p className="font-medium">{shipmentData.packer.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scan Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="w-5 h-5" />
              <span>Scan Item</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                placeholder="Scan SKU or FNSKU..."
                className="flex-1 px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-300 rounded-lg text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <Button 
                onClick={handleScan}
                size="lg"
                disabled={!scanInput.trim() || !selectedBoxId || isScanning}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl transition-all duration-200 ${
                  isScanning ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' : 
                  scanSuccess ? 'bg-green-500 hover:bg-green-600' : 
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isScanning ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Scan className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </Button>
            </div>
            {scanSuccess && lastScannedItem && (
              <div className="mt-2 p-3 sm:p-4 bg-green-100 border-2 border-green-300 rounded-lg flex items-center space-x-2 animate-pulse">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span className="text-green-700 font-bold text-base sm:text-lg">Added {lastScannedItem} to box</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Current Box */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Box className="w-5 h-5" />
                <span>Current Box</span>
                {selectedBox && (
                  <Badge variant={selectedBox.status === 'OPEN' ? 'default' : 'secondary'}>
                    {selectedBox.status}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Box Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Box
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {shipmentData.shipment.boxes
                      .filter((box: ShipmentBox) => box.status === 'OPEN')
                      .map(box => (
                        <Button
                          key={box.id}
                          variant={selectedBoxId === box.id ? 'default' : 'outline'}
                          onClick={() => setSelectedBoxId(box.id)}
                          className="justify-start"
                        >
                          <Box className="w-4 h-4 mr-2" />
                          {box.name}
                        </Button>
                      ))}
                  </div>
                </div>

                {selectedBox && (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Box Contents</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedBox.items.length === 0 ? (
                          <p className="text-gray-500 text-sm">No items in this box yet</p>
                        ) : (
                          selectedBox.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{item.sku}</p>
                                <p className="text-xs text-gray-500">{item.fnSku}</p>
                              </div>
                              <Badge variant="outline">{item.quantity} units</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => concludeBox(selectedBox.id)}
                      className="w-full"
                      disabled={selectedBox.status === 'CONCLUDED'}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Conclude Box
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items to Pick */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PackageOpen className="w-5 h-5" />
                <span>Items to Pick</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {shipmentData.shipment.items.map(item => {
                  const isCompleted = item.pickedQty >= item.quantity
                  const progress = (item.pickedQty / item.quantity) * 100

                  return (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="font-medium">{item.sku}</span>
                          </div>
                          <p className="text-sm text-gray-500">{item.fnSku}</p>
                          <p className="text-xs text-gray-400">{item.identifier}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {item.pickedQty} / {item.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.remainingQty} remaining
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Comment Section */}
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                        <input
                          type="text"
                          value={itemComments[item.id] || ''}
                          onChange={(e) => updateItemComment(item.id, e.target.value)}
                          placeholder="Add comment..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}