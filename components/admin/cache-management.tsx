"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Activity, Clock, Database, HardDrive, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface CacheStats {
  size: number
  keys: string[]
}

interface CacheResponse {
  success: boolean
  stats: CacheStats
  timestamp: string
}

export function CacheManagement() {
  const { toast } = useToast()
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    fetchCacheStats()
  }, [])

  const fetchCacheStats = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/cache")
      const data: CacheResponse = await response.json()

      if (response.ok && data.success) {
        setCacheStats(data.stats)
        setLastUpdated(data.timestamp)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch cache statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching cache stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch cache statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearCachesClick = () => {
    toast({
      title: "Confirm Cache Clear",
      description: "Are you sure you want to clear all caches? This will temporarily impact performance.",
      action: (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast({
                title: "Cancelled",
                description: "Cache clearing was cancelled",
              })
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              clearAllCaches()
            }}
          >
            Clear All
          </Button>
        </div>
      ),
      duration: 10000, // Give user 10 seconds to decide
    })
  }

  const clearAllCaches = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/cache", {
        method: "DELETE",
      })
      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "All caches cleared successfully",
        })
        fetchCacheStats() // Refresh stats
      } else {
        toast({
          title: "Error",
          description: "Failed to clear caches",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error clearing caches:", error)
      toast({
        title: "Error",
        description: "Failed to clear caches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getCacheKeyType = (key: string) => {
    if (key.startsWith("questions|")) return "Questions"
    if (key.startsWith("filters:")) return "Filter Options"
    if (key.startsWith("stats:")) return "Statistics"
    return "Other"
  }

  const getCacheKeyTypeColor = (type: string) => {
    switch (type) {
      case "Questions":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Filter Options":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Statistics":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Monitor and manage application caching to optimize performance and ensure data consistency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cache Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Cache Size</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {cacheStats?.size || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Active Keys</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {cacheStats?.keys?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Last Updated</p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                      {lastUpdated ? formatTimestamp(lastUpdated) : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={fetchCacheStats} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Stats
            </Button>
            <Button 
              onClick={handleClearCachesClick} 
              disabled={loading} 
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Caches
            </Button>
          </div>

          {/* Cache Keys Details */}
          {cacheStats && cacheStats.keys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cached Data Keys</CardTitle>
                <CardDescription>Detailed breakdown of what's currently cached</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cacheStats.keys.map((key, index) => {
                    const keyType = getCacheKeyType(key)
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge className={getCacheKeyTypeColor(keyType)} variant="secondary">
                            {keyType}
                          </Badge>
                          <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                            {key.length > 50 ? `${key.substring(0, 50)}...` : key}
                          </code>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {key.length} chars
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cache Information */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Cache Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Questions Cache:</strong> Caches question lists and filter results for 5 minutes</p>
              <p>• <strong>Filter Options:</strong> Caches available topics and companies for 30 minutes</p>
              <p>• <strong>Auto-cleanup:</strong> Expired cache entries are automatically removed every 5 minutes</p>
              <p>• <strong>Cache Invalidation:</strong> Automatically cleared when questions, notes, or progress are updated</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
