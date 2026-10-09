import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: {
    create: () => ({ request: requestMock }),
    isAxiosError: (error: unknown) =>
      typeof error === "object" && error !== null && "isAxiosError" in error,
  },
}));

import { ApiClientError, api } from "./api";

const okResponse = (body: unknown) => ({ data: body });

describe("api", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unwraps the { data } envelope", async () => {
    requestMock.mockResolvedValue(okResponse({ data: { id: "ord_1" } }));

    const result = await api<{ id: string }>("get", { url: "/api/orders" });

    expect(result.data).toEqual({ id: "ord_1" });
    expect(result.meta).toBeUndefined();
  });

  it("passes meta through for paginated responses", async () => {
    requestMock.mockResolvedValue(
      okResponse({ data: [], meta: { page: 2, pageSize: 20, total: 41 } })
    );

    const result = await api<unknown[]>("get", { url: "/api/orders", params: { page: 2 } });

    expect(result.meta).toEqual({ page: 2, pageSize: 20, total: 41 });
  });

  it("sends method, url, body, params, and signal", async () => {
    requestMock.mockResolvedValue(okResponse({ data: {} }));
    const controller = new AbortController();

    await api("post", { url: "/api/orders", body: { a: 1 }, params: { b: 2 }, signal: controller.signal });

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "post",
        url: "/api/orders",
        data: { a: 1 },
        params: { b: 2 },
        signal: controller.signal,
      })
    );
  });

  it("converts axios errors into a typed ApiClientError", async () => {
    requestMock.mockRejectedValue({
      isAxiosError: true,
      message: "Request failed",
      response: {
        status: 400,
        data: { error: { code: "VALIDATION_ERROR", message: "Bad input", details: [{ path: ["email"], message: "Required" }] } },
      },
    });

    await expect(api("post", { url: "/api/auth/register" })).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Bad input",
      details: [{ path: ["email"], message: "Required" }],
    });
  });

  it("redirects to login on 401 from non-auth endpoints", async () => {
    const location = { pathname: "/dashboard", search: "", href: "" };
    vi.stubGlobal("window", { location });

    requestMock.mockRejectedValue({
      isAxiosError: true,
      message: "Unauthorized",
      response: { status: 401, data: { error: { code: "UNAUTHENTICATED", message: "Login required" } } },
    });

    await expect(api("get", { url: "/api/orders" })).rejects.toBeInstanceOf(ApiClientError);
    expect(location.href).toBe("/sign-in?next=%2Fdashboard");
  });

  it("redirects to sign-in on 401 from any endpoint (no exceptions)", async () => {
    const location = { pathname: "/dashboard", search: "?tab=1", href: "" };
    vi.stubGlobal("window", { location });

    requestMock.mockRejectedValue({
      isAxiosError: true,
      message: "Unauthorized",
      response: { status: 401, data: { error: { code: "UNAUTHENTICATED", message: "Wrong credentials" } } },
    });

    await expect(
      api("post", { url: "/api/orders/ord_1/messages", body: {} })
    ).rejects.toBeInstanceOf(ApiClientError);
    expect(location.href).toBe("/sign-in?next=%2Fdashboard%3Ftab%3D1");
  });
});
