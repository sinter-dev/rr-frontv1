"use client";

// Category create/edit dialog. Controlled by the parent via `open`.
// `category` null = create mode; present = edit mode.

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
import { type Category, createCategory, updateCategory } from "@/lib/api/marketplace";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSaved: () => void;
}

export function CategoryDialog({ open, onOpenChange, category, onSaved }: Props) {
  const isEdit = category !== null;
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setIsActive(category?.is_active ?? true);
      setErrors({});
    }
  }, [open, category]);

  async function handleSave() {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) {
        await updateCategory(category.id, { name, is_active: isActive });
        toast.success(`Updated ${name}.`);
      } else {
        await createCategory({ name });
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
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the category name or status." : "Craft sellers will see this in their category dropdown."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="category-name">Name</FieldLabel>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wood Carvings"
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError errors={errors.name.map((m) => ({ message: m }))} />}
          </Field>

          {isEdit && (
            <Field orientation="horizontal">
              <Switch id="category-active" checked={isActive} onCheckedChange={setIsActive} />
              <FieldLabel htmlFor="category-active">Active</FieldLabel>
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
