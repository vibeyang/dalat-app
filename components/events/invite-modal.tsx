"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Send, Loader2, Check, X, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButtons } from "./share-buttons";

interface InviteModalProps {
  eventSlug: string;
  eventTitle: string;
  eventDescription: string | null;
  startsAt: string;
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
}

export function InviteModal({ eventSlug, eventTitle, eventDescription, startsAt }: InviteModalProps) {
  const t = useTranslations("invite");
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<Array<{ email: string; name?: string }>>([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${eventSlug}`;

  const parseEmails = useCallback((input: string) => {
    // Parse comma, semicolon, newline, or space separated emails
    const emailRegex = /[^\s,;]+@[^\s,;]+\.[^\s,;]+/g;
    const matches = input.match(emailRegex) || [];
    return matches.map(email => ({ email: email.toLowerCase().trim() }));
  }, []);

  const handleAddEmails = useCallback(() => {
    if (!emailInput.trim()) return;

    const newEmails = parseEmails(emailInput);
    const existingSet = new Set(emails.map(e => e.email));
    const uniqueNew = newEmails.filter(e => !existingSet.has(e.email));

    if (uniqueNew.length > 0) {
      setEmails(prev => [...prev, ...uniqueNew]);
    }
    setEmailInput("");
    setError(null);
  }, [emailInput, emails, parseEmails]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddEmails();
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(e => e.email !== emailToRemove));
  };

  const handleSendInvites = async () => {
    if (emails.length === 0) {
      setError(t("noEmails"));
      return;
    }

    setSending(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`/api/events/${eventSlug}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(t("quotaExceeded", { remaining: data.remaining_daily || 0 }));
        } else if (response.status === 403) {
          setError(t("notAuthorized"));
        } else {
          setError(data.error || t("sendFailed"));
        }
        return;
      }

      setResults(data.results);

      // Clear successful emails from the list
      const failedEmails = data.results
        .filter((r: InviteResult) => !r.success)
        .map((r: InviteResult) => r.email);
      setEmails(emails.filter(e => failedEmails.includes(e.email)));

    } catch (err) {
      setError(t("sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setEmailInput("");
      setEmails([]);
      setResults([]);
      setError(null);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const hasResults = results.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          {t("inviteGuests")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("inviteGuests")}</DialogTitle>
          <DialogDescription>
            {t("inviteDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Share buttons */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t("shareVia")}</Label>
            <ShareButtons
              eventUrl={eventUrl}
              eventTitle={eventTitle}
              eventDescription={eventDescription}
              startsAt={startsAt}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("orSendEmail")}
              </span>
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="email-input">{t("emailAddresses")}</Label>
            <div className="flex gap-2">
              <Input
                id="email-input"
                type="text"
                placeholder={t("emailPlaceholder")}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleAddEmails}
                disabled={sending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEmails}
                disabled={!emailInput.trim() || sending}
              >
                {t("add")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("emailHint")}
            </p>
          </div>

          {/* Email chips */}
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emails.map(({ email }) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="hover:text-destructive p-0.5"
                    disabled={sending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Results */}
          {hasResults && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              {successCount > 0 && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {t("sentSuccess", { count: successCount })}
                </p>
              )}
              {results.filter(r => !r.success).map(r => (
                <p key={r.email} className="text-sm text-destructive flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {r.email}: {r.error}
                </p>
              ))}
            </div>
          )}

          {/* Send button */}
          <Button
            onClick={handleSendInvites}
            disabled={emails.length === 0 || sending}
            className="w-full gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("sending")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t("sendInvites", { count: emails.length })}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
