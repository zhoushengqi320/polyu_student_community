"use client";

import { useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type PostgresChangeConfig = {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  table: string;
  filter?: string;
};

function tryCreateBrowserClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function configKey(config: PostgresChangeConfig): string {
  return [
    config.schema ?? "public",
    config.table,
    config.event ?? "*",
    config.filter ?? "",
  ].join(":");
}

export function usePostgresChanges(
  enabled: boolean,
  channelName: string,
  configs: PostgresChangeConfig[],
  onChange: () => void,
  debounceMs = 500,
) {
  const onChangeRef = useRef(onChange);
  const configSignature = useMemo(
    () => configs.map(configKey).join("|"),
    [configs],
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!enabled || configs.length === 0) {
      return;
    }

    const supabase = tryCreateBrowserClient();
    if (!supabase) {
      return;
    }

    let timer: number | null = null;
    const schedule = () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        onChangeRef.current();
      }, debounceMs);
    };

    const channel = supabase.channel(channelName);
    for (const config of configs) {
      channel.on(
        "postgres_changes",
        {
          event: config.event ?? "*",
          schema: config.schema ?? "public",
          table: config.table,
          filter: config.filter,
        },
        schedule,
      );
    }
    channel.subscribe();

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      void supabase.removeChannel(channel);
    };
  }, [enabled, channelName, configSignature, debounceMs]);
}
