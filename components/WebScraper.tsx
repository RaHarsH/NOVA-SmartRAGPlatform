"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Newspaper,
  Rocket,
  PenSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

interface WebScrapeResult {
  id: string;
  url: string;
  title: string;
  content: string;
  meta_description?: string;
  word_count: number;
  embedding_status: string;
  created_at: string;
}

interface WebScraperProps {
  onWebScraped?: (webData: WebScrapeResult) => void;
  className?: string;
}

interface ScrapedWeb {
  id: string;
  url: string;
  title: string;
  content_preview: string;
  word_count: number;
  embedding_status: string;
}

export default function WebScraper({
  onWebScraped,
  className = "",
}: WebScraperProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedWeb, setScrapedWeb] = useState<ScrapedWeb | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  // Add refs to prevent multiple API calls
  const createSessionRef = useRef(false);
  const scrapeRef = useRef(false);

  // Poll for status updates when content is being processed
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (scrapedWeb && scrapedWeb.embedding_status === "pending") {
      intervalId = setInterval(async () => {
        try {
          if (!user?.id) return;

          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/web/${scrapedWeb.id}`,
            {
              headers: {
                "user-id": user.id,
              },
            }
          );

          if (response.data.success) {
            const updatedData = response.data.data;
            setScrapedWeb((prev) =>
              prev
                ? {
                    ...prev,
                    embedding_status: updatedData.embedding_status,
                  }
                : null
            );

            // Stop polling if processing is complete or failed
            if (
              updatedData.embedding_status === "completed" ||
              updatedData.embedding_status === "failed"
            ) {
              clearInterval(intervalId);
              if (updatedData.embedding_status === "completed") {
                toast.success("Content processing completed!");
              } else {
                toast.error("Content processing failed.");
              }
            }
          }
        } catch (error) {
          console.error("Error checking status:", error);
          // Don't show error toast for polling failures
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [scrapedWeb?.embedding_status, scrapedWeb?.id, user?.id]);

  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  const handleScrapeUrl = async () => {
    // Prevent multiple simultaneous scrape requests
    if (scrapeRef.current) {
      return;
    }

    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL (including http:// or https://)");
      return;
    }

    if (!user?.id) {
      toast.error("Please sign in to scrape URLs");
      return;
    }

    scrapeRef.current = true;
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/web/scrape-url`,
        { url: url.trim() },
        {
          headers: {
            "user-id": user.id,
          },
        }
      );

      if (response.data.success) {
        const webData = response.data.data;
        setScrapedWeb(webData);
        onWebScraped?.(webData);
        toast.success(response.data.message);
      }
    } catch (error) {
      // Catch as unknown
      console.error("Web scraping error:", error);
      let errorMessage = "Failed to scrape the URL";

      // Use the type guard to check for Axios-specific errors
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.status === 400) {
          errorMessage =
            "Could not access the URL. Please check the URL and try again.";
        } else if (error.response?.status === 500) {
          errorMessage =
            "Server error while processing the URL. Please try again.";
        } else if (error.code === "ERR_NETWORK") {
          // Note: Axios uses ERR_NETWORK
          errorMessage = "Network error. Please check your connection.";
        }
      } else if (error instanceof Error) {
        // Fallback for generic errors
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      scrapeRef.current = false;
    }
  };

  const handleStartChat = async () => {
    // Prevent multiple simultaneous session creation requests
    if (
      createSessionRef.current ||
      !scrapedWeb ||
      !user?.id ||
      isCreatingSession
    ) {
      return;
    }

    createSessionRef.current = true;
    setIsCreatingSession(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/chat/create-session`,
        {
          user_id: user.id,
          feature_type: "web",
          source_id: scrapedWeb.id,
          title: `Web Chat - ${scrapedWeb.title}`,
        },
        {
          headers: {
            "user-id": user.id,
          },
        }
      );

      if (response.data.success) {
        const sessionId = response.data.data.id; // Fixed: use 'id' instead of 'session_id'
        toast.success("Chat session created successfully!");
        router.push(
          `/dashboard/chats/web-chat/${scrapedWeb.id}?sessionId=${sessionId}`
        );
      }
    } catch (error) {
      console.error("Session creation error:", error);
      toast.error("Failed to create chat session");
    } finally {
      setIsCreatingSession(false);
      createSessionRef.current = false;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading && !scrapeRef.current) {
      handleScrapeUrl();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "pending":
        return <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Globe className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Ready to chat!";
      case "pending":
        return "Processing content...";
      case "failed":
        return "Processing failed";
      default:
        return "Unknown status";
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2 mt-20">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-gray-800 to-white">
          Web Content Chat
        </h1>
        <p className="text-gray-400">
          Enter any website URL to scrape its content and start chatting with it
        </p>
      </div>

      {/* URL Input Section */}
      <div className="relative border-2 border-dashed border-gray-600 bg-gray-800/20 hover:border-gray-500 rounded-xl p-8 transition-all duration-300">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center">
            <Globe className="h-8 w-8 text-white" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Enter Website URL
            </h3>
            <p className="text-gray-400 mb-4">
              Paste any website URL to scrape and analyze its content
            </p>
          </div>

          <div className="flex space-x-3 max-w-2xl mx-auto">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-black/60 border-gray-600 text-white placeholder:text-gray-500 h-12"
                disabled={isLoading || scrapeRef.current}
              />
            </div>
            <Button
              onClick={handleScrapeUrl}
              disabled={isLoading || !url.trim() || scrapeRef.current}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 px-6 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Scrape Content
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            💡 Works best with news articles, blog posts, and content-rich pages
          </p>
        </div>
      </div>

      {/* Scraped Content Preview */}
      {scrapedWeb && (
        <div className="relative border-2 border-dashed border-violet-500 bg-violet-400/10 rounded-xl p-8 transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/60 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-medium text-white truncate">
                    {scrapedWeb.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                    <a
                      href={scrapedWeb.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline truncate"
                    >
                      {scrapedWeb.url}
                    </a>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    📝 {scrapedWeb.word_count.toLocaleString()} words
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(scrapedWeb.embedding_status)}
              </div>
            </div>

            <div className="p-4 bg-black/60 rounded-lg">
              <p className="text-sm text-gray-300 line-clamp-3">
                {scrapedWeb.content_preview}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(scrapedWeb.embedding_status)}
                <span className="text-sm text-gray-400">
                  {getStatusText(scrapedWeb.embedding_status)}
                </span>
              </div>

              {scrapedWeb.embedding_status === "completed" && (
                <Button
                  onClick={handleStartChat}
                  disabled={isCreatingSession || createSessionRef.current}
                  className="cursor-pointer bg-gradient-to-r from-blue-600 to-violet-800 hover:from-blue-800 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Chat Session...
                    </>
                  ) : (
                    <>💬 Start Chatting with Content</>
                  )}
                </Button>
              )}
            </div>

            {scrapedWeb.embedding_status === "completed" && (
              <p className="text-green-500 font-normal text-sm text-center">
                Content processed successfully!
              </p>
            )}

            {scrapedWeb.embedding_status === "pending" && (
              <div className="flex items-center justify-center space-x-2 text-yellow-400 text-sm">
                {/* <Loader2 className="h-4 w-4 animate-spin" /> */}
                <span>Processing embeddings... This may take a while.</span>
              </div>
            )}

            {scrapedWeb.embedding_status === "failed" && (
              <div className="flex items-center justify-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Processing failed. Please try scraping the URL again.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-700/50">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
            <Globe className="h-4 w-4 text-green-400" />
          </div>
          <h3 className="font-medium text-white mb-1">Content Analysis</h3>
          <p className="text-sm text-gray-400">
            Extract and analyze content from any website
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-700/50">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
            <CheckCircle className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="font-medium text-white mb-1">Smart Processing</h3>
          <p className="text-sm text-gray-400">
            AI understands and processes web content intelligently
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-700/50">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
            <ExternalLink className="h-4 w-4 text-purple-400" />
          </div>
          <h3 className="font-medium text-white mb-1">Easy Access</h3>
          <p className="text-sm text-gray-400">
            Simply paste any URL to get started instantly
          </p>
        </div>
      </div>

      {/* Examples Section */}
      <div className="bg-black border border-neutral-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wider">
          Example URLs you can try:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <button
            onClick={() => setUrl("https://news.ycombinator.com")}
            disabled={isLoading || scrapeRef.current}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-left text-neutral-300 hover:text-white transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Newspaper className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
            <span>Hacker News</span>
          </button>

          <button
            onClick={() => setUrl("https://www.bbc.com/news")}
            disabled={isLoading || scrapeRef.current}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-left text-neutral-300 hover:text-white transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Globe className="h-5 w-5 text-red-500 group-hover:text-red-400" />
            <span>BBC News</span>
          </button>

          <button
            onClick={() => setUrl("https://techcrunch.com")}
            disabled={isLoading || scrapeRef.current}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-left text-neutral-300 hover:text-white transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Rocket className="h-5 w-5 text-green-500 group-hover:text-green-400" />
            <span>TechCrunch</span>
          </button>

          <button
            onClick={() => setUrl("https://medium.com")}
            disabled={isLoading || scrapeRef.current}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-left text-neutral-300 hover:text-white transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PenSquare className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400" />
            <span>Medium Articles</span>
          </button>
        </div>
      </div>
    </div>
  );
}
