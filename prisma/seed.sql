-- Prisma SQLite seed SQL for PNHS ACCESS
-- Run: sqlite3 <path-to-db> < prisma/seed.sql

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Announcements
INSERT INTO Announcement (id, title, message, date, author, type, createdAt) VALUES
('1','Midterm Examinations','Midterm exams will be conducted from February 15-20, 2026. Please review your schedules and prepare accordingly.','2026-02-11T00:00:00.000Z','Admin','info','2026-02-11T00:00:00.000Z'),
('2','School Foundation Day','Join us in celebrating PNHS Foundation Day on February 25, 2026. Various activities and programs are planned!','2026-02-08T00:00:00.000Z','Admin','success','2026-02-08T00:00:00.000Z'),
('3','Library Hours Extended','Library will be open until 8 PM during exam week to accommodate students. Make use of this opportunity!','2026-02-06T00:00:00.000Z','Admin','info','2026-02-06T00:00:00.000Z');

-- Students
INSERT INTO Student (id, name, email, gradeLevel, username, password, section, strand, gpa, status, studentId) VALUES
('1','Juan Dela Cruz','juan@pnhs.edu.ph','Grade 10','student1',NULL,'A','','92.5','active','STU-2024-001'),
('2','Maria Santos','maria@pnhs.edu.ph','Grade 11','student2',NULL,'A','ABM','88.3','active','STU-2024-002'),
('3','Pedro Reyes','pedro@pnhs.edu.ph','Grade 9','student3',NULL,'C','','90.1','active','STU-2024-003'),
('4','Ana Garcia','ana@pnhs.edu.ph','Grade 12','student4',NULL,'A','STEM','94.7','active','STU-2024-004'),
('5','Jose Torres','jose@pnhs.edu.ph','Grade 10','student5',NULL,'B','','86.2','active','STU-2024-005');

-- Teachers (subjects stored as JSON string for now)
INSERT INTO Teacher (id, name, email, department, subjects, students, status, username, password) VALUES
('1','Ms. Santos','santos@pnhs.edu.ph','Mathematics','["Algebra","Geometry"]',120,'active',NULL,NULL),
('2','Mr. Cruz','cruz@pnhs.edu.ph','Science','["Biology","Chemistry"]',95,'active',NULL,NULL),
('3','Ms. Garcia','garcia@pnhs.edu.ph','English','["Literature","Grammar"]',110,'active',NULL,NULL),
('4','Mr. Reyes','reyes@pnhs.edu.ph','Filipino','["Filipino","Literature"]',105,'active',NULL,NULL);

-- Classes
INSERT INTO Class (id, name, subject, teacher, teacherId, students, schedule, time, room, gradeLevel, section) VALUES
('1','Math 101','Mathematics','Ms. Santos','1',42,'MWF 8:00-9:00 AM','8:00 AM - 9:00 AM','Room 101','Grade 10','A'),
('2','Science 201','Science','Mr. Cruz','2',38,'TTH 9:00-10:30 AM','9:00 AM - 10:30 AM','Room 205','Grade 11','B'),
('3','English 301','English','Ms. Garcia','3',35,'MWF 10:00-11:00 AM','10:00 AM - 11:00 AM','Room 103','Grade 12','A'),
('4','Filipino 101','Filipino','Mr. Reyes','4',40,'TTH 1:00-2:30 PM','1:00 PM - 2:30 PM','Room 104','Grade 10','B');

COMMIT;
PRAGMA foreign_keys=ON;
