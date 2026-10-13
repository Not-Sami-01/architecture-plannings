import { beforeEach, describe, expect, it, vi } from "vitest";

const createdAt = new Date("2026-01-10T00:00:00.000Z");
const updatedAt = new Date("2026-01-16T12:00:00.000Z");

const projectRow = {
  id: "p1",
  slug: "modern-5-marla",
  title: "Modern 5 Marla Home",
  category: "Full house",
  plotSize: "5 marla",
  style: "MODERN",
  description: "A compact modern home.",
  images: ["img1"],
  featured: true,
  visible: true,
  sortOrder: 1,
  createdAt,
  updatedAt,
};

const findMany = vi.fn().mockResolvedValue([projectRow]);
const findFirst = vi.fn().mockResolvedValue(projectRow);
const findUnique = vi.fn().mockResolvedValue(projectRow);
const aggregate = vi.fn().mockResolvedValue({ _max: { sortOrder: 3 } });
const create = vi.fn().mockResolvedValue(projectRow);
const update = vi.fn().mockResolvedValue(projectRow);
const orderFileFindMany = vi.fn().mockResolvedValue([{ id: "img1", key: "k" }]);
const orderFileFindUnique = vi.fn().mockResolvedValue({
  id: "img1",
  key: "portfolio/images/x.jpg",
  mime: "image/jpeg",
  kind: "PORTFOLIO_IMAGE",
});
const transaction = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/db", () => ({
  prisma: {
    portfolioProject: {
      findMany: (...args: unknown[]) => findMany(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
      aggregate: (...args: unknown[]) => aggregate(...args),
      create: (...args: unknown[]) => create(...args),
      update: (...args: unknown[]) => update(...args),
    },
    orderFile: {
      findMany: (...args: unknown[]) => orderFileFindMany(...args),
      findUnique: (...args: unknown[]) => orderFileFindUnique(...args),
      create: vi.fn(),
      delete: vi.fn().mockResolvedValue({}),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

// Simulate the real unstable_cache: cached reads round-trip through JSON.
vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: never[]) => unknown>(fn: T) =>
    ((...args: Parameters<T>) =>
      Promise.resolve(fn(...args)).then((result) => JSON.parse(JSON.stringify(result)))) as T,
  revalidateTag: vi.fn(),
}));

import {
  getVisibleProjectBySlug,
  listVisibleProjects,
  reorderPortfolioProjects,
  slugifyPortfolio,
  updatePortfolioProject,
} from "./portfolio";

beforeEach(() => {
  findMany.mockClear().mockResolvedValue([projectRow]);
  findFirst.mockClear().mockResolvedValue(projectRow);
  findUnique.mockClear().mockResolvedValue(projectRow);
  update.mockClear().mockResolvedValue(projectRow);
  transaction.mockClear().mockResolvedValue([]);
});

describe("slugifyPortfolio", () => {
  it("kebab-cases a title like slugifyPost", () => {
    expect(slugifyPortfolio("Modern 5 Marla Home")).toBe("modern-5-marla-home");
    expect(slugifyPortfolio("  Spanish!! Villa ")).toBe("spanish-villa");
  });
});

describe("listVisibleProjects", () => {
  it("maps plot and style tokens onto the schema", async () => {
    await listVisibleProjects({ plot: "5-marla", style: "modern" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          visible: true,
          plotSize: { equals: "5 marla", mode: "insensitive" },
          style: "MODERN",
        }),
      }),
    );
  });

  it("rehydrates Dates after the cache JSON round-trip", async () => {
    const rows = await listVisibleProjects({});
    expect(rows[0].updatedAt).toBeInstanceOf(Date);
    expect(rows[0].updatedAt.toISOString()).toBe(updatedAt.toISOString());
  });
});

describe("getVisibleProjectBySlug", () => {
  it("rehydrates Dates on a cache hit", async () => {
    const project = await getVisibleProjectBySlug("modern-5-marla");
    expect(project?.updatedAt).toBeInstanceOf(Date);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "modern-5-marla", visible: true } }),
    );
  });
});

describe("updatePortfolioProject", () => {
  it("never writes the slug (immutable after create)", async () => {
    await updatePortfolioProject("p1", { title: "Renamed", slug: "new-slug" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ slug: "new-slug" }),
      }),
    );
  });
});

describe("reorderPortfolioProjects", () => {
  it("rejects a partial id set", async () => {
    findMany.mockResolvedValueOnce([{ id: "p1" }, { id: "p2" }]);
    await expect(reorderPortfolioProjects(["p1"])).rejects.toThrow(/every project/i);
    expect(transaction).not.toHaveBeenCalled();
  });
});
