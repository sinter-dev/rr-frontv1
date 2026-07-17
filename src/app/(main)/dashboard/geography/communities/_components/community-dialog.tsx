"use client";

// Community create/edit dialog. Parent <Select> is a national park.
// Only ACTIVE parks are offered when creating.

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
import { type Community, createCommunity, type NationalPark, updateCommunity } from "@/lib/api/geography";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: Community | null;
  parks: NationalPark[];
  onSaved: () => void;
}

export function CommunityDialog({ open, onOpenChange, community, parks, onSaved }: Props) {
  const isEdit = community !== null;
  const [name, setName] = useState("");
  const [parkId, setParkId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setName(community?.name ?? "");
      setParkId(community ? String(community.national_park) : "");
      setIsActive(community?.is_active ?? true);
      setErrors({});
    }
  }, [open, community]);

  async function handleSave() {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) {
        await updateCommunity(community.id, {
          name,
          national_park: Number(parkId),
          is_active: isActive,
        });
        toast.success(`Updated ${name}.`);
      } else {
        await createCommunity({ name, national_park: Number(parkId) });
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

  const parkOptions = isEdit ? parks : parks.filter((p) => p.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit community" : "Add community"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the community details." : "Create a new community under a national park."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field data-invalid={!!errors.national_park}>
            <FieldLabel htmlFor="community-park">National park</FieldLabel>
            <Select value={parkId} onValueChange={setParkId}>
              <SelectTrigger id="community-park" aria-invalid={!!errors.national_park}>
                <SelectValue placeholder="Select a park" />
              </SelectTrigger>
              <SelectContent>
                {parkOptions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} · {p.country_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.national_park && <FieldError errors={errors.national_park.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="community-name">Name</FieldLabel>
            <Input
              id="community-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nkuringo"
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError errors={errors.name.map((m) => ({ message: m }))} />}
          </Field>

          {isEdit && (
            <Field orientation="horizontal">
              <Switch id="community-active" checked={isActive} onCheckedChange={setIsActive} />
              <FieldLabel htmlFor="community-active">Active</FieldLabel>
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !name.trim() || !parkId}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
