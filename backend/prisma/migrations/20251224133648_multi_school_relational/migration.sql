/*
  Warnings:

  - The primary key for the `Dataset` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `schoolId` to the `Dataset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Student" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMm" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "nrc" TEXT,
    "dob" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attendanceRate" INTEGER NOT NULL,
    "feesPending" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "lastPaymentDate" TEXT,
    "classId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Student_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "ClassGroup" ("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "joinDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "Staff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Room" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isOccupied" BOOLEAN NOT NULL,
    "facilities" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "Room_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassGroup" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "ClassGroup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassGroup_schoolId_teacherId_fkey" FOREIGN KEY ("schoolId", "teacherId") REFERENCES "Staff" ("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassGroup_schoolId_roomId_fkey" FOREIGN KEY ("schoolId", "roomId") REFERENCES "Room" ("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subject" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMm" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "periodsPerWeek" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "periodId" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "curriculumType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "TimetableEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimetableEntry_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "ClassGroup" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimetableEntry_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "Subject" ("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimetableEntry_schoolId_teacherId_fkey" FOREIGN KEY ("schoolId", "teacherId") REFERENCES "Staff" ("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exam" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "Exam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamClass" (
    "schoolId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    PRIMARY KEY ("schoolId", "examId", "classId"),
    CONSTRAINT "ExamClass_schoolId_examId_fkey" FOREIGN KEY ("schoolId", "examId") REFERENCES "Exam" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamClass_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "ClassGroup" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "ExamResult_schoolId_examId_fkey" FOREIGN KEY ("schoolId", "examId") REFERENCES "Exam" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamResult_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "Student" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamResult_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "Subject" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamResult_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeType" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMm" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "applicableGrades" JSONB NOT NULL,
    "description" TEXT,
    "dueDate" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "FeeType_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "payerName" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "remark" TEXT,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "Payment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "Student" ("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentItem" (
    "schoolId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "feeTypeId" TEXT,
    "description" TEXT,
    "amount" INTEGER NOT NULL,

    PRIMARY KEY ("schoolId", "paymentId", "lineNo"),
    CONSTRAINT "PaymentItem_schoolId_paymentId_fkey" FOREIGN KEY ("schoolId", "paymentId") REFERENCES "Payment" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentItem_schoolId_feeTypeId_fkey" FOREIGN KEY ("schoolId", "feeTypeId") REFERENCES "FeeType" ("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "schoolId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("schoolId", "id"),
    CONSTRAINT "Expense_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentAttendanceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentAttendanceSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentAttendanceSession_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "ClassGroup" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentAttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentAttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudentAttendanceSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentAttendanceRecord_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "Student" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffAttendanceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffAttendanceSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffAttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkIn" TEXT,
    "checkOut" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffAttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StaffAttendanceSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffAttendanceRecord_schoolId_staffId_fkey" FOREIGN KEY ("schoolId", "staffId") REFERENCES "Staff" ("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dataset" (
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("schoolId", "key"),
    CONSTRAINT "Dataset_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Dataset" ("createdAt", "data", "key", "updatedAt", "version") SELECT "createdAt", "data", "key", "updatedAt", "version" FROM "Dataset";
DROP TABLE "Dataset";
ALTER TABLE "new_Dataset" RENAME TO "Dataset";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "id", "passwordHash", "role", "updatedAt", "username") SELECT "createdAt", "id", "passwordHash", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE INDEX "ClassGroup_schoolId_teacherId_idx" ON "ClassGroup"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "ClassGroup_schoolId_roomId_idx" ON "ClassGroup"("schoolId", "roomId");

-- CreateIndex
CREATE INDEX "Subject_schoolId_code_idx" ON "Subject"("schoolId", "code");

-- CreateIndex
CREATE INDEX "TimetableEntry_schoolId_classId_day_periodId_idx" ON "TimetableEntry"("schoolId", "classId", "day", "periodId");

-- CreateIndex
CREATE INDEX "TimetableEntry_schoolId_teacherId_day_periodId_idx" ON "TimetableEntry"("schoolId", "teacherId", "day", "periodId");

-- CreateIndex
CREATE INDEX "ExamClass_schoolId_classId_idx" ON "ExamClass"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "ExamResult_schoolId_examId_idx" ON "ExamResult"("schoolId", "examId");

-- CreateIndex
CREATE INDEX "ExamResult_schoolId_studentId_idx" ON "ExamResult"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "Payment_schoolId_studentId_idx" ON "Payment"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "PaymentItem_schoolId_feeTypeId_idx" ON "PaymentItem"("schoolId", "feeTypeId");

-- CreateIndex
CREATE INDEX "Expense_schoolId_category_idx" ON "Expense"("schoolId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendanceSession_schoolId_date_classId_key" ON "StudentAttendanceSession"("schoolId", "date", "classId");

-- CreateIndex
CREATE INDEX "StudentAttendanceRecord_schoolId_studentId_idx" ON "StudentAttendanceRecord"("schoolId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendanceRecord_sessionId_studentId_key" ON "StudentAttendanceRecord"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendanceSession_schoolId_date_key" ON "StaffAttendanceSession"("schoolId", "date");

-- CreateIndex
CREATE INDEX "StaffAttendanceRecord_schoolId_staffId_idx" ON "StaffAttendanceRecord"("schoolId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendanceRecord_sessionId_staffId_key" ON "StaffAttendanceRecord"("sessionId", "staffId");
