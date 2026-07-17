"use client";

// National Park create/edit dialog. Adds a parent <Select> for the
// country (the new pattern vs Countries). Only ACTIVE countries are
// offered when creating.

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { type Country, createPark, type NationalPark, updatePark } from "@/lib/api/geography";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  park: NationalPark | null;
  countries: Country[];
  onSaved: () => void;
}

export function ParkDialog({ open, onOpenChange, park, countries, onSaved }: Props) {
  const isEdit = park !== null;
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setName(park?.name ?? "");
      setCountryId(park ? String(park.country) : "");
      setIsActive(park?.is_active ?? true);
      setErrors({});
    }
  }, [open, park]);

  async function handleSave() {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) {
        await updatePark(park.id, { name, country: Number(countryId), is_active: isActive });
        toast.success(`Updated ${name}.`);
      } else {
        await createPark({ name, country: Number(countryId) });
        toast.success(`Created ${name}.`);
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setErrors(error.fieldErrors);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  // when creating, only active countries are valid parents
  const countryOptions = isEdit ? countries : countries.filter((c) => c.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit national park" : "Add national park"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the park details." : "Create a new national park under a country."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field data-invalid={!!errors.country}>
            <FieldLabel htmlFor="park-country">Country</FieldLabel>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger id="park-country" aria-invalid={!!errors.country}>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <FieldError errors={errors.country.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="park-name">Name</FieldLabel>
            <Input
              id="park-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bwindi Impenetrable National Park"
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError errors={errors.name.map((m) => ({ message: m }))} />}
          </Field>

          {isEdit && (
            <Field orientation="horizontal">
              <Switch id="park-active" checked={isActive} onCheckedChange={setIsActive} />
              <FieldLabel htmlFor="park-active">Active</FieldLabel>
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !name.trim() || !countryId}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
