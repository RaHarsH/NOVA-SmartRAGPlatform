"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";

interface Message {
  id: string;
  type: "user" | "ai_agent";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatSectionProps {
  fileName: string;
  sessionId: string;
  pdfId: string;
  className?: string;
}

export default function ChatSection({ 
  fileName, 
  sessionId, 
  pdfId, 
  className = "" 
}: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!sessionId || !user?.id) return;
      
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/chat/${sessionId}/messages`,
          {
            headers: {
              "user-id": user.id,
            },
          }
        );

        if (response.data.success) {
          const loadedMessages = response.data.data.map((msg: any) => ({
            id: msg.id,
            type: msg.role === "user" ? "user" : "ai_agent",
            content: msg.message,
            timestamp: new Date(msg.timestamp),
          }));
          
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([
          {
            id: "welcome",
            type: "ai_agent",
            content: `Hello! I'm ready to help you analyze "${fileName}". You can ask me questions about the content, request summaries, or explore specific topics within the document.`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId, user?.id, fileName]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !user?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "ai_agent",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/chat/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": user.id,
          },
          body: JSON.stringify({
            session_id: sessionId,
            message: currentMessage,
            pdf_id: pdfId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let assistantResponse = "";
      const decoder = new TextDecoder();

      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            id: (Date.now() + 2).toString(),
            type: "ai_agent",
            content: "",
            timestamp: new Date(),
          },
        ];
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsTyping(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantResponse += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantResponse,
                  };
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            id: (Date.now() + 2).toString(),
            type: "ai_agent",
            content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className={`h-full bg-black flex items-center justify-center ${className}`}>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="text-gray-400">Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-black flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">AI Agent</h2>
            <p className="text-xs text-gray-400">Analyzing {fileName}</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 bg-gray-200/10 px-3 py-1 rounded-full">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: "calc(100vh - 200px)", scrollbarWidth: "thin", scrollbarColor: "#374151 transparent" }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex max-w-[85%] ${
                message.type === "user" ? "flex-row-reverse gap-x-3" : "flex-row gap-x-3"
              } items-start`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === "user" 
                    ? "bg-gradient-to-br from-blue-500 to-violet-600" 
                    : "bg-gray-700 ring-2 ring-blue-500/20"
                }`}
              >
                {message.type === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-blue-400" />
                )}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 max-w-full ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg"
                    : "bg-gray-800/60 text-white border border-gray-600/30 shadow-lg backdrop-blur-sm"
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center space-x-2 py-1">
                    <span className="text-sm text-gray-400">Analyzing</span>
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full dot-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full dot-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full dot-bounce" />
                    </span>
                  </div>
                ) : (
                  <>
                    <div 
                      className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                      style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                    >
                      {message.content}
                    </div>
                    <div 
                      className={`text-xs mt-2 ${
                        message.type === "user" ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-600/30 bg-gray-900/20">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the PDF..."
              className="bg-gray-800/60 border-gray-600/40 px-4 py-3 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl min-h-[48px] resize-none backdrop-blur-sm"
              disabled={isTyping}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:from-blue-600 hover:to-violet-700 px-4 py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-gray-400 mt-2 px-1">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
