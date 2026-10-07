import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "@/config/constants";

import { ApiError, created, fail, noContent, ok, paginated } from "./response";

const getJson = async (response: Response) => response.json();

describe("response helpers", () => {
  it("ok returns a { data } envelope with status 200", async () => {
    const res = ok({ id: "ord_1" });
    expect(res.status).toBe(200);
    expect(await getJson(res)).toEqual({ data: { id: "ord_1" } });
  });

  it("created returns status 201", () => {
    expect(created({}).status).toBe(201);
  });

  it("paginated returns items with meta", async () => {
    const res = paginated(["a", "b"], { page: 1, pageSize: 20, total: 42 });
    expect(res.status).toBe(200);
    expect(await getJson(res)).toEqual({
      data: ["a", "b"],
      meta: { page: 1, pageSize: 20, total: 42 },
    });
  });

  it("noContent returns an empty 204", async () => {
    const res = noContent();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("fail maps status to the default error code", async () => {
    const res = fail(404, "Not here");
    expect(res.status).toBe(404);
    expect(await getJson(res)).toEqual({
      error: { code: ERROR_CODES.NOT_FOUND, message: "Not here", details: undefined },
    });
  });

  it("fail uses an explicit code and details when given", async () => {
    const details = [{ path: ["plot"], message: "Required" }];
    const res = fail(400, "Bad", ERROR_CODES.VALIDATION_ERROR, details);
    expect(await getJson(res)).toEqual({
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: "Bad", details },
    });
  });
});

describe("ApiError", () => {
  it("carries status, message, and a default code", () => {
    const error = ApiError.notFound();
    expect(error.status).toBe(404);
    expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(error.message).toBe("Resource not found.");
  });

  it("supports details and custom messages", () => {
    const error = ApiError.revisionLimitReached("Limit hit", { extraFee: 5000 });
    expect(error.code).toBe(ERROR_CODES.REVISION_LIMIT_REACHED);
    expect(error.details).toEqual({ extraFee: 5000 });
  });

  it("is an Error subclass", () => {
    expect(ApiError.forbidden()).toBeInstanceOf(Error);
  });
});
