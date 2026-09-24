"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POSITION_CODES,
  POSITION_LABELS,
  type Player,
  type PositionCode,
} from "@/domain/types";
import { positionCodeSchema } from "@/domain/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jerseyNumber: z.string(),
  primaryPosition: positionCodeSchema,
  secondary: z.union([positionCodeSchema, z.literal("none")]),
});

type FormValues = z.infer<typeof formSchema>;

export function PlayerForm({
  initial,
  onSubmit,
}: {
  initial?: Player | null;
  onSubmit: (values: {
    name: string;
    jerseyNumber: number | null;
    primaryPosition: PositionCode;
    secondaryPositions: PositionCode[];
  }) => void | Promise<void>;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      jerseyNumber: initial?.jerseyNumber?.toString() ?? "",
      primaryPosition: initial?.primaryPosition ?? "OH",
      secondary: initial?.secondaryPositions[0] ?? "none",
    },
  });

  const primary = form.watch("primaryPosition");

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit(async (values) => {
        const n =
          values.jerseyNumber.trim() === ""
            ? null
            : Number.parseInt(values.jerseyNumber, 10);
        await onSubmit({
          name: values.name.trim(),
          jerseyNumber: n !== null && Number.isFinite(n) ? n : null,
          primaryPosition: values.primaryPosition,
          secondaryPositions:
            values.secondary !== "none" &&
            values.secondary !== values.primaryPosition
              ? [values.secondary]
              : [],
        });
      })}
    >
      <div className="space-y-1.5">
        <Label htmlFor="player-name">Name</Label>
        <Input
          id="player-name"
          data-testid="player-name"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jersey">Jersey #</Label>
        <Input
          id="jersey"
          inputMode="numeric"
          {...form.register("jerseyNumber")}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Primary position</Label>
        <Select
          value={form.watch("primaryPosition")}
          onValueChange={(v) =>
            form.setValue("primaryPosition", v as PositionCode)
          }
        >
          <SelectTrigger data-testid="primary-position">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POSITION_CODES.map((c) => (
              <SelectItem key={c} value={c}>
                {POSITION_LABELS[c]} ({c})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Secondary</Label>
        <Select
          value={form.watch("secondary")}
          onValueChange={(v) =>
            form.setValue("secondary", v as PositionCode | "none")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {POSITION_CODES.filter((c) => c !== primary).map((c) => (
              <SelectItem key={c} value={c}>
                {POSITION_LABELS[c]} ({c})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" data-testid="save-player">
        Save
      </Button>
    </form>
  );
}
