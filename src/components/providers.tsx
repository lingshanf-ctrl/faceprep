"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "./language-provider";
import { PasswordGate } from "./password-gate";
import { FeedbackWidget } from "./feedback-widget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <PasswordGate>
          {children}
          <FeedbackWidget />
        </PasswordGate>
      </LanguageProvider>
    </SessionProvider>
  );
}
