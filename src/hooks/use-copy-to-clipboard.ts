import { useState, useCallback } from "react";

interface CopiedField {
  id: string;
  field: string;
}

export function useCopyToClipboard() {
  const [copiedField, setCopiedField] = useState<CopiedField | null>(null);

  const copyToClipboard = useCallback(async (text: string, id: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField({ id, field });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }, []);

  const isCopied = useCallback((id: string, field: string) => {
    return copiedField?.id === id && copiedField?.field === field;
  }, [copiedField]);

  return {
    copyToClipboard,
    isCopied,
  };
}