"use client";

import { AuthProvider } from "./auth-provider";
import { LanguageProvider } from "./language-provider";
import { FeedbackWidget } from "./feedback-widget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
        <FeedbackWidget />
      </LanguageProvider>
    </AuthProvider>
  );
}
