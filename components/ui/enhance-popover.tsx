"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Sparkles, Wand2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomEnhanceChips } from "@/lib/hooks/use-custom-enhance-chips";

// Default enhancement directions
const DEFAULT_CHIPS = [
  { id: "fun", label: "More fun", direction: "Make it more fun and playful" },
  { id: "formal", label: "Formal", direction: "Make it more formal and professional" },
  { id: "shorter", label: "Shorter", direction: "Make it more concise" },
  { id: "detailed", label: "Detailed", direction: "Add more detail and depth" },
];

interface EnhancePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEnhance: (direction?: string) => Promise<void>;
  isEnhancing: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function EnhancePopover({
  isOpen,
  onClose,
  onEnhance,
  isEnhancing,
  triggerRef,
}: EnhancePopoverProps) {
  const [selectedChip, setSelectedChip] = React.useState<string | null>(null);
  const [customDirection, setCustomDirection] = React.useState("");
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { chips: customChips, addOrUpdateChip, removeChip } = useCustomEnhanceChips();

  // Calculate position relative to trigger
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      const padding = 8;

      // Position above and to the left of the trigger
      let left = rect.right - popoverWidth;
      const top = rect.top - padding;

      // Keep within viewport
      if (left < padding) left = padding;
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }

      setPosition({ top, left });
    }
  }, [isOpen, triggerRef]);

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  // Reset state when closing
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedChip(null);
      setCustomDirection("");
    }
  }, [isOpen]);

  const handleQuickEnhance = async () => {
    await onEnhance();
    onClose();
  };

  const handleDirectedEnhance = async () => {
    const direction = customDirection.trim() ||
      DEFAULT_CHIPS.find(c => c.id === selectedChip)?.direction ||
      customChips.find(c => c.id === selectedChip)?.direction;

    if (direction) {
      // Save custom directions for future use
      if (customDirection.trim()) {
        addOrUpdateChip(customDirection.trim());
      }
      await onEnhance(direction);
      onClose();
    }
  };

  const handleChipClick = (chipId: string) => {
    setSelectedChip(chipId === selectedChip ? null : chipId);
    setCustomDirection(""); // Clear custom input when selecting preset
  };

  const handleCustomInputChange = (value: string) => {
    setCustomDirection(value);
    if (value.trim()) {
      setSelectedChip(null); // Clear chip selection when typing custom
    }
  };

  const canApply = selectedChip || customDirection.trim();

  if (!isOpen) return null;

  const content = (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateY(-100%)",
      }}
      className={cn(
        "z-50 w-[280px] rounded-xl p-3",
        // Glass morphism effect
        "bg-popover/95 backdrop-blur-xl",
        "border border-border/50",
        "shadow-xl shadow-black/20",
        // Animation
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      )}
    >
      {/* Quick Enhance Option */}
      <button
        type="button"
        onClick={handleQuickEnhance}
        disabled={isEnhancing}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "text-left transition-all",
          "hover:bg-accent active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          <Sparkles className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Enhance</div>
          <div className="text-xs text-muted-foreground">Auto-improve your text</div>
        </div>
        {isEnhancing && <Loader2 className="w-4 h-4 animate-spin" />}
      </button>

      {/* Divider */}
      <div className="my-2 h-px bg-border/50" />

      {/* Directed Enhancement */}
      <div className="px-1">
        <div className="flex items-center gap-2 px-2 mb-2">
          <Wand2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Guide the magic</span>
        </div>

        {/* Chips Grid */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {/* Default chips */}
          {DEFAULT_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleChipClick(chip.id)}
              disabled={isEnhancing}
              className={cn(
                "px-2.5 py-1.5 text-xs rounded-full transition-all",
                "border active:scale-95",
                selectedChip === chip.id
                  ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                  : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Custom chips from user */}
        {customChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {customChips.map((chip) => (
              <div key={chip.id} className="relative group">
                <button
                  type="button"
                  onClick={() => handleChipClick(chip.id)}
                  disabled={isEnhancing}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded-full transition-all",
                    "border active:scale-95 pr-6",
                    selectedChip === chip.id
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-muted/30 border-border/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {chip.label}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(chip.id);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Custom Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={customDirection}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canApply && !isEnhancing) {
                handleDirectedEnhance();
              }
            }}
            placeholder="Or describe what you want..."
            disabled={isEnhancing}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg",
              "bg-muted/30 border border-border/30",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50",
              "disabled:opacity-50"
            )}
          />
        </div>

        {/* Apply Button */}
        <button
          type="button"
          onClick={handleDirectedEnhance}
          disabled={!canApply || isEnhancing}
          className={cn(
            "w-full mt-2 px-3 py-2 text-sm font-medium rounded-lg",
            "transition-all active:scale-[0.98]",
            canApply
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isEnhancing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enhancing...
            </span>
          ) : (
            "Apply"
          )}
        </button>
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}
