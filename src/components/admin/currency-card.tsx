"use client";

import { useState } from "react";

import { SUPPORTED_CURRENCIES } from "@/config/constants";
import { useSettings } from "@/hooks/settings/use-settings";
import { useUpdateSettings } from "@/hooks/settings/use-update-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Site currency setting (plan 3 P8). Relabel-only: stored amounts are never
 * converted, and in-flight orders keep their creation-time snapshot.
 */
export function CurrencyCard() {
  const settings = useSettings();
  const update = useUpdateSettings();
  // Derived-value reset in render (react-hooks/set-state-in-effect-safe:
  // exactly the documented "adjust state when props change" pattern).
  const [selected, setSelected] = useState<string | null>(null);
  const current = settings.data?.currency ?? null;
  const effectiveSelected = selected ?? current ?? "";

  if (settings.loadings.loading) {
    return (
      <Card aria-busy>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!settings.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Settings couldn&apos;t load.</span>
          <Button variant="outline" size="sm" onClick={() => settings.query.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dirty = selected !== null && selected !== current;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Currency</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Select
          value={effectiveSelected}
          onValueChange={(value) => {
            if (value) setSelected(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-80" aria-label="Site currency">
            <SelectValue placeholder="Pick a currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Switching currency changes the label only — amounts are never converted. In-flight
          orders keep the currency they were created with. Package prices are not converted
          either: re-price them manually in Pricing if needed.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          disabled={!dirty || update.loadings.saving}
          onClick={() => {
            if (!selected) return;
            void update.actions.save({ currency: selected }).catch(() => undefined);
          }}
        >
          {update.loadings.saving ? "Saving…" : "Save currency"}
        </Button>
      </CardFooter>
    </Card>
  );
}
