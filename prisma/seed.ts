import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Sample DSA questions
  const questions = [
    {
      title: 'Two Sum',
      difficulty: 'EASY' as const,
      frequency: 95,
      acceptanceRate: 49.2,
      link: 'https://leetcode.com/problems/two-sum/',
      topics: ['Array', 'Hash Table'],
      companies: ['Google', 'Amazon', 'Microsoft'],
    },
    {
      title: 'Add Two Numbers',
      difficulty: 'MEDIUM' as const,
      frequency: 85,
      acceptanceRate: 38.1,
      link: 'https://leetcode.com/problems/add-two-numbers/',
      topics: ['Linked List', 'Math', 'Recursion'],
      companies: ['Amazon', 'Microsoft', 'Apple'],
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'MEDIUM' as const,
      frequency: 90,
      acceptanceRate: 33.8,
      link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      topics: ['Hash Table', 'String', 'Sliding Window'],
      companies: ['Amazon', 'Bloomberg', 'Yelp'],
    },
    {
      title: 'Median of Two Sorted Arrays',
      difficulty: 'HARD' as const,
      frequency: 70,
      acceptanceRate: 35.2,
      link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
      topics: ['Array', 'Binary Search', 'Divide and Conquer'],
      companies: ['Google', 'Microsoft', 'Adobe'],
    },
    {
      title: 'Longest Palindromic Substring',
      difficulty: 'MEDIUM' as const,
      frequency: 80,
      acceptanceRate: 32.5,
      link: 'https://leetcode.com/problems/longest-palindromic-substring/',
      topics: ['String', 'Dynamic Programming'],
      companies: ['Amazon', 'Microsoft', 'Apple'],
    },
    {
      title: 'ZigZag Conversion',
      difficulty: 'MEDIUM' as const,
      frequency: 45,
      acceptanceRate: 42.1,
      link: 'https://leetcode.com/problems/zigzag-conversion/',
      topics: ['String'],
      companies: ['PayPal'],
    },
    {
      title: 'Reverse Integer',
      difficulty: 'MEDIUM' as const,
      frequency: 60,
      acceptanceRate: 26.8,
      link: 'https://leetcode.com/problems/reverse-integer/',
      topics: ['Math'],
      companies: ['Apple', 'Bloomberg'],
    },
    {
      title: 'String to Integer (atoi)',
      difficulty: 'MEDIUM' as const,
      frequency: 55,
      acceptanceRate: 16.4,
      link: 'https://leetcode.com/problems/string-to-integer-atoi/',
      topics: ['String'],
      companies: ['Amazon', 'Microsoft', 'Bloomberg'],
    },
    {
      title: 'Palindrome Number',
      difficulty: 'EASY' as const,
      frequency: 75,
      acceptanceRate: 52.3,
      link: 'https://leetcode.com/problems/palindrome-number/',
      topics: ['Math'],
      companies: ['Amazon'],
    },
    {
      title: 'Regular Expression Matching',
      difficulty: 'HARD' as const,
      frequency: 65,
      acceptanceRate: 27.9,
      link: 'https://leetcode.com/problems/regular-expression-matching/',
      topics: ['String', 'Dynamic Programming', 'Recursion'],
      companies: ['Google', 'Uber', 'Airbnb'],
    },
    {
      title: 'Container With Most Water',
      difficulty: 'MEDIUM' as const,
      frequency: 85,
      acceptanceRate: 54.1,
      link: 'https://leetcode.com/problems/container-with-most-water/',
      topics: ['Array', 'Two Pointers', 'Greedy'],
      companies: ['Amazon', 'Bloomberg'],
    },
    {
      title: 'Integer to Roman',
      difficulty: 'MEDIUM' as const,
      frequency: 40,
      acceptanceRate: 59.8,
      link: 'https://leetcode.com/problems/integer-to-roman/',
      topics: ['Hash Table', 'Math', 'String'],
      companies: ['Twitter'],
    },
    {
      title: 'Roman to Integer',
      difficulty: 'EASY' as const,
      frequency: 50,
      acceptanceRate: 58.4,
      link: 'https://leetcode.com/problems/roman-to-integer/',
      topics: ['Hash Table', 'Math', 'String'],
      companies: ['Amazon', 'Microsoft', 'Facebook'],
    },
    {
      title: 'Longest Common Prefix',
      difficulty: 'EASY' as const,
      frequency: 45,
      acceptanceRate: 40.1,
      link: 'https://leetcode.com/problems/longest-common-prefix/',
      topics: ['String', 'Trie'],
      companies: ['Google'],
    },
    {
      title: '3Sum',
      difficulty: 'MEDIUM' as const,
      frequency: 90,
      acceptanceRate: 32.4,
      link: 'https://leetcode.com/problems/3sum/',
      topics: ['Array', 'Two Pointers', 'Sorting'],
      companies: ['Amazon', 'Microsoft', 'Facebook'],
    },
  ]

  // Insert questions
  await prisma.question.createMany({
    data: questions,
    skipDuplicates: true,
  })

  console.log(`✅ Seeded ${questions.length} questions`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
