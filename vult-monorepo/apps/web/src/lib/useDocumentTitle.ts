import { useEffect } from "react";

export function useDocumentTitle(page: string) {
  useEffect(() => {
    document.title = page ? `${page} · Vult` : "Vult · The AI-native CRM";
  }, [page]);
}
