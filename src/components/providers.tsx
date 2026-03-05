"use client";

import { AuthProvider } from "./auth-provider";
import { LanguageProvider } from "./language-provider";
import { PasswordGate } from "./password-gate";
import { FeedbackWidget } from "./feedback-widget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PasswordGate>
          {children}
          <FeedbackWidget />
        </PasswordGate>
      </LanguageProvider>
    </AuthProvider>
  );
}
