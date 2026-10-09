import { prisma } from "../src/lib/db";
import { APP } from "../src/config/constants";

/**
 * Seeds the three launch packages (PRD §6, FR-2).
 * Admin accounts are no longer seeded: the first Clerk sign-in with an email
 * listed in ADMIN_EMAILS is promoted to ADMIN by `resolveApiUser`.
 */
async function main() {
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

  console.log(`Seeded ${packages.length} ${APP.currency} packages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
