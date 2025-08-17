"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Check, Crown, Star, Zap } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface PremiumPlan {
  id: string
  name: string
  price: number
  currency: string
  billingCycle: string
  features: string[]
  maxQuestions: number
  description: string
}

interface SubscriptionStatus {
  accessLevel: string
  maxQuestions: number
  isActive: boolean
  planName: string
  endDate: string | null
  totalQuestions: number
  canAccessAll: boolean
}

export function PremiumPlans() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [plans, setPlans] = useState<PremiumPlan[]>([])
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
    if (session?.user) {
      fetchSubscriptionStatus()
    }
  }, [session])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/premium/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/premium/status")
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a premium plan",
        variant: "destructive",
      })
      return
    }

    setSubscribing(planId)
    try {
      const response = await fetch("/api/premium/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          paymentMethod: "Online Payment",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Subscription Successful!",
          description: data.message,
        })
        fetchSubscriptionStatus() // Refresh subscription status
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Subscription failed")
      }
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setSubscribing(null)
    }
  }

  const getPlanIcon = (planName: string) => {
    if (planName.includes("Student")) return <Star className="h-6 w-6" />
    if (planName.includes("Professional")) return <Crown className="h-6 w-6" />
    return <Zap className="h-6 w-6" />
  }

  const getPlanColor = (planName: string) => {
    if (planName.includes("Student")) return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
    if (planName.includes("Professional")) return "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20"
    return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Premium Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock unlimited access to all DSA questions, advanced features, and premium support. 
          Perfect for students and professionals preparing for technical interviews.
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Current Plan: {subscription.planName}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {subscription.canAccessAll 
                      ? "You have unlimited access to all questions" 
                      : `You can access up to ${subscription.maxQuestions} questions`
                    }
                  </p>
                  {subscription.endDate && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Expires: {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {subscription.isActive && (
                <div className="text-right">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Active
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.planName === plan.name
          const isSubscribing = subscribing === plan.id
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${getPlanColor(plan.name)} ${
                isCurrentPlan ? 'ring-2 ring-primary' : ''
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {getPlanIcon(plan.name)}
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.billingCycle.toLowerCase()}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan || isSubscribing}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isSubscribing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Free Plan Info */}
      <Card className="max-w-2xl mx-auto border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold">Free Plan</h3>
            <p className="text-sm text-muted-foreground">
              Access to first 100 questions • Basic progress tracking • Limited notes
            </p>
            <p className="text-xs text-muted-foreground">
              Upgrade to premium for unlimited access and advanced features
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-semibold text-center">Frequently Asked Questions</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">Can I cancel my subscription anytime?</p>
            <p>Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">What payment methods do you accept?</p>
            <p>We accept all major credit cards, debit cards, and UPI payments for Indian users.</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">Is there a free trial?</p>
            <p>Currently, we offer a free plan with access to 100 questions. You can upgrade to premium anytime to unlock all features.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
