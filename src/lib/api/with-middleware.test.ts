import { beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

// The default middleware chain includes `authenticate`, which imports the real
// Auth.js module; keep it out of the unit test runtime.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const marks = vi.hoisted(() => ({ order: [] as string[] }));

// Replace the real default middlewares with an observable spy so tests can
// assert the "defaults first" ordering contract.
vi.mock("./middlewares", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./middlewares")>();
  return {
    ...mod,
    defaultMiddlewares: [
      async (req: Parameters<typeof mod.pass>[0], res: Parameters<typeof mod.pass>[1]) => {
        marks.order.push("default");
        return mod.pass(req, res);
      },
    ],
  };
});

import { ERROR_CODES } from "@/config/constants";

import { ApiError } from "./response";
import { pass, reject } from "./middlewares";
import { withMiddleware } from "./with-middleware";
import { makeApiRequest } from "./test-helpers";
import type { ApiRequest, Handler, Middleware } from "./types";

describe("withMiddleware", () => {
  let logSpy: MockInstance;
  let errorSpy: MockInstance;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    marks.order.length = 0;
    return () => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    };
  });

  const run = async (
    handler: Handler,
    middlewares: Middleware[] = [],
    options?: {
      skipDefaults?: boolean;
      url?: string;
      method?: string;
      body?: unknown;
      params?: Record<string, string>;
    }
  ) => {
    const wrapped = withMiddleware(handler, middlewares, options);
    // A Request cast exercises the same runtime paths as a real NextRequest.
    const req = makeApiRequest({
      url: options?.url,
      method: options?.method,
      body: options?.body,
      params: options?.params,
    });
    return wrapped(req as never, { params: Promise.resolve(options?.params ?? {}) });
  };

  it("runs default middlewares before route middlewares, then the handler", async () => {
    await run(() => {
      marks.order.push("handler");
      return Response.json({});
    }, [
      async (req, res) => {
        marks.order.push("route");
        return pass(req, res);
      },
    ]);

    expect(marks.order).toEqual(["default", "route", "handler"]);
  });

  it("skips default middlewares when skipDefaults is set", async () => {
    await run(
      () => {
        marks.order.push("handler");
        return Response.json({});
      },
      [],
      { skipDefaults: true }
    );

    expect(marks.order).toEqual(["handler"]);
  });

  it("stops the chain on a failed middleware and returns the standard error", async () => {
    const handler = vi.fn(() => ok());
    const res = await run(handler, [
      (req, res) => reject(req, res, 403, "Not allowed", { code: ERROR_CODES.FORBIDDEN }),
    ]);

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({
      error: { code: ERROR_CODES.FORBIDDEN, message: "Not allowed", details: undefined },
    });
  });

  it("converts a thrown ApiError from the handler", async () => {
    const res = await run(() => {
      throw ApiError.notFound("No such order");
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: { code: ERROR_CODES.NOT_FOUND, message: "No such order" },
    });
  });

  it("returns a generic 500 for unknown errors without leaking details", async () => {
    const res = await run(() => {
      throw new Error("secret internals");
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(JSON.stringify(body)).not.toContain("secret internals");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("merges middleware headers and adds X-Request-Id", async () => {
    const res = await run(() => ok({}), [
      async (req, res) => {
        res.headers.set("Retry-After", "30");
        return pass(req, res);
      },
    ]);

    expect(res.headers.get("Retry-After")).toBe("30");
    // withMiddleware generates its own request id at runtime.
    expect(res.headers.get("X-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("parses JSON bodies and route params and query strings", async () => {
    let seenBody: unknown;
    let seenParams: Record<string, string> | undefined;
    let seenQuery: Record<string, unknown> | undefined;

    await run(
      (req: ApiRequest) => {
        seenBody = req.ctx.body;
        seenParams = req.ctx.params;
        seenQuery = req.ctx.query;
        return ok({});
      },
      [],
      {
        method: "POST",
        url: "http://localhost:3000/api/things?page=2",
        body: { hello: "world" },
        params: { id: "t_1" },
      }
    );

    expect(seenBody).toEqual({ hello: "world" });
    expect(seenParams).toEqual({ id: "t_1" });
    expect(seenQuery).toEqual({ page: "2" });
  });

  it("does not parse a body for GET requests", async () => {
    let seenBody: unknown;
    await run(
      (req: ApiRequest) => {
        seenBody = req.ctx.body;
        return ok({});
      },
      [],
      { method: "GET", url: "http://localhost:3000/api/things" }
    );
    expect(seenBody).toBeUndefined();
  });

  const ok = (data: unknown = {}) => Response.json({ data });
});
