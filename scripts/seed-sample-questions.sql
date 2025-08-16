-- Insert sample DSA questions for testing
INSERT INTO "questions" (id, title, difficulty, frequency, "acceptanceRate", link, topics, companies, "createdAt", "updatedAt") VALUES
('q1', 'Two Sum', 'EASY', 95, 49.2, 'https://leetcode.com/problems/two-sum/', ARRAY['Array', 'Hash Table'], ARRAY['Google', 'Amazon', 'Microsoft'], NOW(), NOW()),
('q2', 'Add Two Numbers', 'MEDIUM', 85, 38.1, 'https://leetcode.com/problems/add-two-numbers/', ARRAY['Linked List', 'Math', 'Recursion'], ARRAY['Amazon', 'Microsoft', 'Apple'], NOW(), NOW()),
('q3', 'Longest Substring Without Repeating Characters', 'MEDIUM', 90, 33.8, 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', ARRAY['Hash Table', 'String', 'Sliding Window'], ARRAY['Amazon', 'Bloomberg', 'Yelp'], NOW(), NOW()),
('q4', 'Median of Two Sorted Arrays', 'HARD', 70, 35.2, 'https://leetcode.com/problems/median-of-two-sorted-arrays/', ARRAY['Array', 'Binary Search', 'Divide and Conquer'], ARRAY['Google', 'Microsoft', 'Adobe'], NOW(), NOW()),
('q5', 'Longest Palindromic Substring', 'MEDIUM', 80, 32.5, 'https://leetcode.com/problems/longest-palindromic-substring/', ARRAY['String', 'Dynamic Programming'], ARRAY['Amazon', 'Microsoft', 'Apple'], NOW(), NOW()),
('q6', 'ZigZag Conversion', 'MEDIUM', 45, 42.1, 'https://leetcode.com/problems/zigzag-conversion/', ARRAY['String'], ARRAY['PayPal'], NOW(), NOW()),
('q7', 'Reverse Integer', 'MEDIUM', 60, 26.8, 'https://leetcode.com/problems/reverse-integer/', ARRAY['Math'], ARRAY['Apple', 'Bloomberg'], NOW(), NOW()),
('q8', 'String to Integer (atoi)', 'MEDIUM', 55, 16.4, 'https://leetcode.com/problems/string-to-integer-atoi/', ARRAY['String'], ARRAY['Amazon', 'Microsoft', 'Bloomberg'], NOW(), NOW()),
('q9', 'Palindrome Number', 'EASY', 75, 52.3, 'https://leetcode.com/problems/palindrome-number/', ARRAY['Math'], ARRAY['Amazon'], NOW(), NOW()),
('q10', 'Regular Expression Matching', 'HARD', 65, 27.9, 'https://leetcode.com/problems/regular-expression-matching/', ARRAY['String', 'Dynamic Programming', 'Recursion'], ARRAY['Google', 'Uber', 'Airbnb'], NOW(), NOW()),
('q11', 'Container With Most Water', 'MEDIUM', 85, 54.1, 'https://leetcode.com/problems/container-with-most-water/', ARRAY['Array', 'Two Pointers', 'Greedy'], ARRAY['Amazon', 'Bloomberg'], NOW(), NOW()),
('q12', 'Integer to Roman', 'MEDIUM', 40, 59.8, 'https://leetcode.com/problems/integer-to-roman/', ARRAY['Hash Table', 'Math', 'String'], ARRAY['Twitter'], NOW(), NOW()),
('q13', 'Roman to Integer', 'EASY', 50, 58.4, 'https://leetcode.com/problems/roman-to-integer/', ARRAY['Hash Table', 'Math', 'String'], ARRAY['Amazon', 'Microsoft', 'Facebook'], NOW(), NOW()),
('q14', 'Longest Common Prefix', 'EASY', 45, 40.1, 'https://leetcode.com/problems/longest-common-prefix/', ARRAY['String', 'Trie'], ARRAY['Google'], NOW(), NOW()),
('q15', '3Sum', 'MEDIUM', 90, 32.4, 'https://leetcode.com/problems/3sum/', ARRAY['Array', 'Two Pointers', 'Sorting'], ARRAY['Amazon', 'Microsoft', 'Facebook'], NOW(), NOW());
