-- CCAT Topic Seeding Script
-- This script creates the initial Knowledge Graph structure for CCAT math preparation
-- Domains: arithmetic, algebra, proportions, word_problems
-- Reference: ccat-questions.md - CCAT focuses on basic algebra, proportions, and word problems

-- ============================================
-- ARITHMETIC FOUNDATIONS
-- ============================================

-- Basic Operations
INSERT INTO topics (name, description, difficulty, xp_value, domain) 
VALUES
('Basic Addition', 'Adding single and multi-digit numbers', 1, 10, 'arithmetic'),
('Basic Subtraction', 'Subtracting single and multi-digit numbers', 1, 10, 'arithmetic'),
('Basic Multiplication', 'Multiplying single and multi-digit numbers', 2, 15, 'arithmetic'),
('Basic Division', 'Dividing single and multi-digit numbers', 2, 15, 'arithmetic'),
('Order of Operations', 'PEMDAS/BODMAS: Parentheses, Exponents, Multiplication, Division, Addition, Subtraction', 3, 20, 'arithmetic'),
('Mental Math Strategies', 'Quick calculation techniques for addition, subtraction, multiplication, division', 3, 20, 'arithmetic'),
('Working with Integers', 'Positive and negative numbers, absolute value', 4, 25, 'arithmetic'),
('Number Properties', 'Commutative, associative, distributive properties', 4, 25, 'arithmetic')
ON CONFLICT (name) DO NOTHING;

-- Arithmetic Prerequisites
-- Order of Operations requires basic operations
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Order of Operations'),
  id
FROM topics 
WHERE name IN ('Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Mental Math requires basic operations
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Mental Math Strategies'),
  id
FROM topics 
WHERE name IN ('Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Working with Integers requires basic operations
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Working with Integers'),
  id
FROM topics 
WHERE name IN ('Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Number Properties requires basic operations
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Number Properties'),
  id
FROM topics 
WHERE name IN ('Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- ============================================
-- ALGEBRA FUNDAMENTALS
-- ============================================

INSERT INTO topics (name, description, difficulty, xp_value, domain) 
VALUES
('Variables and Expressions', 'Understanding variables, writing and evaluating expressions', 3, 20, 'algebra'),
('Linear Equations: One Variable', 'Solving equations like 2x + 5 = 13', 4, 25, 'algebra'),
('Linear Equations: Two Variables', 'Working with equations in two variables', 5, 30, 'algebra'),
('Equation Solving Strategies', 'Isolation, substitution, and other solving techniques', 4, 25, 'algebra'),
('Simplifying Expressions', 'Combining like terms, distributing', 4, 25, 'algebra'),
('Word Problems to Equations', 'Translating word problems into algebraic equations', 5, 30, 'algebra')
ON CONFLICT (name) DO NOTHING;

-- Algebra Prerequisites
-- Variables and Expressions requires basic arithmetic
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Variables and Expressions'),
  id
FROM topics 
WHERE name IN ('Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division', 'Order of Operations')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Linear Equations: One Variable requires variables
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Linear Equations: One Variable'),
  id
FROM topics 
WHERE name IN ('Variables and Expressions', 'Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Linear Equations: Two Variables requires one-variable equations
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Linear Equations: Two Variables'),
  (SELECT id FROM topics WHERE name = 'Linear Equations: One Variable')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Equation Solving Strategies requires linear equations
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Equation Solving Strategies'),
  (SELECT id FROM topics WHERE name = 'Linear Equations: One Variable')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Simplifying Expressions requires variables
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Simplifying Expressions'),
  (SELECT id FROM topics WHERE name = 'Variables and Expressions')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Word Problems to Equations requires equation solving
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Word Problems to Equations'),
  id
FROM topics 
WHERE name IN ('Linear Equations: One Variable', 'Equation Solving Strategies')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- ============================================
-- PROPORTIONS & RATIOS
-- ============================================

INSERT INTO topics (name, description, difficulty, xp_value, domain) 
VALUES
('Understanding Fractions', 'Basic fraction concepts, equivalent fractions', 3, 20, 'proportions'),
('Fraction Operations', 'Adding, subtracting, multiplying, dividing fractions', 4, 25, 'proportions'),
('Ratios and Rates', 'Understanding ratios, rates, and unit rates', 4, 25, 'proportions'),
('Proportions', 'Setting up and solving proportions', 5, 30, 'proportions'),
('Percentages', 'Converting between fractions, decimals, and percentages', 4, 25, 'proportions'),
('Percentage Problems', 'Solving percentage increase/decrease, finding percentages', 5, 30, 'proportions')
ON CONFLICT (name) DO NOTHING;

-- Proportions Prerequisites
-- Understanding Fractions requires basic division
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Understanding Fractions'),
  id
FROM topics 
WHERE name IN ('Basic Division', 'Basic Multiplication')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Fraction Operations requires understanding fractions
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Fraction Operations'),
  (SELECT id FROM topics WHERE name = 'Understanding Fractions')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Ratios and Rates requires understanding fractions
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Ratios and Rates'),
  (SELECT id FROM topics WHERE name = 'Understanding Fractions')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Proportions requires ratios
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Proportions'),
  (SELECT id FROM topics WHERE name = 'Ratios and Rates')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Percentages requires fractions
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Percentages'),
  (SELECT id FROM topics WHERE name = 'Understanding Fractions')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Percentage Problems requires percentages
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Percentage Problems'),
  (SELECT id FROM topics WHERE name = 'Percentages')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- ============================================
-- WORD PROBLEMS
-- ============================================

INSERT INTO topics (name, description, difficulty, xp_value, domain) 
VALUES
('Problem Decomposition', 'Breaking down complex word problems into steps', 4, 25, 'word_problems'),
('Identifying Key Information', 'Extracting relevant information from word problems', 4, 25, 'word_problems'),
('Setting Up Equations from Words', 'Translating word problems into mathematical equations', 5, 30, 'word_problems'),
('Solving Word Problems', 'Complete process: read, understand, set up, solve, verify', 5, 30, 'word_problems'),
('Multi-Step Word Problems', 'Problems requiring multiple operations or equations', 6, 35, 'word_problems'),
('Verification and Checking', 'Verifying solutions make sense in context', 4, 25, 'word_problems')
ON CONFLICT (name) DO NOTHING;

-- Word Problems Prerequisites
-- Problem Decomposition requires basic problem-solving skills (no hard prerequisites, but benefits from arithmetic)
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Problem Decomposition'),
  id
FROM topics 
WHERE name IN ('Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Identifying Key Information requires problem decomposition
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Identifying Key Information'),
  (SELECT id FROM topics WHERE name = 'Problem Decomposition')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Setting Up Equations from Words requires algebra and word problem skills
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Setting Up Equations from Words'),
  id
FROM topics 
WHERE name IN ('Word Problems to Equations', 'Identifying Key Information')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Solving Word Problems requires equation setup
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Solving Word Problems'),
  (SELECT id FROM topics WHERE name = 'Setting Up Equations from Words')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Multi-Step Word Problems requires solving word problems
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Multi-Step Word Problems'),
  (SELECT id FROM topics WHERE name = 'Solving Word Problems')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- Verification and Checking requires solving word problems
INSERT INTO topic_prerequisites (topic_id, prerequisite_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Verification and Checking'),
  (SELECT id FROM topics WHERE name = 'Solving Word Problems')
ON CONFLICT (topic_id, prerequisite_id) DO NOTHING;

-- ============================================
-- ENCOMPASSING RELATIONSHIPS (FIRe Algorithm)
-- ============================================

-- Advanced topics that encompass simpler topics for implicit repetition

-- Multi-Step Word Problems encompasses all word problem topics
INSERT INTO topic_encompassings (topic_id, encompassed_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Multi-Step Word Problems'),
  id
FROM topics 
WHERE name IN ('Problem Decomposition', 'Identifying Key Information', 'Setting Up Equations from Words', 'Solving Word Problems', 'Verification and Checking')
ON CONFLICT (topic_id, encompassed_id) DO NOTHING;

-- Linear Equations: Two Variables encompasses one-variable equations
INSERT INTO topic_encompassings (topic_id, encompassed_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Linear Equations: Two Variables'),
  (SELECT id FROM topics WHERE name = 'Linear Equations: One Variable')
ON CONFLICT (topic_id, encompassed_id) DO NOTHING;

-- Advanced arithmetic topics encompass basic operations
INSERT INTO topic_encompassings (topic_id, encompassed_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Order of Operations'),
  id
FROM topics 
WHERE name IN ('Basic Addition', 'Basic Subtraction', 'Basic Multiplication', 'Basic Division')
ON CONFLICT (topic_id, encompassed_id) DO NOTHING;

-- Percentage Problems encompasses basic percentage concepts
INSERT INTO topic_encompassings (topic_id, encompassed_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Percentage Problems'),
  (SELECT id FROM topics WHERE name = 'Percentages')
ON CONFLICT (topic_id, encompassed_id) DO NOTHING;

-- Proportions encompasses ratios
INSERT INTO topic_encompassings (topic_id, encompassed_id)
SELECT 
  (SELECT id FROM topics WHERE name = 'Proportions'),
  (SELECT id FROM topics WHERE name = 'Ratios and Rates')
ON CONFLICT (topic_id, encompassed_id) DO NOTHING;

