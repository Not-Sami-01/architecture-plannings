"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { ROUTES } from "@/config/constants";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrdersFiltersProps = {
  disabled?: boolean;
};

export function OrdersFilters({ disabled }: OrdersFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page"); // any filter change resets paging
    startTransition(() => {
      routerPush(next);
    });
  };

  const routerPush = (next: URLSearchParams) => {
    const qs = next.toString();
    router.push(qs ? `${ROUTES.admin.orders}?${qs}` : ROUTES.admin.orders, { scroll: false });
  };

  const hasFilters = Boolean(
    params.get("q") || params.get("status") || (params.get("sort") && params.get("sort") !== "newest"),
  );

  return (
    <div className={`flex flex-wrap items-center gap-3 ${isPending ? "opacity-60" : ""}`} aria-busy={isPending}>
      <Input
        type="search"
        placeholder="Search number, name, email…"
        defaultValue={params.get("q") ?? ""}
        className="w-64"
        disabled={disabled}
        onChange={(event) => {
          // Debounced free-text search.
          window.clearTimeout(searchTimer);
          const value = event.target.value;
          searchTimer = window.setTimeout(() => update("q", value), 400);
        }}
      />
      <Select
        value={params.get("status") ?? "all"}
        onValueChange={(v) => update("status", v === "all" ? "" : String(v))}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All statuses" aria-label="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.values(ORDER_STATUSES).map((status) => (
            <SelectItem key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("sort") ?? "newest"}
        onValueChange={(v) => update("sort", String(v))}
      >
        <SelectTrigger className="w-40" aria-label="Sort order">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => startTransition(() => routerPush(new URLSearchParams()))}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

let searchTimer = 0;
