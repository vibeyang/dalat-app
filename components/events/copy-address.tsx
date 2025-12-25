"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyAddressProps {
  address: string;
}

export function CopyAddress({ address }: CopyAddressProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
    >
      <span className="text-left">{address}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </button>
  );
}
