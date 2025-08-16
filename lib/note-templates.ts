import type { NoteTemplate } from "./types"

export const noteTemplates: NoteTemplate[] = [
  {
    id: "dsa-algorithm",
    name: "DSA Algorithm",
    description: "Standard template for algorithm problems",
    content: `## Problem Statement
[Describe the problem in your own words]

## Approach
[Explain your solution approach]

### Algorithm Steps:
1. 
2. 
3. 

## Time Complexity
- **Time:** O()
- **Space:** O()

## Code
\`\`\`python
# Your solution here
def solution():
    pass
\`\`\`

## Edge Cases
- 
- 

## Key Insights
- 
- 

## Similar Problems
- 
- 
`,
  },
  {
    id: "system-design",
    name: "System Design",
    description: "Template for system design problems",
    content: `## Requirements
### Functional Requirements
- 
- 

### Non-Functional Requirements
- 
- 

## Capacity Estimation
- **Users:** 
- **Storage:** 
- **Bandwidth:** 

## High-Level Design
[Describe the overall architecture]

## Database Design
### Tables/Collections:
- 
- 

## API Design
\`\`\`
GET /api/
POST /api/
\`\`\`

## Scalability Considerations
- 
- 

## Trade-offs
- 
- 
`,
  },
  {
    id: "behavioral",
    name: "Behavioral Q&A",
    description: "Template for behavioral interview questions",
    content: `## Question
[Write the behavioral question here]

## STAR Method Response

### Situation
[Describe the context/background]

### Task
[Explain what needed to be accomplished]

### Action
[Detail the specific actions you took]

### Result
[Share the outcomes and what you learned]

## Key Takeaways
- 
- 

## Follow-up Questions to Prepare
- 
- 
`,
  },
  {
    id: "database",
    name: "Database Query",
    description: "Template for SQL/database problems",
    content: `## Problem Description
[Describe what the query needs to accomplish]

## Schema
\`\`\`sql
-- Table definitions
CREATE TABLE table_name (
    id INT PRIMARY KEY,
    -- other columns
);
\`\`\`

## Solution
\`\`\`sql
-- Your SQL query here
SELECT 
FROM 
WHERE 
GROUP BY 
HAVING 
ORDER BY;
\`\`\`

## Explanation
[Explain your approach and reasoning]

## Alternative Solutions
\`\`\`sql
-- Alternative approach if applicable
\`\`\`

## Performance Considerations
- **Indexes needed:** 
- **Time complexity:** 
`,
  },
  {
    id: "quick-note",
    name: "Quick Note",
    description: "Simple template for quick thoughts",
    content: `## Quick Thoughts
[Your main insight or solution approach]

## Code Snippet
\`\`\`
// Quick implementation
\`\`\`

## Notes
- 
- 
`,
  },
]

export function getTemplateById(id: string): NoteTemplate | undefined {
  return noteTemplates.find((template) => template.id === id)
}
