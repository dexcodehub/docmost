import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import React, { useEffect } from "react";
import useCurrentUser from "@/features/user/hooks/use-current-user";
import { useTranslation } from "react-i18next";
import { socketAtom } from "@/features/websocket/atoms/socket-atom.ts";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/features/websocket/types";
import { useQuerySubscription } from "@/features/websocket/use-query-subscription.ts";
import { useTreeSocket } from "@/features/websocket/use-tree-socket.ts";
import { useCollabToken } from "@/features/auth/queries/auth-query.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import { logInfo, logWarn, logError } from "@/lib/logger";

export function UserProvider({ children }: React.PropsWithChildren) {
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const { data, isLoading, error, isError } = useCurrentUser();
  const { i18n } = useTranslation();
  const [, setSocket] = useAtom(socketAtom);
  // fetch collab token on load
  const { data: collab } = useCollabToken();

  useEffect(() => {
    if (isLoading || isError) {
      if (isLoading) logInfo("user.current:loading");
      if (isError) logWarn("user.current:error", { error });
      return;
    }

    logInfo("ws.connecting", { url: SOCKET_URL });
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    // @ts-ignore
    setSocket(newSocket);

    newSocket.on("connect", () => {
      logInfo("ws.connected");
    });

    newSocket.on("connect_error", (err) => {
      logError("ws.connect_error", { message: err.message });
    });

    return () => {
      logInfo("ws.disconnected");
      newSocket.disconnect();
    };
  }, [isError, isLoading]);

  useQuerySubscription();
  useTreeSocket();

  useEffect(() => {
    if (data && data.user && data.workspace) {
      setCurrentUser(data);
      logInfo("user.loaded", {
        userId: data.user.id,
        workspaceId: data.workspace.id,
      });
      i18n.changeLanguage(
        data.user.locale === "en" ? "en-US" : data.user.locale,
      );
    }
  }, [data, isLoading]);

  if (isLoading) return <></>;

  if (isError && error?.["response"]?.status === 404) {
    logWarn("user.current:404");
    return <Error404 />;
  }

  if (error) {
    logWarn("user.current:unknownError", { error });
    return <></>;
  }

  return <>{children}</>;
}
