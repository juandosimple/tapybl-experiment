import { useEffect, useState } from "react";
import { fetchLessonPreview } from "@/services/microlessons/api";

export function useLessonGraphLoader({
  organizationId,
  lessonId,
}: {
  organizationId: string;
  lessonId: string;
}) {
  const [graph, setGraph] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await fetchLessonPreview(organizationId, lessonId);
        if (cancel) return;
        const l = p?.lessonContent?.contentList;
        if (!l) throw new Error("Contenido no disponible.");
        setGraph(l);
      } catch (e: any) {
        if (!cancel) setError(e?.message || "Error cargando preview.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [organizationId, lessonId]);

  return { graph, loading, error };
}