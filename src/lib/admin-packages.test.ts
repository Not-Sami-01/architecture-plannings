import { describe, expect, it, vi } from "vitest";

// packages.ts reaches the Prisma client, which is server-only; these tests
// only exercise the pure helpers and schemas.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { slugifyPackage } from "./packages";
import {
  createPackageSchema,
  packageFormSchema,
  splitDeliverables,
  updatePackageSchema,
} from "./validators/admin-packages";

const validInput = {
  name: "Plan + Elevation",
  description: "Floor plan with front elevation.",
  price: 25000,
  revisionLimit: 2,
  deliverables: ["Floor plan", "Front elevation"],
};

describe("slugifyPackage", () => {
  it("kebab-cases a package name", () => {
    expect(slugifyPackage("Plan + Elevation")).toBe("plan-elevation");
    expect(slugifyPackage("  Full House!! ")).toBe("full-house");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugifyPackage("--2D Drawings--")).toBe("2d-drawings");
  });
});

describe("createPackageSchema", () => {
  it("accepts a valid package", () => {
    expect(createPackageSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects fractional and non-positive prices", () => {
    expect(createPackageSchema.safeParse({ ...validInput, price: 25000.5 }).success).toBe(false);
    expect(createPackageSchema.safeParse({ ...validInput, price: 0 }).success).toBe(false);
  });

  it("rejects an empty deliverables list", () => {
    expect(createPackageSchema.safeParse({ ...validInput, deliverables: [] }).success).toBe(false);
  });

  it("rejects a malformed slug", () => {
    expect(createPackageSchema.safeParse({ ...validInput, slug: "Bad Slug!" }).success).toBe(false);
    expect(createPackageSchema.safeParse({ ...validInput, slug: "plan-elevation" }).success).toBe(
      true
    );
  });
});

describe("updatePackageSchema", () => {
  it("requires at least one field", () => {
    expect(updatePackageSchema.safeParse({}).success).toBe(false);
  });

  it("accepts partial updates, including the active flag", () => {
    expect(updatePackageSchema.safeParse({ price: 30000 }).success).toBe(true);
    expect(updatePackageSchema.safeParse({ active: false }).success).toBe(true);
  });
});

describe("packageFormSchema", () => {
  it("accepts deliverables as newline-separated text", () => {
    const result = packageFormSchema.safeParse({
      ...validInput,
      deliverables: "Floor plan\nFront elevation",
      active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects deliverables text with no lines", () => {
    const result = packageFormSchema.safeParse({
      ...validInput,
      deliverables: "\n  \n",
    });
    expect(result.success).toBe(false);
  });
});

describe("splitDeliverables", () => {
  it("trims lines and drops blanks", () => {
    expect(splitDeliverables(" Floor plan \n\n Sections ")).toEqual(["Floor plan", "Sections"]);
  });
});
