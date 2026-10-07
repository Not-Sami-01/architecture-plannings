import bcrypt from "bcryptjs";

import { config } from "../src/config/config";
import { prisma } from "../src/lib/db";
import { APP, ROLES } from "../src/config/constants";

/**
 * Seeds the admin account and the three launch packages (PRD §6, FR-2).
 * Admin accounts are created via seed only.
 */
async function main() {
  const passwordHash = await bcrypt.hash(config.seed.adminPassword, 12);

  await prisma.user.upsert({
    where: { email: config.seed.adminEmail },
    update: { role: ROLES.ADMIN },
    create: {
      email: config.seed.adminEmail,
      name: "Studio Admin",
      passwordHash,
      role: ROLES.ADMIN,
      emailVerified: new Date(),
    },
  });

  const packages = [
    {
      name: "Floor Plan",
      slug: "floor-plan",
      description: "2D floor plan(s) for your plot, ready for construction discussion.",
      price: 15000,
      revisionLimit: 2,
      deliverables: ["2D floor plan(s)"],
      sortOrder: 1,
    },
    {
      name: "Plan + Elevation",
      slug: "plan-elevation",
      description: "Floor plan plus a front elevation of your house.",
      price: 25000,
      revisionLimit: 2,
      deliverables: ["Floor plan", "Front elevation"],
      sortOrder: 2,
    },
    {
      name: "Full Package",
      slug: "full-package",
      description: "Plans, elevations, sections, and door/window schedule.",
      price: 40000,
      revisionLimit: 3,
      deliverables: ["Floor plans", "Elevations", "Sections", "Door/window schedule"],
      sortOrder: 3,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: {},
      create: pkg,
    });
  }

  console.log(`Seeded admin (${config.seed.adminEmail}) and ${packages.length} ${APP.currency} packages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
