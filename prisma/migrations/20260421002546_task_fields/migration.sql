-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignee" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium';
