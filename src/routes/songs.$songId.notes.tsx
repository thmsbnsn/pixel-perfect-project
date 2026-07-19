import { createFileRoute } from "@tanstack/react-router";
import { Panel, PanelHeader } from "@/components/common/panel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const KEY = (id: string) => `varynt.notes.${id}`;

export const Route = createFileRoute("/songs/$songId/notes")({
  component: NotesTab,
});

function NotesTab() {
  const { songId } = Route.useParams();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const v = typeof window !== "undefined" ? window.localStorage.getItem(KEY(songId)) : null;
      setNotes(v ?? "");
    } catch {
      /* noop */
    }
  }, [songId]);

  const save = () => {
    try {
      window.localStorage.setItem(KEY(songId), notes);
      toast.success("Notes saved locally");
    } catch {
      toast.error("Could not save notes");
    }
  };

  return (
    <Panel className="p-5">
      <PanelHeader
        title="Session notes"
        description="Free-form notes stored locally in this browser. Bridge sync will replace this."
      />
      <Textarea
        rows={16}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mt-4 font-mono text-xs"
        placeholder="- Verse riff pattern: ...&#10;- Reference tracks: ...&#10;- Open questions: ..."
      />
      <div className="mt-3 flex justify-end">
        <Button onClick={save}>Save notes</Button>
      </div>
    </Panel>
  );
}
