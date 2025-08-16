"use client"

import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface CompanyTagsProps {
  companies: string[]
  maxVisible?: number
  className?: string
}

export function CompanyTags({ companies, maxVisible = 2, className }: CompanyTagsProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (companies.length === 0) return null

  const visibleCompanies = companies.slice(0, maxVisible)
  const remainingCompanies = companies.slice(maxVisible)

  const handleMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className} relative`}>
      {visibleCompanies.map((company) => (
        <Badge key={company} variant="outline" className="text-xs border-accent/30 text-accent font-medium px-2 py-1">
          {company}
        </Badge>
      ))}

      {remainingCompanies.length > 0 && (
        <div className="relative">
          <Badge
            variant="outline"
            className="text-xs font-medium cursor-pointer hover:bg-accent/10 transition-colors"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave} 
          >
            +{remainingCompanies.length}
          </Badge>

          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 z-[9999] bg-popover border shadow-lg rounded-md p-3 min-w-[200px]">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-popover-foreground">All Companies</h4>
                <div className="flex flex-wrap gap-1.5 max-w-xs">
                  {companies.map((company) => (
                    <Badge key={company} variant="secondary" className="text-xs">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* Arrow pointing down */}
              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
