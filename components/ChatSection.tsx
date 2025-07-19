"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface ChatSectionProps {
  fileName: string
  className?: string
}

export default function ChatSection({ fileName, className = "" }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: `Hello! I'm ready to help you analyze "${fileName}". You can ask me questions about the content, request summaries, or explore specific topics within the document.`,
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on the document analysis, I can see that this section discusses key concepts and methodologies. The content provides comprehensive insights into the topic you're asking about.",
        "I've analyzed the relevant sections of the PDF and found detailed information that directly addresses your question. Here are the main points from the document.",
        "According to the document content, there are several important aspects to consider. Let me break down the key findings for you.",
        "The PDF contains valuable information on this topic. I've identified the most relevant sections that provide answers to your query.",
        "After reviewing the document, I can provide you with specific details and context from the content that relates to your question.",
      ]

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }

      setMessages((prev) => prev.slice(0, -1).concat(assistantMessage))
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={`h-full bg-black flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">AI Assistant</h2>
            <p className="text-xs text-gray-400">Ready to analyze your document</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 bg-gray-200/10 px-2 py-1 rounded">{messages.length} messages</div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex max-w-[80%] ${
                message.type === "user" ? "flex-row-reverse" : "flex-row"
              } items-start space-x-2`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === "user" ? "bg-gradient-to-br from-blue-500 to-violet-600 ml-2" : "bg-gray-700 mr-2"
                }`}
              >
                {message.type === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-blue-400" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`rounded-lg px-3 py-2 ${
                  message.type === "user"
                    ? "max-w-[500px] flex-wrap bg-gradient-to-br from-blue-500 to-violet-600 text-white"
                    : "bg-gray-200/10 text-white border border-gray-200/20"
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-gray-400 text-sm">Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={`text-xs mt-1 ${message.type === "user" ? "text-white/70" : "text-gray-400"}`}>
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

      {/* Input Area */}
      <div className="px-4 py-5 border rounded-xl border-gray-200/20 bg-gray-500/10">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the PDF..."
              className="bg-gray-200/10 border-gray-600 px-4 py-5 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
              disabled={isTyping}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:from-blue-600 hover:to-violet-700 px-4"
          >
            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-xs text-gray-400 mt-2">Press Enter to send • Shift+Enter for new line</div>
      </div>
    </div>
  )
}
