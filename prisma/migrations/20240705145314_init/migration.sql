-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserOrganisations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_UserOrganisations_AB_unique" ON "_UserOrganisations"("A", "B");

-- CreateIndex
CREATE INDEX "_UserOrganisations_B_index" ON "_UserOrganisations"("B");

-- AddForeignKey
ALTER TABLE "_UserOrganisations" ADD CONSTRAINT "_UserOrganisations_A_fkey" FOREIGN KEY ("A") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserOrganisations" ADD CONSTRAINT "_UserOrganisations_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
