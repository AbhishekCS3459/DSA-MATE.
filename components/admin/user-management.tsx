"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, Save, Search, Shield, User, X } from "lucide-react"
import { useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name?: string
  role: "USER" | "ADMIN"
  createdAt: string
  updatedAt: string
}

interface EditableUser extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

export function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<EditableUser | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when searching
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch users when pagination, search, or filters change
  useEffect(() => {
    fetchUsers()
  }, [currentPage, debouncedSearchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
        search: debouncedSearchTerm,
        role: roleFilter
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setPaginationInfo(data.pagination || null)
      } else {
        throw new Error("Failed to fetch users")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (user: User) => {
    setEditingId(user.id)
    setEditingData({
      ...user,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const saveUser = async () => {
    if (!editingData) return

    try {
      const response = await fetch(`/api/admin/users/${editingData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: editingData.role,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.user) {
          // Update local state with the returned user data
          setUsers((prev) =>
            prev.map((user) =>
              user.id === editingData.id ? { ...user, ...result.user } : user
            )
          )
          
          toast({
            title: "Success",
            description: "User role updated successfully",
          })
          
          cancelEditing()
          
          // Refresh the current page to ensure data consistency
          fetchUsers()
        } else {
          throw new Error("Invalid response format from server")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "USER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3" />
      case "USER":
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. Only admins can change user roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value)
              setCurrentPage(1) // Reset to first page when filtering
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm || roleFilter !== "all" 
                        ? "No users found matching your criteria" 
                        : "No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || "No name"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === user.id ? (
                          <Select
                            value={editingData?.role || user.role}
                            onValueChange={(value: "USER" | "ADMIN") =>
                              setEditingData((prev) => prev ? { ...prev, role: value } : null)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getRoleColor(user.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(user.role)}
                              {user.role}
                            </div>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === user.id ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={saveUser}>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => startEditing(user)}>
                            Edit Role
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((paginationInfo.currentPage - 1) * paginationInfo.limit) + 1} to {Math.min(paginationInfo.currentPage * paginationInfo.limit, paginationInfo.totalCount)} of {paginationInfo.totalCount} users
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
                  disabled={!paginationInfo.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (paginationInfo.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (paginationInfo.currentPage <= 3) {
                      pageNum = i + 1
                    } else if (paginationInfo.currentPage >= paginationInfo.totalPages - 2) {
                      pageNum = paginationInfo.totalPages - 4 + i
                    } else {
                      pageNum = paginationInfo.currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={paginationInfo.currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
                  disabled={!paginationInfo.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {paginationInfo?.currentPage || 1} of {paginationInfo?.totalPages || 1} • {paginationInfo?.totalCount || 0} total users
            </span>
            <div className="flex items-center gap-4">
              <span>
                {users.filter(u => u.role === "USER").length} Users • 
                {users.filter(u => u.role === "ADMIN").length} Admins
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
