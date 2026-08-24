"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type UseConversationChannelOptions = {
  conversationId: string;
  currentUserId: string;
  onMessagesChange: () => void;
  onReadReceiptChange: () => void;
  onTypingChange: (isTyping: boolean) => void;
};

function typingChannelName(conversationId: string) {
  return `conversation-typing:${conversationId}`;
}

function syncChannelName(conversationId: string) {
  return `conversation-sync:${conversationId}`;
}

function tryCreateBrowserClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

export function useConversationChannel({
  conversationId,
  currentUserId,
  onMessagesChange,
  onReadReceiptChange,
  onTypingChange,
}: UseConversationChannelOptions) {
  const callbacksRef = useRef({
    onMessagesChange,
    onReadReceiptChange,
    onTypingChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessagesChange,
      onReadReceiptChange,
      onTypingChange,
    };
  });

  useEffect(() => {
    const supabase = tryCreateBrowserClient();
    if (!supabase) {
      return;
    }

    const syncChannel = supabase.channel(syncChannelName(conversationId));
    syncChannel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          callbacksRef.current.onMessagesChange();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          callbacksRef.current.onReadReceiptChange();
        },
      )
      .subscribe();

    const typingChannel = supabase.channel(typingChannelName(conversationId));
    typingChannel
      .on(
        "broadcast",
        { event: "typing" },
        (payload: { payload?: { userId?: string; isTyping?: boolean } }) => {
          const data = payload.payload;
          if (!data?.userId || data.userId === currentUserId) {
            return;
          }
          callbacksRef.current.onTypingChange(Boolean(data.isTyping));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(syncChannel);
      void supabase.removeChannel(typingChannel);
    };
  }, [conversationId, currentUserId]);
}

export function useTypingBroadcast(conversationId: string, currentUserId: string) {
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = tryCreateBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase.channel(typingChannelName(conversationId));
    channelRef.current = channel;
    if (channel.state === "closed" || channel.state === "errored") {
      channel.subscribe();
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      channelRef.current = null;
    };
  }, [conversationId]);

  function notifyTyping(isTyping: boolean) {
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, isTyping },
    });

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isTyping) {
      timerRef.current = window.setTimeout(() => {
        void channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: currentUserId, isTyping: false },
        });
      }, 3000);
    }
  }

  return { notifyTyping };
}
