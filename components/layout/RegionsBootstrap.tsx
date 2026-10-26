"use client";

import { useEffect } from "react";
import { API_BASE } from "@/lib/apiClient";
import { loadRegionsFromApi } from "@/lib/regions";

/**
 * Pulls the server's region table (GET /dl-accounts/v1/sites) into
 * lib/regions once per page load, so a region added on the server shows
 * up in selectors and badges without a dashboard release. Renders
 * nothing; failures are swallowed because the bootstrap table is always
 * enough to render with.
 */
export function RegionsBootstrap() {
  useEffect(() => {
    void loadRegionsFromApi(API_BASE);
  }, []);
  return null;
}
