"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/client";
import { isAnalyticsEnabled } from "@/lib/feature-flags";

export function RouteViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    if (!isAnalyticsEnabled()) {
      return;
    }

    trackClientEvent({
      name: "page_view",
      route: pathname,
      properties: {
        hasQuery: queryString.length > 0,
      },
    });
  }, [pathname, queryString]);

  return null;
}
