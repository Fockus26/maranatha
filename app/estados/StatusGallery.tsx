"use client";

import { StatusScreen } from "@/components/status/StatusScreen";

const reload = () => window.location.reload();

export function StatusGallery({
  screen,
  returnAt,
}: {
  screen: string;
  returnAt: string;
}) {
  switch (screen) {
    case "404-admin":
      return <StatusScreen variant="404-admin" panelHref="/dashboard" />;
    case "500":
      return <StatusScreen variant="500" onRetry={reload} />;
    case "500-code":
      return <StatusScreen variant="500" code="A1B2C3D4" onRetry={reload} />;
    case "offline":
      return <StatusScreen variant="offline" onRetry={reload} />;
    case "offline-draft":
      return <StatusScreen variant="offline" onRetry={reload} savedDraft />;
    case "maintenance":
      return <StatusScreen variant="maintenance" />;
    case "maintenance-hour":
      return <StatusScreen variant="maintenance" returnAt={returnAt} />;
    default:
      return <StatusScreen variant="404" />;
  }
}
