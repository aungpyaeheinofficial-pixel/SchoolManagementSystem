import { Prisma, PrismaClient } from '@prisma/client';

type AnyObj = Record<string, any>;

export interface DatasetShape {
  students?: any[];
  staff?: any[];
  expenses?: any[];
  exams?: any[];
  marks?: any[];
  timetable?: any[];
  classes?: any[];
  rooms?: any[];
  subjects?: any[];
  feeStructures?: any[];
  attendance?: AnyObj;
  staffAttendance?: AnyObj;
  payments?: any[];
  exportDate?: string;
}

function toEnumKey(value: any): string {
  return String(value ?? '').replace(/\s+/g, '_').replace(/-/g, '_');
}

export async function exportDatasetForSchool(prisma: PrismaClient, schoolId: string): Promise<DatasetShape> {
  const [
    students,
    staff,
    expenses,
    rooms,
    classes,
    subjects,
    timetable,
    exams,
    examClasses,
    marks,
    fees,
    payments,
    paymentItems,
    studentAttendanceSessions,
    studentAttendanceRecords,
    staffAttendanceSessions,
    staffAttendanceRecords,
  ] = await Promise.all([
    prisma.student.findMany({ where: { schoolId } }),
    prisma.staff.findMany({ where: { schoolId } }),
    prisma.expense.findMany({ where: { schoolId } }),
    prisma.room.findMany({ where: { schoolId } }),
    prisma.classGroup.findMany({ where: { schoolId } }),
    prisma.subject.findMany({ where: { schoolId } }),
    prisma.timetableEntry.findMany({ where: { schoolId } }),
    prisma.exam.findMany({ where: { schoolId } }),
    prisma.examClass.findMany({ where: { schoolId } }),
    prisma.examResult.findMany({ where: { schoolId } }),
    prisma.feeType.findMany({ where: { schoolId } }),
    prisma.payment.findMany({ where: { schoolId } }),
    prisma.paymentItem.findMany({ where: { schoolId } }),
    prisma.studentAttendanceSession.findMany({ where: { schoolId } }),
    prisma.studentAttendanceRecord.findMany({ where: { schoolId } }),
    prisma.staffAttendanceSession.findMany({ where: { schoolId } }),
    prisma.staffAttendanceRecord.findMany({ where: { schoolId } }),
  ]);

  // Exams: stitch classes[]
  const examClassMap = new Map<string, string[]>();
  for (const ec of examClasses) {
    const key = ec.examId;
    const arr = examClassMap.get(key) ?? [];
    arr.push(ec.classId);
    examClassMap.set(key, arr);
  }
  const examsOut = exams.map((e) => ({
    id: e.id,
    name: e.name,
    academicYear: e.academicYear,
    term: e.term,
    startDate: e.startDate,
    endDate: e.endDate,
    status: e.status,
    classes: examClassMap.get(e.id) ?? [],
  }));

  // Payments: stitch items
  const itemsMap = new Map<string, any[]>();
  for (const it of paymentItems) {
    const key = it.paymentId;
    const arr = itemsMap.get(key) ?? [];
    arr.push({
      lineNo: it.lineNo,
      feeTypeId: it.feeTypeId,
      description: it.description,
      amount: it.amount,
    });
    itemsMap.set(key, arr);
  }
  const paymentsOut = payments.map((p) => ({
    id: p.id,
    studentId: p.studentId,
    payerName: p.payerName,
    paymentMethod: p.paymentMethod,
    remark: p.remark,
    discount: p.discount,
    totalAmount: p.totalAmount,
    date: p.date,
    items: itemsMap.get(p.id) ?? [],
    meta: p.meta ?? undefined,
  }));

  // Attendance export (nested)
  const attendance: AnyObj = {};
  for (const s of studentAttendanceSessions) {
    const dateKey = s.date;
    attendance[dateKey] ||= {};
    attendance[dateKey][s.classId] ||= {};
  }
  const sessionMap = new Map<string, { date: string; classId: string }>();
  for (const s of studentAttendanceSessions) sessionMap.set(s.id, { date: s.date, classId: s.classId });
  for (const r of studentAttendanceRecords) {
    const meta = sessionMap.get(r.sessionId);
    if (!meta) continue;
    attendance[meta.date] ||= {};
    attendance[meta.date][meta.classId] ||= {};
    attendance[meta.date][meta.classId][r.studentId] = { status: r.status, remark: r.remark || '' };
  }

  const staffAttendance: AnyObj = {};
  const staffSessionMap = new Map<string, { date: string }>();
  for (const s of staffAttendanceSessions) staffSessionMap.set(s.id, { date: s.date });
  for (const r of staffAttendanceRecords) {
    const meta = staffSessionMap.get(r.sessionId);
    if (!meta) continue;
    staffAttendance[meta.date] ||= {};
    staffAttendance[meta.date][r.staffId] = {
      status: r.status,
      checkIn: r.checkIn || '',
      checkOut: r.checkOut || '',
      remark: r.remark || '',
    };
  }

  return {
    students: students.map((s) => ({
      id: s.id,
      nameEn: s.nameEn,
      nameMm: s.nameMm,
      fatherName: s.fatherName,
      grade: s.grade,
      nrc: s.nrc,
      dob: s.dob,
      status: s.status === 'Fees_Due' ? 'Fees Due' : s.status,
      attendanceRate: s.attendanceRate,
      feesPending: s.feesPending,
      phone: s.phone,
      lastPaymentDate: s.lastPaymentDate,
    })),
    staff: staff.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      baseSalary: m.baseSalary,
      department: m.department,
      joinDate: m.joinDate,
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      date: e.date,
      paymentMethod: e.paymentMethod,
      status: e.status,
      ...(e.meta ? (e.meta as AnyObj) : {}),
    })),
    rooms: rooms.map((r) => ({
      id: r.id,
      number: r.number,
      building: r.building,
      type: r.type,
      capacity: r.capacity,
      isOccupied: r.isOccupied,
      facilities: Array.isArray(r.facilities) ? r.facilities : r.facilities,
    })),
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      section: c.section,
      teacherId: c.teacherId,
      teacherName: c.teacherName,
      roomId: c.roomId,
      roomName: c.roomName,
      studentCount: c.studentCount,
      maxCapacity: c.maxCapacity,
    })),
    subjects: subjects.map((s) => ({
      id: s.id,
      code: s.code,
      nameEn: s.nameEn,
      nameMm: s.nameMm,
      gradeLevel: s.gradeLevel,
      type: s.type,
      periodsPerWeek: s.periodsPerWeek,
      department: s.department,
    })),
    timetable: timetable.map((t) => ({
      id: t.id,
      classId: t.classId,
      day: t.day,
      periodId: t.periodId,
      subjectId: t.subjectId,
      teacherId: t.teacherId,
      curriculumType: t.curriculumType,
    })),
    exams: examsOut,
    marks: marks.map((m) => ({
      id: m.id,
      examId: m.examId,
      studentId: m.studentId,
      subjectId: m.subjectId,
      score: m.score,
      grade: m.grade,
      remark: m.remark,
    })),
    feeStructures: fees.map((f) => ({
      id: f.id,
      nameEn: f.nameEn,
      nameMm: f.nameMm,
      amount: f.amount,
      frequency: f.frequency === 'One_time' ? 'One-time' : f.frequency,
      academicYear: f.academicYear,
      applicableGrades: (f.applicableGrades as any) || [],
      description: f.description,
      dueDate: f.dueDate,
      isActive: f.isActive,
    })),
    payments: paymentsOut,
    attendance,
    staffAttendance,
    exportDate: new Date().toISOString(),
  };
}

export async function importDatasetForSchool(prisma: PrismaClient, schoolId: string, data: DatasetShape) {
  const students = Array.isArray(data.students) ? data.students : [];
  const staff = Array.isArray(data.staff) ? data.staff : [];
  const rooms = Array.isArray(data.rooms) ? data.rooms : [];
  const classes = Array.isArray(data.classes) ? data.classes : [];
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const timetable = Array.isArray(data.timetable) ? data.timetable : [];
  const exams = Array.isArray(data.exams) ? data.exams : [];
  const marks = Array.isArray(data.marks) ? data.marks : [];
  const fees = Array.isArray(data.feeStructures) ? data.feeStructures : [];
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const payments = Array.isArray(data.payments) ? data.payments : [];

  await prisma.$transaction(async (tx) => {
    // Delete in dependency order
    await tx.paymentItem.deleteMany({ where: { schoolId } });
    await tx.payment.deleteMany({ where: { schoolId } });

    await tx.examResult.deleteMany({ where: { schoolId } });
    await tx.examClass.deleteMany({ where: { schoolId } });
    await tx.exam.deleteMany({ where: { schoolId } });

    await tx.timetableEntry.deleteMany({ where: { schoolId } });

    await tx.studentAttendanceRecord.deleteMany({ where: { schoolId } });
    await tx.studentAttendanceSession.deleteMany({ where: { schoolId } });
    await tx.staffAttendanceRecord.deleteMany({ where: { schoolId } });
    await tx.staffAttendanceSession.deleteMany({ where: { schoolId } });

    await tx.student.deleteMany({ where: { schoolId } });
    await tx.classGroup.deleteMany({ where: { schoolId } });
    await tx.room.deleteMany({ where: { schoolId } });
    await tx.subject.deleteMany({ where: { schoolId } });
    await tx.staff.deleteMany({ where: { schoolId } });
    await tx.feeType.deleteMany({ where: { schoolId } });
    await tx.expense.deleteMany({ where: { schoolId } });

    // ------------------------------------------------------------
    // Pre-flight: ensure foreign-key referenced IDs exist.
    // Your current frontend mock data can reference teacherId/roomId
    // values that are not present in staff/rooms arrays (e.g. TF-NEW, RM-KG),
    // which would otherwise cause this import transaction to fail.
    // ------------------------------------------------------------
    const staffIds = new Set(staff.map((s: any) => String(s.id)));
    const roomIds = new Set(rooms.map((r: any) => String(r.id)));
    const classIds = new Set(classes.map((c: any) => String(c.id)));
    const subjectIds = new Set(subjects.map((s: any) => String(s.id)));
    const examIds = new Set(exams.map((e: any) => String(e.id)));
    const studentIds = new Set(students.map((s: any) => String(s.id)));
    const feeTypeIds = new Set(fees.map((f: any) => String(f.id)));

    const attendanceObj = data.attendance && typeof data.attendance === 'object' ? (data.attendance as AnyObj) : {};
    const staffAttendanceObj =
      data.staffAttendance && typeof data.staffAttendance === 'object' ? (data.staffAttendance as AnyObj) : {};

    const neededTeacherIds = new Set<string>();
    const neededRoomIds = new Set<string>();
    const neededClassIds = new Set<string>();
    const neededSubjectIds = new Set<string>();
    const neededExamIds = new Set<string>();
    const neededStudentIds = new Set<string>();

    for (const c of classes) {
      if (c?.teacherId) neededTeacherIds.add(String(c.teacherId));
      if (c?.roomId) neededRoomIds.add(String(c.roomId));
    }
    for (const t of timetable) {
      if (t?.teacherId) neededTeacherIds.add(String(t.teacherId));
      if (t?.classId) neededClassIds.add(String(t.classId));
      if (t?.subjectId) neededSubjectIds.add(String(t.subjectId));
    }
    for (const m of marks) {
      if (m?.examId) neededExamIds.add(String(m.examId));
      if (m?.studentId) neededStudentIds.add(String(m.studentId));
      if (m?.subjectId) neededSubjectIds.add(String(m.subjectId));
    }
    for (const e of exams) {
      if (Array.isArray(e?.classes)) {
        for (const classId of e.classes) neededClassIds.add(String(classId));
      }
    }
    for (const p of payments) {
      if (p?.studentId) neededStudentIds.add(String(p.studentId));
      if (Array.isArray(p?.items)) {
        for (const it of p.items) {
          const id = it?.feeTypeId ?? it?.feeId;
          if (id) feeTypeIds.add(String(id));
        }
      }
    }
    for (const [date, byClass] of Object.entries(attendanceObj)) {
      if (!byClass || typeof byClass !== 'object') continue;
      for (const classId of Object.keys(byClass as AnyObj)) neededClassIds.add(String(classId));
    }
    for (const [date, byStaff] of Object.entries(staffAttendanceObj)) {
      if (!byStaff || typeof byStaff !== 'object') continue;
      for (const staffId of Object.keys(byStaff as AnyObj)) neededTeacherIds.add(String(staffId));
    }

    const firstKnownTeacherId = staff[0]?.id ? String(staff[0].id) : 'TF-UNKNOWN';
    const firstKnownRoomId = rooms[0]?.id ? String(rooms[0].id) : 'RM-UNKNOWN';

    // Add placeholder teachers (Staff)
    const extraStaff: any[] = [];
    for (const id of neededTeacherIds) {
      if (!staffIds.has(id)) {
        staffIds.add(id);
        extraStaff.push({
          id,
          name: 'TBD',
          role: 'Teacher',
          baseSalary: 0,
          department: 'Unknown',
          joinDate: '',
        });
      }
    }
    // Ensure at least one teacher exists if classes reference unknowns only
    if (!staffIds.size) {
      staffIds.add(firstKnownTeacherId);
      extraStaff.push({
        id: firstKnownTeacherId,
        name: 'TBD',
        role: 'Teacher',
        baseSalary: 0,
        department: 'Unknown',
        joinDate: '',
      });
    }

    // Add placeholder rooms
    const extraRooms: any[] = [];
    for (const id of neededRoomIds) {
      if (!roomIds.has(id)) {
        roomIds.add(id);
        extraRooms.push({
          id,
          number: id,
          building: '',
          type: 'Classroom',
          capacity: 0,
          isOccupied: false,
          facilities: [],
        });
      }
    }
    if (!roomIds.size) {
      roomIds.add(firstKnownRoomId);
      extraRooms.push({
        id: firstKnownRoomId,
        number: firstKnownRoomId,
        building: '',
        type: 'Classroom',
        capacity: 0,
        isOccupied: false,
        facilities: [],
      });
    }

    // Add placeholder classes (needed by timetable/exams/attendance)
    const extraClasses: any[] = [];
    for (const id of neededClassIds) {
      if (!classIds.has(id)) {
        classIds.add(id);
        extraClasses.push({
          id,
          name: id,
          gradeLevel: '',
          section: '',
          teacherId: firstKnownTeacherId,
          teacherName: 'TBD',
          roomId: firstKnownRoomId,
          roomName: firstKnownRoomId,
          studentCount: 0,
          maxCapacity: 0,
        });
        // ensure referenced teacher/room exist
        neededTeacherIds.add(firstKnownTeacherId);
        neededRoomIds.add(firstKnownRoomId);
      }
    }

    // Add placeholder subjects (needed by timetable/marks)
    const extraSubjects: any[] = [];
    for (const id of neededSubjectIds) {
      if (!subjectIds.has(id)) {
        subjectIds.add(id);
        extraSubjects.push({
          id,
          code: id,
          nameEn: id,
          nameMm: '',
          gradeLevel: 'All',
          type: 'Core',
          periodsPerWeek: 0,
          department: 'General',
        });
      }
    }

    // Add placeholder exams if marks reference exams missing from exams array
    const extraExams: any[] = [];
    for (const id of neededExamIds) {
      if (!examIds.has(id)) {
        examIds.add(id);
        extraExams.push({
          id,
          name: id,
          academicYear: '',
          term: '',
          startDate: '',
          endDate: '',
          status: 'Upcoming',
          classes: [],
        });
      }
    }

    // Add placeholder students if marks/payments reference unknown students
    const extraStudents: any[] = [];
    for (const id of neededStudentIds) {
      if (!studentIds.has(id)) {
        studentIds.add(id);
        extraStudents.push({
          id,
          nameEn: id,
          nameMm: '',
          fatherName: '',
          grade: '',
          nrc: '',
          dob: '',
          status: 'Active',
          attendanceRate: 0,
          feesPending: 0,
          phone: '',
          lastPaymentDate: '',
        });
      }
    }

    const staffAll = [...staff, ...extraStaff];
    const roomsAll = [...rooms, ...extraRooms];
    const classesAll = [...classes, ...extraClasses];
    const subjectsAll = [...subjects, ...extraSubjects];
    const examsAll = [...exams, ...extraExams];
    const studentsAll = [...students, ...extraStudents];

    // Insert base entities
    const createManySafe = async <T extends keyof PrismaClient>(model: T, data: any[], batchSize = 500) => {
      if (!data.length) return;
      // Use skipDuplicates to avoid constraint failures when the client re-pushes the same data.
      // Batch inserts to keep SQLite + Prisma fast/stable even with large attendance datasets.
      for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        // @ts-ignore dynamic model access
        await tx[model].createMany({ data: chunk, skipDuplicates: true });
      }
    };

    await createManySafe('staff', staffAll.map((s: any) => ({
      schoolId,
      id: String(s.id),
      name: String(s.name ?? ''),
      role: String(s.role ?? ''),
      baseSalary: Number(s.baseSalary ?? 0),
      department: String(s.department ?? ''),
      joinDate: String(s.joinDate ?? ''),
    })));

    await createManySafe('room', roomsAll.map((r: any) => ({
      schoolId,
      id: String(r.id),
      number: String(r.number ?? ''),
      building: String(r.building ?? ''),
      type: (toEnumKey(r.type) as any) || 'Classroom',
      capacity: Number(r.capacity ?? 0),
      isOccupied: Boolean(r.isOccupied),
      facilities: (r.facilities ?? []) as Prisma.InputJsonValue,
    })));

    await createManySafe('classGroup', classesAll.map((c: any) => ({
      schoolId,
      id: String(c.id),
      name: String(c.name ?? ''),
      gradeLevel: String(c.gradeLevel ?? ''),
      section: String(c.section ?? ''),
      teacherId: String(c.teacherId ?? ''),
      teacherName: String(c.teacherName ?? ''),
      roomId: String(c.roomId ?? ''),
      roomName: String(c.roomName ?? ''),
      studentCount: Number(c.studentCount ?? 0),
      maxCapacity: Number(c.maxCapacity ?? 0),
    })));

    await createManySafe('subject', subjectsAll.map((s: any) => ({
      schoolId,
      id: String(s.id),
      code: String(s.code ?? ''),
      nameEn: String(s.nameEn ?? ''),
      nameMm: String(s.nameMm ?? ''),
      gradeLevel: String(s.gradeLevel ?? ''),
      type: (toEnumKey(s.type) as any) || 'Core',
      periodsPerWeek: Number(s.periodsPerWeek ?? 0),
      department: String(s.department ?? ''),
    })));

    await createManySafe('student', studentsAll.map((s: any) => ({
      schoolId,
      id: String(s.id),
      nameEn: String(s.nameEn ?? ''),
      nameMm: String(s.nameMm ?? ''),
      fatherName: String(s.fatherName ?? ''),
      grade: String(s.grade ?? ''),
      nrc: s.nrc ? String(s.nrc) : null,
      dob: String(s.dob ?? ''),
      status: (toEnumKey(s.status) === 'Fees_Due' ? 'Fees_Due' : toEnumKey(s.status)) as any,
      attendanceRate: Number(s.attendanceRate ?? 0),
      feesPending: Number(s.feesPending ?? 0),
      phone: String(s.phone ?? ''),
      lastPaymentDate: s.lastPaymentDate ? String(s.lastPaymentDate) : null,
      classId: null,
    })));

    await createManySafe(
      'timetableEntry',
      timetable.map((t: any) => ({
        schoolId,
        id: String(t.id),
        classId: String(t.classId ?? ''),
        day: (toEnumKey(t.day) as any) || 'Monday',
        periodId: Number(t.periodId ?? 0),
        subjectId: String(t.subjectId ?? ''),
        teacherId: String(t.teacherId ?? ''),
        curriculumType: (toEnumKey(t.curriculumType) as any) || 'Public',
      }))
    );

    if (examsAll.length) {
      await createManySafe(
        'exam',
        examsAll.map((e: any) => ({
          schoolId,
          id: String(e.id),
          name: String(e.name ?? ''),
          academicYear: String(e.academicYear ?? ''),
          term: String(e.term ?? ''),
          startDate: String(e.startDate ?? ''),
          endDate: String(e.endDate ?? ''),
          status: (toEnumKey(e.status) as any) || 'Upcoming',
        }))
      );
      const examClasses = examsAll.flatMap((e: any) =>
        Array.isArray(e.classes)
          ? e.classes.map((classId: any) => ({
              schoolId,
              examId: String(e.id),
              classId: String(classId),
            }))
          : []
      );
      await createManySafe('examClass', examClasses);
    }

    if (marks.length) {
      await createManySafe(
        'examResult',
        marks.map((m: any) => ({
          schoolId,
          id: String(m.id),
          examId: String(m.examId ?? ''),
          studentId: String(m.studentId ?? ''),
          subjectId: String(m.subjectId ?? ''),
          score: Number(m.score ?? 0),
          grade: String(m.grade ?? ''),
          remark: m.remark ? String(m.remark) : null,
        }))
      );
    }

    if (fees.length) {
      await createManySafe(
        'feeType',
        fees.map((f: any) => ({
          schoolId,
          id: String(f.id),
          nameEn: String(f.nameEn ?? ''),
          nameMm: String(f.nameMm ?? ''),
          amount: Number(f.amount ?? 0),
          frequency: (toEnumKey(f.frequency) as any) || 'Monthly',
          academicYear: String(f.academicYear ?? ''),
          applicableGrades: (f.applicableGrades ?? []) as Prisma.InputJsonValue,
          description: f.description ? String(f.description) : null,
          dueDate: f.dueDate ? String(f.dueDate) : null,
          isActive: Boolean(f.isActive),
        }))
      );
    }

    if (expenses.length) {
      await createManySafe(
        'expense',
        expenses.map((e: any) => {
          const { id, category, description, amount, date, paymentMethod, status, ...rest } = e || {};
          const meta = Object.keys(rest).length ? (rest as Prisma.InputJsonValue) : undefined;
          return {
            schoolId,
            id: String(id),
            category: (toEnumKey(category) as any) || 'Others',
            description: String(description ?? ''),
            amount: Number(amount ?? 0),
            date: String(date ?? ''),
            paymentMethod: String(paymentMethod ?? ''),
            status: (toEnumKey(status) as any) || 'Paid',
            meta,
          };
        })
      );
    }

    // Payments with multiple items
    if (payments.length) {
      await createManySafe(
        'payment',
        payments.map((p: any) => {
          const rawStudentId = p.studentId ? String(p.studentId) : null;
          const safeStudentId = rawStudentId && studentIds.has(rawStudentId) ? rawStudentId : null;
          return {
            schoolId,
            id: String(p.id),
            studentId: safeStudentId,
            payerName: p.payerName ? String(p.payerName) : null,
            paymentMethod: String(p.paymentMethod ?? p.method ?? 'Cash'),
            remark: p.remark ? String(p.remark) : null,
            discount: Number(p.discount ?? 0),
            totalAmount: Number(p.totalAmount ?? p.amount ?? 0),
            date: String(p.date ?? new Date().toISOString().slice(0, 10)),
            meta: p.meta ? (p.meta as Prisma.InputJsonValue) : undefined,
          };
        })
      );

      const allItems = payments.flatMap((p: any) => {
        const id = String(p.id);
        const items = Array.isArray(p.items) ? p.items : null;
        const feeIds = Array.isArray(p.feeIds) ? p.feeIds : null;

        if (items) {
          return items.map((it: any, idx: number) => ({
            schoolId,
            paymentId: id,
            lineNo: Number(it.lineNo ?? idx + 1),
            feeTypeId: (() => {
              const raw = it.feeTypeId ? String(it.feeTypeId) : it.feeId ? String(it.feeId) : null;
              return raw && feeTypeIds.has(raw) ? raw : null;
            })(),
            description: it.description ? String(it.description) : null,
            amount: Number(it.amount ?? 0),
          }));
        }

        if (feeIds) {
          return feeIds.map((feeId: any, idx: number) => ({
            schoolId,
            paymentId: id,
            lineNo: idx + 1,
            feeTypeId: feeTypeIds.has(String(feeId)) ? String(feeId) : null,
            description: null,
            amount: 0,
          }));
        }

        // Unknown structure: store as a single line item with total amount
        return [
          {
            schoolId,
            paymentId: id,
            lineNo: 1,
            feeTypeId: null,
            description: 'Payment',
            amount: Number(p.totalAmount ?? p.amount ?? 0),
          },
        ];
      });

      await createManySafe('paymentItem', allItems);
    }

    // Attendance import (optional: if structure matches)
    const attendance = data.attendance && typeof data.attendance === 'object' ? data.attendance : {};
    for (const [date, byClass] of Object.entries(attendance)) {
      if (!byClass || typeof byClass !== 'object') continue;
      for (const [classId, byStudent] of Object.entries(byClass as AnyObj)) {
        if (!byStudent || typeof byStudent !== 'object') continue;
        const session = await tx.studentAttendanceSession.create({
          data: { schoolId, date, classId },
        });
        const records = Object.entries(byStudent as AnyObj).map(([studentId, rec]: [string, any]) => ({
          schoolId,
          sessionId: session.id,
          studentId,
          status: (toEnumKey(rec?.status) as any) || 'PRESENT',
          remark: rec?.remark ? String(rec.remark) : null,
        }));
        await createManySafe('studentAttendanceRecord', records);
      }
    }

    const staffAttendance = data.staffAttendance && typeof data.staffAttendance === 'object' ? data.staffAttendance : {};
    for (const [date, byStaff] of Object.entries(staffAttendance)) {
      if (!byStaff || typeof byStaff !== 'object') continue;
      const session = await tx.staffAttendanceSession.create({ data: { schoolId, date } });
      const records = Object.entries(byStaff as AnyObj).map(([staffId, rec]: [string, any]) => ({
        schoolId,
        sessionId: session.id,
        staffId,
        status: (toEnumKey(rec?.status) as any) || 'PRESENT',
        checkIn: rec?.checkIn ? String(rec.checkIn) : null,
        checkOut: rec?.checkOut ? String(rec.checkOut) : null,
        remark: rec?.remark ? String(rec.remark) : null,
      }));
      await createManySafe('staffAttendanceRecord', records);
    }
  });
}


