/**
 * Secure Service Layer
 * 
 * This module provides helper functions that ALWAYS include schoolId filtering.
 * These functions should be used instead of direct Prisma calls to ensure
 * data isolation between schools.
 * 
 * All functions automatically use the schoolId from the request context,
 * preventing accidental data leakage.
 */

import { prisma, getCurrentSchoolId } from '../prisma.js';
import type { Prisma } from '@prisma/client';

/**
 * Student Service - All operations automatically filtered by schoolId
 */
export const StudentService = {
  /**
   * Get all students for the current school
   */
  findAll: async (filters?: { grade?: string; status?: string }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.student.findMany({
      where: {
        schoolId,
        ...(filters?.grade && { grade: { contains: filters.grade } }),
        ...(filters?.status && { status: filters.status as any }),
      },
    });
  },

  /**
   * Get a student by ID (automatically scoped to current school)
   */
  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.student.findUnique({
      where: { schoolId, id },
    });
  },

  /**
   * Create a new student (automatically assigns schoolId)
   */
  create: async (data: Omit<Prisma.StudentCreateInput, 'school' | 'schoolId'>) => {
    return prisma.student.create({
      data: {
        ...data,
        // schoolId is automatically added by secure Prisma client
      },
    });
  },

  /**
   * Update a student (automatically scoped to current school)
   */
  update: async (id: string, data: Prisma.StudentUpdateInput) => {
    const schoolId = getCurrentSchoolId();
    return prisma.student.update({
      where: { schoolId, id },
      data,
    });
  },

  /**
   * Delete a student (automatically scoped to current school)
   */
  delete: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.student.delete({
      where: { schoolId, id },
    });
  },
};

/**
 * Staff Service - All operations automatically filtered by schoolId
 */
export const StaffService = {
  findAll: async (filters?: { department?: string; role?: string }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.staff.findMany({
      where: {
        schoolId,
        ...(filters?.department && { department: filters.department }),
        ...(filters?.role && { role: filters.role }),
      },
    });
  },

  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.staff.findUnique({
      where: { schoolId, id },
    });
  },

  create: async (data: Omit<Prisma.StaffCreateInput, 'school' | 'schoolId'>) => {
    return prisma.staff.create({
      data: {
        ...data,
        // schoolId is automatically added
      },
    });
  },

  update: async (id: string, data: Prisma.StaffUpdateInput) => {
    const schoolId = getCurrentSchoolId();
    return prisma.staff.update({
      where: { schoolId, id },
      data,
    });
  },

  delete: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.staff.delete({
      where: { schoolId, id },
    });
  },
};

/**
 * Exam Service - All operations automatically filtered by schoolId
 */
export const ExamService = {
  findAll: async (filters?: { academicYear?: string; status?: string }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.exam.findMany({
      where: {
        schoolId,
        ...(filters?.academicYear && { academicYear: filters.academicYear }),
        ...(filters?.status && { status: filters.status as any }),
      },
      orderBy: { startDate: 'desc' },
    });
  },

  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.exam.findUnique({
      where: { schoolId, id },
    });
  },

  create: async (data: Omit<Prisma.ExamCreateInput, 'school' | 'schoolId'>) => {
    return prisma.exam.create({
      data: {
        ...data,
        // schoolId is automatically added
      },
    });
  },

  update: async (id: string, data: Prisma.ExamUpdateInput) => {
    const schoolId = getCurrentSchoolId();
    return prisma.exam.update({
      where: { schoolId, id },
      data,
    });
  },

  delete: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.exam.delete({
      where: { schoolId, id },
    });
  },
};

/**
 * Payment Service - All operations automatically filtered by schoolId
 */
export const PaymentService = {
  findAll: async (filters?: { studentId?: string; dateFrom?: string; dateTo?: string }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.payment.findMany({
      where: {
        schoolId,
        ...(filters?.studentId && { studentId: filters.studentId }),
        ...(filters?.dateFrom && filters?.dateTo && {
          date: { gte: filters.dateFrom, lte: filters.dateTo },
        }),
      },
      orderBy: { date: 'desc' },
    });
  },

  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.payment.findUnique({
      where: { schoolId, id },
    });
  },

  create: async (data: Omit<Prisma.PaymentCreateInput, 'school' | 'schoolId'>) => {
    return prisma.payment.create({
      data: {
        ...data,
        // schoolId is automatically added
      },
    });
  },
};

/**
 * Expense Service - All operations automatically filtered by schoolId
 */
export const ExpenseService = {
  findAll: async (filters?: { category?: string; status?: string; dateFrom?: string; dateTo?: string }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.expense.findMany({
      where: {
        schoolId,
        ...(filters?.category && { category: filters.category as any }),
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.dateFrom && filters?.dateTo && {
          date: { gte: filters.dateFrom, lte: filters.dateTo },
        }),
      },
      orderBy: { date: 'desc' },
    });
  },

  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.expense.findUnique({
      where: { schoolId, id },
    });
  },

  create: async (data: Omit<Prisma.ExpenseCreateInput, 'school' | 'schoolId'>) => {
    return prisma.expense.create({
      data: {
        ...data,
        // schoolId is automatically added
      },
    });
  },

  update: async (id: string, data: Prisma.ExpenseUpdateInput) => {
    const schoolId = getCurrentSchoolId();
    return prisma.expense.update({
      where: { schoolId, id },
      data,
    });
  },
};

/**
 * Class Service - All operations automatically filtered by schoolId
 */
export const ClassService = {
  findAll: async (filters?: { gradeLevel?: string }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.classGroup.findMany({
      where: {
        schoolId,
        ...(filters?.gradeLevel && { gradeLevel: filters.gradeLevel }),
      },
    });
  },

  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.classGroup.findUnique({
      where: { schoolId, id },
    });
  },
};

/**
 * Subject Service - All operations automatically filtered by schoolId
 */
export const SubjectService = {
  findAll: async (filters?: { gradeLevel?: string; department?: string }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.subject.findMany({
      where: {
        schoolId,
        ...(filters?.gradeLevel && { gradeLevel: filters.gradeLevel }),
        ...(filters?.department && { department: filters.department }),
      },
    });
  },

  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.subject.findUnique({
      where: { schoolId, id },
    });
  },
};

/**
 * Room Service - All operations automatically filtered by schoolId
 */
export const RoomService = {
  findAll: async (filters?: { type?: string; isOccupied?: boolean }) => {
    const schoolId = getCurrentSchoolId();
    return prisma.room.findMany({
      where: {
        schoolId,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.isOccupied !== undefined && { isOccupied: filters.isOccupied }),
      },
    });
  },

  findById: async (id: string) => {
    const schoolId = getCurrentSchoolId();
    return prisma.room.findUnique({
      where: { schoolId, id },
    });
  },
};

