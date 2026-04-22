-- CreateEnum
CREATE TYPE "SignupPortal" AS ENUM ('ADMIN_PORTAL', 'EMPLOYEE_PORTAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "signupPortal" "SignupPortal" NOT NULL DEFAULT 'EMPLOYEE_PORTAL';

-- Existing non-employee roles: treat as admin-portal accounts (login only via admin portal)
UPDATE "users" SET "signupPortal" = 'ADMIN_PORTAL' WHERE "systemRole" IN ('COMPANY_ADMIN', 'HR_MANAGER', 'TEAM_LEAD');
