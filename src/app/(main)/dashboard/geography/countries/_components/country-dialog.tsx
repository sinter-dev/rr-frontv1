"use client";

// Country create/edit dialog. Controlled by the parent via `open`.
// `country` null = create mode; present = edit mode.

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
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { type Country, createCountry, updateCountry } from "@/lib/api/geography";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: Country | null;
  onSaved: () => void;
}

export function CountryDialog({ open, onOpenChange, country, onSaved }: Props) {
  const isEdit = country !== null;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // reset fields whenever the dialog opens for a different row
  useEffect(() => {
    if (open) {
      setName(country?.name ?? "");
      setCode(country?.code ?? "");
      setIsActive(country?.is_active ?? true);
      setErrors({});
    }
  }, [open, country]);

  async function handleSave() {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) {
        await updateCountry(country.id, { name, code, is_active: isActive });
        toast.success(`Updated ${name}.`);
      } else {
        await createCountry({ name, code });
        toast.success(`Created ${name}.`);
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) setErrors(error.fieldErrors);
        else toast.error(error.message);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit country" : "Add country"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update the country details." : "Create a new country."}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="country-name">Name</FieldLabel>
            <Input
              id="country-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Uganda"
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError errors={errors.name.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="country-code">ISO code (optional)</FieldLabel>
            <Input
              id="country-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="UG"
              maxLength={3}
              aria-invalid={!!errors.code}
            />
            {errors.code && <FieldError errors={errors.code.map((m) => ({ message: m }))} />}
          </Field>

          {isEdit && (
            <Field orientation="horizontal">
              <Switch id="country-active" checked={isActive} onCheckedChange={setIsActive} />
              <FieldLabel htmlFor="country-active">Active</FieldLabel>
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
