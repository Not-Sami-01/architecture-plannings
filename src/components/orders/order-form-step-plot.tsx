"use client";



import { DIRECTIONS, PLOT_UNITS, ROAD_SIDES } from "@/config/constants";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { OrderFormInstance } from "@/components/orders/order-form";

type OrderFormStepPlotProps = {
  form: OrderFormInstance;
};

const UNIT_LABELS: Record<(typeof PLOT_UNITS)[number], string> = {
  FT: "Feet",
  M: "Meters",
  MARLA: "Marla",
  KANAL: "Kanal",
};

const DIRECTION_LABELS: Record<(typeof DIRECTIONS)[number], string> = {
  NORTH: "North",
  SOUTH: "South",
  EAST: "East",
  WEST: "West",
  CORNER: "Corner plot",
};

const ROAD_LABELS: Record<(typeof ROAD_SIDES)[number], string> = {
  FRONT: "Front",
  BACK: "Back",
  LEFT: "Left",
  RIGHT: "Right",
};

export function OrderFormStepPlot({ form }: OrderFormStepPlotProps) {
  const register = form.register;
  const errors = form.formState.errors;
  const watch = form.watch;
  const setValue = form.setValue;
  const plotErrors = errors.plot ?? {};

  return (
    <FieldGroup className="gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={plotErrors.width ? true : undefined}>
          <FieldLabel htmlFor="plot-width">Width</FieldLabel>
          <Input id="plot-width" type="number" min={0} step="any" {...register("plot.width")} />
          <FieldError>{plotErrors.width?.message}</FieldError>
        </Field>

        <Field data-invalid={plotErrors.length ? true : undefined}>
          <FieldLabel htmlFor="plot-length">Length</FieldLabel>
          <Input id="plot-length" type="number" min={0} step="any" {...register("plot.length")} />
          <FieldError>{plotErrors.length?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Unit</FieldLabel>
          <Select
            value={watch("plot.unit")}
            onValueChange={(value) =>
              setValue("plot.unit", value as (typeof PLOT_UNITS)[number], { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLOT_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {UNIT_LABELS[unit]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field data-invalid={plotErrors.facing ? true : undefined}>
        <FieldLabel>Facing direction</FieldLabel>
        <Select
          value={watch("plot.facing")}
          onValueChange={(value) =>
            setValue("plot.facing", value as (typeof DIRECTIONS)[number], { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIRECTIONS.map((direction) => (
              <SelectItem key={direction} value={direction}>
                {DIRECTION_LABELS[direction]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{plotErrors.facing?.message}</FieldError>
      </Field>

      <Field data-invalid={plotErrors.roadSides ? true : undefined}>
        <FieldLabel>Road sides</FieldLabel>
        <div className="flex flex-wrap gap-4">
          {ROAD_SIDES.map((side) => {
            const current = watch("plot.roadSides") ?? [];
            const checked = current.includes(side);
            return (
              <label key={side} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...current, side]
                      : current.filter((s) => s !== side);
                    setValue("plot.roadSides", next, { shouldValidate: true });
                  }}
                />
                {ROAD_LABELS[side]}
              </label>
            );
          })}
        </div>
        <FieldError>{plotErrors.roadSides?.message}</FieldError>
      </Field>

      <Field data-invalid={plotErrors.city ? true : undefined}>
        <FieldLabel htmlFor="plot-city">City</FieldLabel>
        <Input id="plot-city" placeholder="Lahore" {...register("plot.city")} />
        <FieldError>{plotErrors.city?.message}</FieldError>
      </Field>
    </FieldGroup>
  );
}
