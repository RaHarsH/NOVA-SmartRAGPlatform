"use client";

import { fetchChatSessions, fetchFirstMessage } from "@/actions/chatSessions";
import { truncateText } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  feature_type: 'pdf' | 'csv' | 'web' | 'multi';
  source_id?: string;
  created_at: string;
  updated_at?: string;
  firstMessage?: string;
  isActive?: boolean;
}

export function useChatSessions() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = user?.id;
      if (!userId) {
        throw new Error('User ID not available');
      }

      const data = await fetchChatSessions(userId);
      
      if (data.success) {
        // Fetch first message for each session to display as preview
        const sessionsWithFirstMessage = await Promise.all(
          data.data.map(async (session: ChatSession) => {
            try {
              const firstMsgData = await fetchFirstMessage(session.id, userId);
              const firstUserMessage = firstMsgData.data?.find((msg: any) => msg.role === 'user');
              
              return {
                ...session,
                firstMessage: firstUserMessage ? truncateText(firstUserMessage.message) : session.title
              };
            } catch {
              return {
                ...session,
                firstMessage: session.title
              };
            }
          })
        );
        
        setChatSessions(sessionsWithFirstMessage);
      } else {
        setError('Failed to fetch chat sessions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error in fetchSessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is available
    if (user?.id) {
      fetchSessions();
    }
  }, [user?.id]);

  return {
    chatSessions,
    loading,
    error,
    refetch: fetchSessions
  };
}