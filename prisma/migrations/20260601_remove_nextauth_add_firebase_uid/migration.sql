-- Remove tabelas do NextAuth (não mais necessárias com Firebase Auth)
DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "Account";

-- Remove colunas do User que eram do NextAuth
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";

-- Adiciona firebaseUid ao User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firebaseUid" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_firebaseUid_key" ON "User"("firebaseUid");
