"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";

import { KITCHEN_TYPES, PLOT_UNITS, STYLES } from "@/config/constants";
import type { PlotUnit, Style, KitchenType } from "@/config/constants";
import type { AdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { useUpdateAdminOrder } from "@/hooks/orders/use-update-admin-order";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type OrderEditDialogProps = {
  order: AdminOrderDetail;
};

/** Field editor (plan Phase D2): city, plot, requirements, style, budget, notes. */
export function OrderEditDialog({ order }: OrderEditDialogProps) {
  const update = useUpdateAdminOrder();
  const [open, setOpen] = useState(false);

  const [city, setCity] = useState(order.city);
  const [width, setWidth] = useState(String(order.plotWidth));
  const [length, setLength] = useState(String(order.plotLength));
  const [unit, setUnit] = useState<PlotUnit>(order.plotUnit as PlotUnit);
  const [floors, setFloors] = useState(String(order.floors));
  const [bedrooms, setBedrooms] = useState(String(order.bedrooms));
  const [bathrooms, setBathrooms] = useState(String(order.bathrooms));
  const [kitchenType, setKitchenType] = useState<KitchenType>(order.kitchenType as KitchenType);
  const [garage, setGarage] = useState(order.garage);
  const [lounge, setLounge] = useState(order.lounge);
  const [extras, setExtras] = useState(order.extras ?? "");
  const [style, setStyle] = useState<Style>(order.style as Style);
  const [budget, setBudget] = useState(order.budget != null ? String(order.budget) : "");
  const [notes, setNotes] = useState(order.notes ?? "");

  const save = async () => {
    try {
      await update.actions.update({
        id: order.id,
        input: {
          city,
          plot: {
            width: Number(width),
            length: Number(length),
            unit,
          },
          requirements: {
            floors: Number(floors),
            bedrooms: Number(bedrooms),
            bathrooms: Number(bathrooms),
            kitchenType,
            garage,
            lounge,
            extras: extras || "",
          },
          style,
          budget: budget === "" ? null : Number(budget),
          notes: notes || null,
        },
      });
      setOpen(false);
    } catch {
      // Toast shown by the hook.
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PencilIcon className="size-4" aria-hidden />
        Edit details
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit order {order.number}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-city">City</Label>
                <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-style">Style</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
                  <SelectTrigger id="edit-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-width">Plot width</Label>
                <Input
                  id="edit-width"
                  type="number"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-length">Plot length</Label>
                <Input
                  id="edit-length"
                  type="number"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-unit">Unit</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as PlotUnit)}>
                  <SelectTrigger id="edit-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLOT_UNITS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-floors">Floors</Label>
                <Input
                  id="edit-floors"
                  type="number"
                  min="1"
                  max="4"
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                <Input
                  id="edit-bedrooms"
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                <Input
                  id="edit-bathrooms"
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-kitchen">Kitchen</Label>
                <Select
                  value={kitchenType}
                  onValueChange={(v) => setKitchenType(v as KitchenType)}
                >
                  <SelectTrigger id="edit-kitchen">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KITCHEN_TYPES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-budget">Budget (optional)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={garage}
                  onChange={(e) => setGarage(e.target.checked)}
                />
                Garage
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lounge}
                  onChange={(e) => setLounge(e.target.checked)}
                />
                Lounge
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-extras">Extras</Label>
              <Textarea
                id="edit-extras"
                value={extras}
                onChange={(e) => setExtras(e.target.value)}
                maxLength={2000}
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                rows={3}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Status is managed by the status machine and price by the quote flow — they are not
              editable here.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={update.loadings.updating} onClick={() => void save()}>
              {update.loadings.updating ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
