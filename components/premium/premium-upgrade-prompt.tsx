"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Lock, Star, Zap } from "lucide-react"
import Link from "next/link"

interface PremiumUpgradePromptProps {
  currentCount: number
  maxFreeQuestions: number
  totalQuestions: number
}

export function PremiumUpgradePrompt({ currentCount, maxFreeQuestions, totalQuestions }: PremiumUpgradePromptProps) {
  const remainingFree = Math.max(0, maxFreeQuestions - currentCount)
  const lockedQuestions = totalQuestions - maxFreeQuestions

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
            <Lock className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-xl text-amber-900 dark:text-amber-100">
          {remainingFree > 0 ? "Free Plan Limit Approaching" : "Free Plan Limit Reached"}
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          {remainingFree > 0 
            ? `You have ${remainingFree} questions remaining in your free plan`
            : "You've reached the limit of 100 questions in your free plan"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Accessible: {Math.min(currentCount, maxFreeQuestions)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>Remaining: {remainingFree}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Locked: {lockedQuestions}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Free Questions Used</span>
            <span>{Math.min(currentCount, maxFreeQuestions)}/{maxFreeQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentCount / maxFreeQuestions) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Student Plan</h4>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">₹49</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">per month</p>
                </div>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Unlimited questions</li>
                  <li>• Advanced features</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
            <CardContent className="pt-4">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                    <Crown className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">Professional Plan</h4>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">₹99</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">per month</p>
                </div>
                <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• Everything in Student</li>
                  <li>• Team collaboration</li>
                  <li>• API access</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/premium">
              <Crown className="h-4 w-4 mr-2" />
              View All Plans
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/premium">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center text-xs text-amber-700 dark:text-amber-300 space-y-1">
          <p>Upgrade to premium to unlock all {totalQuestions} questions and advanced features</p>
          <p>Cancel anytime • No commitment • Instant access</p>
        </div>
      </CardContent>
    </Card>
  )
}
