/**
 * Examples of Secure Multi-Tenant Usage
 * 
 * This file demonstrates how to use the secure Prisma client
 * and service layer to ensure data isolation between schools.
 */

import { prisma, getCurrentSchoolId } from '../prisma.js';
import { StudentService, ExamService, PaymentService } from '../services/secureService.js';
import { requireAuth } from '../middleware/auth.js';
import { Router } from 'express';

const exampleRouter = Router();

// ============================================
// Example 1: Using Secure Prisma Client
// ============================================

// After requireAuth middleware, all queries automatically include schoolId
exampleRouter.get('/students', requireAuth, async (req, res) => {
  // ✅ CORRECT: schoolId is automatically included
  const students = await prisma.student.findMany({
    where: {
      // Additional filters can be added
      status: 'Active',
    },
    // schoolId is automatically merged into the where clause
  });

  res.json(students);
});

// ============================================
// Example 2: Using Secure Service Layer
// ============================================

exampleRouter.get('/students-service', requireAuth, async (req, res) => {
  // ✅ CORRECT: Service layer automatically filters by schoolId
  const students = await StudentService.findAll({
    grade: 'Grade 10',
    status: 'Active',
  });

  res.json(students);
});

// ============================================
// Example 3: Finding by ID
// ============================================

exampleRouter.get('/students/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  // ✅ CORRECT: schoolId is automatically included
  const student = await prisma.student.findUnique({
    where: { 
      schoolId: getCurrentSchoolId(), // Explicit for clarity, but auto-added
      id 
    },
  });

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json(student);
});

// ============================================
// Example 4: Creating Records
// ============================================

exampleRouter.post('/students', requireAuth, async (req, res) => {
  const { nameEn, nameMm, grade } = req.body;

  // ✅ CORRECT: schoolId is automatically added to create
  const student = await prisma.student.create({
    data: {
      id: `ST-${Date.now()}`,
      nameEn,
      nameMm,
      grade,
      fatherName: '',
      dob: '',
      status: 'Active',
      attendanceRate: 0,
      feesPending: 0,
      phone: '',
      // schoolId is automatically added by secure client
    },
  });

  res.json(student);
});

// ============================================
// Example 5: Using Service Layer for Complex Queries
// ============================================

exampleRouter.get('/exams', requireAuth, async (req, res) => {
  // ✅ CORRECT: Service layer handles schoolId filtering
  const exams = await ExamService.findAll({
    academicYear: '2024-2025',
    status: 'Completed',
  });

  res.json(exams);
});

// ============================================
// Example 6: Transactions
// ============================================

exampleRouter.post('/payments', requireAuth, async (req, res) => {
  const { studentId, amount, items } = req.body;
  const schoolId = getCurrentSchoolId();

  // ✅ CORRECT: Transaction maintains schoolId context
  const result = await prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.payment.create({
      data: {
        id: `PAY-${Date.now()}`,
        studentId,
        totalAmount: amount,
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0],
        // schoolId automatically added
      },
    });

    // Create payment items
    for (const item of items) {
      await tx.paymentItem.create({
        data: {
          paymentId: payment.id,
          lineNo: item.lineNo,
          feeTypeId: item.feeTypeId,
          amount: item.amount,
          // schoolId automatically added
        },
      });
    }

    return payment;
  });

  res.json(result);
});

// ============================================
// ❌ WRONG EXAMPLES - What NOT to do
// ============================================

/*
// ❌ WRONG: Don't use basePrismaClient directly in routes
import { basePrismaClient } from '../prisma.js';

exampleRouter.get('/wrong', requireAuth, async (req, res) => {
  // This bypasses automatic schoolId filtering!
  const students = await basePrismaClient.student.findMany();
  // Missing schoolId filter - SECURITY RISK!
});

// ❌ WRONG: Don't forget requireAuth middleware
exampleRouter.get('/wrong2', async (req, res) => {
  // No authentication - schoolId context not set
  const students = await prisma.student.findMany();
  // Will throw error: "schoolId context not set"
});

// ❌ WRONG: Don't manually construct queries without schoolId
exampleRouter.get('/wrong3', requireAuth, async (req, res) => {
  const students = await basePrismaClient.student.findMany({
    where: {
      status: 'Active',
      // Missing schoolId - SECURITY RISK!
    },
  });
});
*/

export { exampleRouter };

