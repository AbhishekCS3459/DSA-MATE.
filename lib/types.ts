// Type definitions for the DSA Practice Tracker

export interface Question {
  id: string
  title: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  frequency?: number
  acceptanceRate?: number
  link?: string
  topics: string[]
  companies: string[]
  createdAt: Date
  updatedAt: Date
}

export interface UserProgress {
  id: string
  userId: string
  questionId: string
  status: "DONE" | "NOT_DONE"
  updatedAt: Date
}

export interface UserNote {
  id: string
  userId: string
  questionId: string
  content: string
  templateUsed?: string
  voiceNoteUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface ChangeLogEntry {
  id: string
  questionId?: string
  type: "NEW" | "UPDATED" | "DELETED"
  changes: Record<string, any>
  createdAt: Date
}

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  role: "USER" | "ADMIN"
  subscription?: Subscription
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  plan: "FREE" | "STUDENT" | "PROFESSIONAL"
  status: "ACTIVE" | "INACTIVE" | "CANCELLED"
  startDate: Date
  endDate: Date
  paymentMethod?: string
  amount: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface PremiumPlan {
  id: string
  name: string
  price: number
  currency: string
  billingCycle: "MONTHLY" | "YEARLY"
  features: string[]
  maxQuestions: number
  description: string
}

// Filter and search types
export interface QuestionFilters {
  difficulty?: "EASY" | "MEDIUM" | "HARD"
  topics?: string[]
  companies?: string[]
  status?: "DONE" | "NOT_DONE" | "ALL"
  search?: string
}

export interface SortOptions {
  field: "title" | "difficulty" | "frequency" | "acceptanceRate"
  direction: "asc" | "desc"
}

// Note templates
export interface NoteTemplate {
  id: string
  name: string
  content: string
  description: string
}

// Progress statistics
export interface ProgressStats {
  total: number
  solved: number
  easy: { solved: number; total: number }
  medium: { solved: number; total: number }
  hard: { solved: number; total: number }
  topicBreakdown: Record<string, { solved: number; total: number }>
}
