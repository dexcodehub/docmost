import { UserProvider } from "@/features/user/user-provider.tsx";
import { Outlet, useParams } from "react-router-dom";
import GlobalAppShell from "@/components/layouts/global/global-app-shell.tsx";
import { PosthogUser } from "@/ee/components/posthog-user.tsx";
import { isCloud } from "@/lib/config.ts";
import { SearchSpotlight } from "@/features/search/components/search-spotlight.tsx";
import React, { useEffect } from "react";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { logInfo, logWarn } from "@/lib/logger";

export default function Layout() {
  const { spaceSlug } = useParams();
  const { data: space, isLoading, isError } = useGetSpaceBySlugQuery(spaceSlug);

  useEffect(() => {
    logInfo("layout:enter", { spaceSlug });
  }, [spaceSlug]);

  useEffect(() => {
    if (isLoading) logInfo("space.query:loading", { spaceSlug });
    if (isError) logWarn("space.query:error", { spaceSlug });
    if (space) logInfo("space.query:loaded", { spaceSlug, id: space.id });
  }, [isLoading, isError, space, spaceSlug]);

  return (
    <UserProvider>
      <GlobalAppShell>
        <Outlet />
      </GlobalAppShell>
      {isCloud() && <PosthogUser />}
      <SearchSpotlight spaceId={space?.id} />
    </UserProvider>
  );
}
