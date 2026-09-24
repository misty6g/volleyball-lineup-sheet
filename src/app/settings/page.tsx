"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Upload, Database } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { repository } from "@/db/repository";
import { exportBundleSchema } from "@/domain/schema";
import { useAppStore } from "@/store/app-store";

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const team = useAppStore((s) => s.team);
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const seedDemo = useAppStore((s) => s.seedDemo);
  const refresh = useAppStore((s) => s.refresh);

  const exportJson = async () => {
    try {
      const bundle = await repository.exportAll();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rotation-board-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported JSON backup");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = exportBundleSchema.parse(JSON.parse(text));
      await repository.importAll(parsed);
      await refresh();
      toast.success("Imported backup");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <main className="flex flex-1 flex-col px-4 pb-28 pt-6" data-testid="settings-page">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {team?.name ?? "No team"} · local-only MVP
        </p>
      </header>

      <section className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-card/70 p-4">
        <h2 className="text-sm font-semibold text-rit">Match preferences</h2>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="jersey">Show jersey numbers</Label>
          <Switch
            id="jersey"
            checked={settings.showJerseyNumbers}
            onCheckedChange={(v) =>
              void saveSettings({ ...settings, showJerseyNumbers: v })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="haptic">Haptic on rotate</Label>
          <Switch
            id="haptic"
            checked={settings.hapticFeedback}
            onCheckedChange={(v) =>
              void saveSettings({ ...settings, hapticFeedback: v })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="confirm">Confirm before rotate</Label>
          <Switch
            id="confirm"
            checked={settings.confirmRotate}
            onCheckedChange={(v) =>
              void saveSettings({ ...settings, confirmRotate: v })
            }
          />
        </div>
      </section>

      <section className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-card/70 p-4">
        <h2 className="text-sm font-semibold text-rit">Data</h2>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => void exportJson()}
          data-testid="export-json"
        >
          <Download className="size-4" />
          Export JSON backup
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => fileRef.current?.click()}
          data-testid="import-json"
        >
          <Upload className="size-4" />
          Import JSON backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJson(f);
            e.target.value = "";
          }}
        />
        <Button
          variant="secondary"
          className="w-full justify-start"
          onClick={() => {
            void seedDemo().then(() => {
              toast.success("Demo data reloaded");
              router.push("/lineups");
            });
          }}
          data-testid="reload-demo"
        >
          <Database className="size-4" />
          Reload fictional demo roster
        </Button>
        <Separator />
        <Button
          variant="destructive"
          className="w-full justify-start"
          onClick={() => {
            if (!window.confirm("Clear all local data? This cannot be undone."))
              return;
            void clearAllData().then(() => {
              toast.message("Data cleared");
              router.replace("/onboarding");
            });
          }}
          data-testid="clear-data"
        >
          <Trash2 className="size-4" />
          Clear all data
        </Button>
      </section>

      <p className="text-center text-[11px] text-muted-foreground">
        Rotation Board v1 · Offline IndexedDB · Future sync via repository layer
      </p>
    </main>
  );
}
