import { useEffect } from "react";

export function useDocumentTitle(page: string) {
  useEffect(() => {
    document.title = page ? `${page} · SILA` : "SILA · Know who paid. Get paid faster.";
  }, [page]);
}
