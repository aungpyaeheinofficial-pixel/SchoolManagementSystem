import { PrismaClient } from '@prisma/client';

// Base Prisma client
const basePrisma = new PrismaClient();

// Context to store current schoolId per request
// Using AsyncLocalStorage for request-scoped context (Node.js 13.10+)
import { AsyncLocalStorage } from 'async_hooks';

export const schoolIdContext = new AsyncLocalStorage<string>();

/**
 * Get the current schoolId from context
 * Throws error if not set (prevents accidental data leakage)
 */
export function getCurrentSchoolId(): string {
  const schoolId = schoolIdContext.getStore();
  if (!schoolId) {
    throw new Error('schoolId context not set. This is a security violation.');
  }
  return schoolId;
}

/**
 * Run a function with a schoolId context
 */
export function withSchoolId<T>(schoolId: string, fn: () => Promise<T>): Promise<T> {
  return schoolIdContext.run(schoolId, fn);
}

/**
 * Secure Prisma client wrapper that automatically filters by schoolId
 * This ensures all queries include schoolId filtering
 */
class SecurePrismaClient {
  private base: PrismaClient;

  constructor(base: PrismaClient) {
    this.base = base;
  }

  // Helper to get schoolId or throw
  private getSchoolId(): string {
    return getCurrentSchoolId();
  }

  // Helper to merge where clause with schoolId
  private mergeWhere<T extends { schoolId?: string }>(where?: T): T & { schoolId: string } {
    const schoolId = this.getSchoolId();
    return { ...where, schoolId } as T & { schoolId: string };
  }

  // Student operations
  get student() {
    return {
      findMany: (args?: { where?: any; include?: any; select?: any }) => {
        return this.base.student.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.student.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.student.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.student.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.student.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.student.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      count: (args?: { where?: any }) => {
        return this.base.student.count({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // Staff operations
  get staff() {
    return {
      findMany: (args?: { where?: any; include?: any; select?: any }) => {
        return this.base.staff.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.staff.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.staff.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.staff.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.staff.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.staff.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // Room operations
  get room() {
    return {
      findMany: (args?: { where?: any }) => {
        return this.base.room.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.room.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.room.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.room.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.room.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.room.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // ClassGroup operations
  get classGroup() {
    return {
      findMany: (args?: { where?: any }) => {
        return this.base.classGroup.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.classGroup.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.classGroup.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.classGroup.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.classGroup.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.classGroup.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // Subject operations
  get subject() {
    return {
      findMany: (args?: { where?: any }) => {
        return this.base.subject.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.subject.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.subject.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.subject.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.subject.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.subject.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // Exam operations
  get exam() {
    return {
      findMany: (args?: { where?: any }) => {
        return this.base.exam.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.exam.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.exam.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.exam.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.exam.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.exam.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // Payment operations
  get payment() {
    return {
      findMany: (args?: { where?: any }) => {
        return this.base.payment.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.payment.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.payment.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.payment.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.payment.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.payment.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // Expense operations
  get expense() {
    return {
      findMany: (args?: { where?: any }) => {
        return this.base.expense.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.expense.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.expense.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.expense.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.expense.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.expense.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // FeeType operations
  get feeType() {
    return {
      findMany: (args?: { where?: any }) => {
        return this.base.feeType.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
      findUnique: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.feeType.findUnique({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      create: (args: { data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.feeType.create({
          ...args,
          data: { ...args.data, schoolId },
        });
      },
      update: (args: { where: { schoolId: string; id: string }; data: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.feeType.update({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      delete: (args: { where: { schoolId: string; id: string } }) => {
        const schoolId = this.getSchoolId();
        return this.base.feeType.delete({
          ...args,
          where: { ...args.where, schoolId },
        });
      },
      deleteMany: (args?: { where?: any }) => {
        return this.base.feeType.deleteMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // Dataset operations (needs special handling for composite key)
  get dataset() {
    return {
      findUnique: (args: { where: { schoolId_key: { schoolId: string; key: string } } }) => {
        const schoolId = this.getSchoolId();
        return this.base.dataset.findUnique({
          ...args,
          where: { ...args.where, schoolId_key: { ...args.where.schoolId_key, schoolId } },
        });
      },
      upsert: (args: { where: { schoolId_key: { schoolId: string; key: string } }; create: any; update: any }) => {
        const schoolId = this.getSchoolId();
        return this.base.dataset.upsert({
          ...args,
          where: { ...args.where, schoolId_key: { ...args.where.schoolId_key, schoolId } },
          create: { ...args.create, schoolId },
          update: args.update,
        });
      },
    };
  }

  // User operations (needs schoolId from context)
  get user() {
    return {
      findUnique: (args: { where: { username: string } }) => {
        // User lookup by username doesn't need schoolId filter
        return this.base.user.findUnique(args);
      },
      findMany: (args?: { where?: any }) => {
        return this.base.user.findMany({
          ...args,
          where: this.mergeWhere(args?.where),
        });
      },
    };
  }

  // School operations (no filtering needed - admin only)
  get school() {
    return this.base.school;
  }

  // Transaction support
  $transaction<T>(fn: (tx: SecurePrismaClient) => Promise<T>): Promise<T> {
    return this.base.$transaction(async (tx) => {
      // Create a transaction-aware secure client
      const secureTx = new SecurePrismaClient(tx as any);
      return fn(secureTx);
    });
  }

  // Direct access to base client for operations that need it
  // Use with caution - only for operations that don't need schoolId filtering
  get $raw() {
    return this.base;
  }
}

// Export the secure client
export const prisma = new SecurePrismaClient(basePrisma);

// Export base client for operations that explicitly manage schoolId
// (e.g., datasetService which handles bulk operations)
export const basePrismaClient = basePrisma;
