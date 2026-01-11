"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ExtractedEventData } from "@/lib/types";

interface EventReviewCardProps {
  event: ExtractedEventData;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdate: (updated: ExtractedEventData) => void;
}

export function EventReviewCard({
  event,
  index,
  isSelected,
  onToggleSelect,
  onUpdate,
}: EventReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedEvent, setEditedEvent] = useState(event);

  const isDuplicate = !!event.duplicate_of;
  const confidenceColor =
    event.confidence >= 0.8
      ? "text-green-600"
      : event.confidence >= 0.6
      ? "text-yellow-600"
      : "text-red-600";

  const handleFieldChange = (field: keyof ExtractedEventData, value: string | null) => {
    const updated = { ...editedEvent, [field]: value };
    setEditedEvent(updated);
    onUpdate(updated);
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        isSelected ? "border-primary ring-1 ring-primary" : "border-border",
        isDuplicate && !isSelected && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onToggleSelect}
          className={cn(
            "shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
          )}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {event.description}
                </p>
              )}
            </div>
            <span className={cn("text-xs font-medium", confidenceColor)}>
              {Math.round(event.confidence * 100)}%
            </span>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(event.starts_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
            {event.location_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location_name}
              </span>
            )}
          </div>

          {/* Duplicate warning */}
          {isDuplicate && (
            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Possible duplicate ({Math.round((event.duplicate_confidence ?? 0) * 100)}%
                match)
              </span>
            </div>
          )}
        </div>

        {/* Expand/collapse */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 pt-4">
            <div className="space-y-2">
              <Label htmlFor={`title-${index}`}>Title</Label>
              <Input
                id={`title-${index}`}
                value={editedEvent.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`location-${index}`}>Location</Label>
              <Input
                id={`location-${index}`}
                value={editedEvent.location_name ?? ""}
                onChange={(e) =>
                  handleFieldChange("location_name", e.target.value || null)
                }
                placeholder="Venue name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`date-${index}`}>Date & Time</Label>
              <Input
                id={`date-${index}`}
                type="datetime-local"
                value={editedEvent.starts_at.slice(0, 16)}
                onChange={(e) =>
                  handleFieldChange("starts_at", e.target.value + ":00+07:00")
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`address-${index}`}>Address</Label>
              <Input
                id={`address-${index}`}
                value={editedEvent.address ?? ""}
                onChange={(e) =>
                  handleFieldChange("address", e.target.value || null)
                }
                placeholder="Street address"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${index}`}>Description</Label>
            <textarea
              id={`description-${index}`}
              value={editedEvent.description ?? ""}
              onChange={(e) =>
                handleFieldChange("description", e.target.value || null)
              }
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Event description"
            />
          </div>
        </div>
      )}
    </div>
  );
}
