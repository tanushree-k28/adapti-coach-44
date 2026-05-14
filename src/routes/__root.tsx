import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NovaMentor — Adaptive AI Learning" },
      { name: "description", content: "AI-powered adaptive learning with voice tutor, smart notes, certificates, rewards and personalized paths." },
      { name: "theme-color", content: "#1a0b2e" },
      { property: "og:title", content: "NovaMentor — Adaptive AI Learning" },
      { name: "twitter:title", content: "NovaMentor — Adaptive AI Learning" },
      { property: "og:description", content: "AI-powered adaptive learning with voice tutor, smart notes, certificates, rewards and personalized paths." },
      { name: "twitter:description", content: "AI-powered adaptive learning with voice tutor, smart notes, certificates, rewards and personalized paths." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/24e8047a-f163-4d6a-b6eb-3fd602e9ca24/id-preview-3e7666ba--b8328762-26a6-45d4-ae68-e38f0aba9a35.lovable.app-1778790001318.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/24e8047a-f163-4d6a-b6eb-3fd602e9ca24/id-preview-3e7666ba--b8328762-26a6-45d4-ae68-e38f0aba9a35.lovable.app-1778790001318.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <p className="mt-3 text-muted-foreground">This page drifted into deep space.</p>
        <a href="/" className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground">Back home</a>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="mt-5 px-5 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground"
          >Try again</button>
        </div>
      </div>
    );
  },
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
    });
    return () => subscription.unsubscribe();
  }, [router]);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
