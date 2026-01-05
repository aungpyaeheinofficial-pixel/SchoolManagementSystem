# Multi-Tenant Security Implementation

This document describes the security measures implemented to ensure data isolation between schools (tenants) in the School Management System.

## Architecture: Shared Database, Shared Schema

The system uses a **Shared Database, Shared Schema** approach where:
- All schools share the same database and tables
- Every table includes a `schoolId` discriminator column
- All queries are automatically filtered by `schoolId` to prevent data leakage

## Security Layers

### 1. Automatic Query Filtering (Prisma Middleware)

**Location:** `backend/src/prisma.ts`

The secure Prisma client automatically:
- Adds `schoolId` to all `findMany`, `findUnique`, `create`, `update`, `delete` operations
- Uses AsyncLocalStorage to maintain request-scoped `schoolId` context
- Throws an error if `schoolId` context is not set (prevents accidental data leakage)

**How it works:**
```typescript
// All queries automatically include schoolId
const students = await prisma.student.findMany();
// Internally becomes: prisma.student.findMany({ where: { schoolId: currentSchoolId } })
```

### 2. Request Context Middleware

**Location:** `backend/src/middleware/auth.ts`

The `requireAuth` middleware:
1. Verifies JWT token
2. Extracts `schoolId` from token
3. Sets `schoolId` in AsyncLocalStorage context
4. All subsequent Prisma queries automatically use this `schoolId`

**Usage:**
```typescript
app.use('/api/sync', requireAuth, syncRouter);
// All routes after requireAuth automatically have schoolId context
```

### 3. Secure Service Layer

**Location:** `backend/src/services/secureService.ts`

Helper functions that **always** include `schoolId` filtering:
- `StudentService.findAll()` - Get all students for current school
- `StudentService.findById(id)` - Get student (scoped to school)
- `StaffService.findAll()` - Get all staff for current school
- `ExamService.findAll()` - Get all exams for current school
- And more...

**Usage:**
```typescript
// Instead of:
const students = await prisma.student.findMany({ where: { schoolId } });

// Use:
const students = await StudentService.findAll();
// schoolId is automatically included
```

### 4. Application-Level Validation

**Location:** Throughout the codebase

Additional checks:
- JWT tokens include `schoolId` and cannot be modified
- All routes require authentication (`requireAuth` middleware)
- Composite primary keys include `schoolId` (database-level enforcement)
- Foreign key constraints include `schoolId` (prevents cross-school relationships)

## Usage Guidelines

### ✅ DO: Use Secure Prisma Client

```typescript
// After requireAuth middleware, use prisma directly
// schoolId is automatically included
const students = await prisma.student.findMany();
const student = await prisma.student.findUnique({ where: { schoolId, id } });
```

### ✅ DO: Use Secure Service Layer

```typescript
import { StudentService } from '../services/secureService.js';

// Automatically filtered by schoolId
const students = await StudentService.findAll();
const student = await StudentService.findById('ST-001');
```

### ✅ DO: Use Base Client for Bulk Operations

```typescript
import { basePrismaClient } from '../prisma.js';

// For bulk operations that explicitly manage schoolId
await exportDatasetForSchool(basePrismaClient, schoolId);
```

### ❌ DON'T: Bypass Security

```typescript
// ❌ WRONG - Don't use basePrismaClient directly in routes
const students = await basePrismaClient.student.findMany();
// This bypasses automatic schoolId filtering!

// ❌ WRONG - Don't forget requireAuth middleware
app.use('/api/data', dataRouter); // Missing requireAuth!

// ❌ WRONG - Don't manually set schoolId from request without context
const schoolId = req.user.schoolId;
const students = await basePrismaClient.student.findMany({ where: { schoolId } });
// Use prisma (secure client) instead
```

## Security Checklist

When adding new routes or services:

- [ ] Route uses `requireAuth` middleware
- [ ] Uses `prisma` (secure client) instead of `basePrismaClient`
- [ ] Uses secure service layer functions when available
- [ ] Never manually constructs queries without `schoolId`
- [ ] Test that queries return only data for the authenticated school

## Testing Security

### Test Data Isolation

```typescript
// Test that School A cannot access School B's data
const schoolA = await login('admin@schoolA.com', 'password');
const schoolB = await login('admin@schoolB.com', 'password');

// School A should only see their students
const studentsA = await getStudents(schoolA.token);
expect(studentsA).not.toContain(schoolBStudent);

// School B should only see their students
const studentsB = await getStudents(schoolB.token);
expect(studentsB).not.toContain(schoolAStudent);
```

### Test Missing Context

```typescript
// Should throw error if schoolId context is not set
expect(() => {
  prisma.student.findMany();
}).toThrow('schoolId context not set');
```

## Database-Level Security (Future Enhancement)

If migrating to PostgreSQL, consider implementing **Row-Level Security (RLS)**:

```sql
-- Enable RLS on all tables
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY school_isolation ON "Student"
  FOR ALL
  USING (schoolId = current_setting('app.school_id')::text);
```

This provides defense-in-depth, but the application-level filtering is sufficient for SQLite.

## Migration Notes

### Existing Code

Existing code that uses `prisma` directly will continue to work, but now has automatic `schoolId` filtering.

### Bulk Operations

For bulk operations (like `datasetService`), continue using `basePrismaClient` with explicit `schoolId` parameters:

```typescript
export async function exportDatasetForSchool(
  prisma: PrismaClient, 
  schoolId: string
): Promise<DatasetShape> {
  // Explicit schoolId parameter is correct for bulk operations
  const students = await prisma.student.findMany({ where: { schoolId } });
}
```

## Summary

The system now has **three layers of security**:

1. **Automatic Filtering** - Prisma client automatically adds `schoolId` to all queries
2. **Request Context** - Middleware sets `schoolId` from JWT token
3. **Service Layer** - Helper functions that enforce `schoolId` filtering

This ensures that even if a developer forgets to include `schoolId` in a query, the system will automatically add it, preventing data leakage between schools.

