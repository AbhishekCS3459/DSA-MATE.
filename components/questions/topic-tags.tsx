"use client"

import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface TopicTagsProps {
  topics: string[]
  maxVisible?: number
  className?: string
}

export function TopicTags({ topics, maxVisible = 3, className }: TopicTagsProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (topics.length === 0) return null

  const visibleTopics = topics.slice(0, maxVisible) 
  const remainingTopics = topics.slice(maxVisible)

  const handleMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className} relative`}>
      {visibleTopics.map((topic) => (
        <Badge
          key={topic}
          variant="secondary"
          className="text-xs bg-primary/10 text-primary border-primary/20 font-medium px-2 py-1"
        >
          {topic}
        </Badge>
      ))}

      {remainingTopics.length > 0 && (
        <div className="relative">
          <Badge
            variant="secondary"
            className="text-xs bg-muted text-muted-foreground font-medium cursor-pointer hover:bg-muted/80 transition-colors"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            +{remainingTopics.length}
          </Badge>

          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 z-[9999] bg-popover border shadow-lg rounded-md p-3 min-w-[200px]">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-popover-foreground">All Topics</h4>
                <div className="flex flex-wrap gap-1.5 max-w-xs">
                  {topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
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
