"use client"

import { ExportDialog } from "@/components/export/export-dialog"
import { NotesDashboard } from "@/components/profile/notes-dashboard"
import { ProgressCharts } from "@/components/profile/progress-charts"
import { ProgressOverview } from "@/components/profile/progress-overview"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, BarChart3, Download, FileText, Shield, User } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  // Add page-specific metadata
  const pageTitle = "CodeCraft Profile - Track Your DSA Progress & Analytics"
  const pageDescription = "Monitor your DSA learning progress with CodeCraft. View detailed analytics, track solved problems, and analyze your performance across different difficulty levels and topics."
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin")
    }
    if (status === "authenticated") {
      fetchStats()
    }
  }, [status])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/profile/stats")
      const data = await response.json()
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Homepage    
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                <AvatarFallback className="text-lg">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{session.user.name || "User"}</h1>
                <p className="text-muted-foreground">{session.user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {(session.user as any).role === "ADMIN" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  <Badge variant="outline">DSA Practitioner</Badge>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsExportDialogOpen(true)} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : stats ? (
              <ProgressOverview stats={stats} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground">Unable to load profile data</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : stats ? (
              <ProgressCharts difficultyStats={stats.difficulty} topicStats={stats.topics} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground">Unable to load analytics data</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notes">
            <NotesDashboard />
          </TabsContent>
        </Tabs>
      </main>

      <ExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} />
    </div>
  )
}
