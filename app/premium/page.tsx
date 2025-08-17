import { PremiumPlans } from "@/components/premium/premium-plans"

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Premium Plans</h1>
            <p className="text-muted-foreground mt-2">
              Unlock unlimited access to all DSA questions and advanced features
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PremiumPlans />
      </main>
    </div>
  )
}
