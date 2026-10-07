import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ERROR_CODES } from "@/config/constants";

import { validateBody, validateQuery } from "./validate";
import { makeApiRequest, makeApiResponse } from "../test-helpers";

describe("validateBody", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("passes and replaces ctx.body with the parsed value", async () => {
    const req = makeApiRequest({ method: "POST", body: { name: "Ali" } });
    const result = await validateBody(schema)(req, makeApiResponse());

    expect(result.success).toBe(true);
    expect(req.ctx.body).toEqual({ name: "Ali" });
  });

  it("coerces and transforms values through the schema", async () => {
    const coercing = z.object({ page: z.coerce.number() });
    const req = makeApiRequest({ method: "POST", body: { page: "2" } });
    await validateBody(coercing)(req, makeApiResponse());

    expect(req.ctx.body).toEqual({ page: 2 });
  });

  it("rejects with 400 VALIDATION_ERROR and issue details", async () => {
    const req = makeApiRequest({ method: "POST", body: { name: "" } });
    const result = await validateBody(schema)(req, makeApiResponse());

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(Array.isArray(result.details)).toBe(true);
  });

  it("rejects when the body is missing entirely", async () => {
    const req = makeApiRequest({ method: "POST" });
    const result = await validateBody(schema)(req, makeApiResponse());

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });
});

describe("validateQuery", () => {
  const schema = z.object({ page: z.coerce.number().int().min(1) });

  it("parses query strings into typed values", async () => {
    const req = makeApiRequest({ url: "http://localhost:3000/api/things?page=3" });
    const result = await validateQuery(schema)(req, makeApiResponse());

    expect(result.success).toBe(true);
    expect(req.ctx.query).toEqual({ page: 3 });
  });

  it("rejects invalid query values", async () => {
    const req = makeApiRequest({ url: "http://localhost:3000/api/things?page=0" });
    const result = await validateQuery(schema)(req, makeApiResponse());

    expect(result.success).toBe(false);
    expect(result.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });
});
