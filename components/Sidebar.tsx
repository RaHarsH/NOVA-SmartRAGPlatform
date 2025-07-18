"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BarChart3,
  Globe,
  Database,
  MessageSquarePlus,
  History,
  Settings,
  ChevronLeft,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface ChatItem {
  id: string;
  title: string;
  type: "pdf" | "csv" | "web" | "multi";
  timestamp: string;
  isActive?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  // const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>("chat-1");

  const { isSignedIn, user, isLoaded } = useUser();

  const chatHistory: ChatItem[] = [
    {
      id: "chat-1",
      title: "Financial Report Analysis",
      type: "pdf",
      timestamp: "2 hours ago",
      isActive: true,
    },
    {
      id: "chat-2",
      title: "Sales Data Trends",
      type: "csv",
      timestamp: "1 day ago",
    },
    {
      id: "chat-3",
      title: "Company Website Analysis",
      type: "web",
      timestamp: "2 days ago",
    },
    {
      id: "chat-4",
      title: "Multi-Source Research",
      type: "multi",
      timestamp: "3 days ago",
    },
    {
      id: "chat-5",
      title: "Product Documentation",
      type: "pdf",
      timestamp: "1 week ago",
    },
    {
      id: "chat-6",
      title: "Market Analysis Report",
      type: "csv",
      timestamp: "1 week ago",
    },
    {
      id: "chat-7",
      title: "Competitor Analysis",
      type: "web",
      timestamp: "2 weeks ago",
    },
    {
      id: "chat-8",
      title: "Customer Survey Data",
      type: "csv",
      timestamp: "2 weeks ago",
    },
    {
      id: "chat-9",
      title: "Technical Documentation",
      type: "pdf",
      timestamp: "3 weeks ago",
    },
    {
      id: "chat-10",
      title: "Market Research Report",
      type: "multi",
      timestamp: "1 month ago",
    },
  ];

  const features = [
    {
      id: "pdf",
      name: "PDF",
      icon: FileText,
      color: "text-blue-400",
      hoverColor: "hover:bg-cyan-400/10 hover:border-cyan-400/30",
      description: "Chat with PDF documents",
      goTo: "pdf-chat",
    },
    {
      id: "csv",
      name: "CSV",
      icon: BarChart3,
      color: "text-violet-400",
      hoverColor: "hover:bg-violet-400/10 hover:border-violet-400/30",
      description: "Analyze CSV data",
      goTo: "csv-chat",
    },
    {
      id: "web",
      name: "Web",
      icon: Globe,
      color: "text-blue-400",
      hoverColor: "hover:bg-cyan-400/10 hover:border-cyan-400/30",
      description: "Scrape and analyze websites",
      goTo: "web-chat",
    },
    {
      id: "multi",
      name: "Multi",
      icon: Database,
      color: "text-violet-400",
      hoverColor: "hover:bg-violet-400/10 hover:border-violet-400/30",
      description: "Integrate multiple sources",
      goTo: "multiple-sources-chat",
    },
  ];

  const getTypeIcon = (type: ChatItem["type"]) => {
    switch (type) {
      case "pdf":
        return FileText;
      case "csv":
        return BarChart3;
      case "web":
        return Globe;
      case "multi":
        return Database;
      default:
        return MessageSquarePlus;
    }
  };

  const getTypeColor = (type: ChatItem["type"]) => {
    switch (type) {
      case "pdf":
        return "text-blue-400";
      case "csv":
        return "text-violet-400";
      case "web":
        return "text-blue-400";
      case "multi":
        return "text-violet-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: isCollapsed ? "4rem" : "16rem",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed left-0 top-0 h-screen bg-black/95 backdrop-blur-xl border-r border-white/10 z-40 flex flex-col`}
    >
      {/* logo of the sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 min-h-[4rem] flex-shrink-0">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="flex items-center space-x-2 font-bold">
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-800 shadow-md">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 opacity-50 blur-sm"></div>
                </div>
                <span className="tracking-widest text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-500 to-white">
                  NOVA
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center w-full"
          >
            {/* when the sidebar is collapsed logo is used for toggling */}
            <div
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="cursor-pointer relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-800 shadow-md"
            >
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 opacity-50 blur-sm"></div>
            </div>
          </motion.div>
        )}

        {/* When sidebar is expanded arrow left button can be used for toggling */}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="cursor-pointer p-2 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className={`p-3 flex-shrink-0 ${isCollapsed ? "px-2" : ""}`}>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              New Chat
            </motion.h3>
          )}
        </AnimatePresence>

        <div
          className={`grid gap-2 ${
            isCollapsed ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`flex items-center ${
                  isCollapsed ? "justify-center p-2" : "space-x-2 p-2"
                } rounded-lg cursor-pointer bg-white/5 transition-all duration-200 ${
                  feature.hoverColor
                } group`}
                title={
                  isCollapsed
                    ? `${feature.name} - ${feature.description}`
                    : feature.description
                }
              >
                <Link
                  href={`/dashboard/chats/${feature.goTo}`}
                  className="flex justify-center items-center space-x-4 w-full"
                >
                  <Icon
                    className={`h-4 w-4 ${feature.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                  />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-medium text-white truncate"
                      >
                        {feature.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Chat History */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col min-h-0 p-3"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between mb-3"
            >
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Chat History
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <History className="h-4 w-4" />
              </Button>
            </motion.div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {chatHistory.map((chat, index) => {
                const Icon = getTypeIcon(chat.type);
                const isActive = activeChat === chat.id;

                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`chat-item group cursor-pointer p-2.5 rounded-lg border transition-all duration-200 ${
                      isActive
                        ? "bg-white/10 border-cyan-400/30 text-white"
                        : "border-transparent hover:bg-white/5 hover:border-white/10"
                    }`}
                    onClick={() => setActiveChat(chat.id)}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`h-3.5 w-3.5 ${getTypeColor(
                          chat.type
                        )} flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate leading-tight">
                          {chat.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {chat.timestamp}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed state chat history: This is kept blank in order to reserve space */}
      {isCollapsed && (
        <div className="flex-1 flex items-center justify-center p-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400"
          ></motion.div>
        </div>
      )}

      {/* Bottom Section - Profile & Settings */}
      <div
        className={`p-3 border-t border-white/10 space-y-2 flex-shrink-0 ${
          isCollapsed ? "px-2" : ""
        }`}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center p-2" : "space-x-3 p-2.5"
          } rounded-lg hover:bg-white/10 transition-all duration-200 group`}
          title={isCollapsed ? "Profile - John Doe" : undefined}
        >
          <SignedIn>
            <UserButton />
          </SignedIn>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 text-left"
              >
                <div className="text-sm font-medium text-white">
                  {user?.fullName}
                </div>
                <div className="text-xs text-gray-400">
                  {user?.emailAddresses[0].emailAddress.slice(0, 20)}...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center p-2" : "space-x-3 p-2.5"
          } rounded-lg hover:bg-white/10 transition-all duration-200 group`}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium text-white"
              >
                Settings
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
