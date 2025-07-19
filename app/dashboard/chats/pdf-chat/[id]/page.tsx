"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { GripVertical } from "lucide-react"
import PdfViewer from "@/components/PDFviewer"
import ChatSection from "@/components/ChatSection"


interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface PdfChatPageProps {
  pdfUrl: string
  fileName?: string
  className?: string
}

export default function PdfChatPage({
  pdfUrl = "https://kkajgncsukeerjmabxkk.supabase.co/storage/v1/object/sign/nova-pdfs/pdfs/00110f05-2284-44d8-ae5d-5dafa5bd74e7/6ed35249-c629-441c-9f73-a7b5949e8a11.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mNTA1MmQyMy0wMTFhLTQ4NDMtYjQ3Yi1jZGI2NzVkZjVhZDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJub3ZhLXBkZnMvcGRmcy8wMDExMGYwNS0yMjg0LTQ0ZDgtYWU1ZC01ZGFmYTViZDc0ZTcvNmVkMzUyNDktYzYyOS00NDFjLTlmNzMtYTdiNTk0OWU4YTExLnBkZiIsImlhdCI6MTc1MjkwMzcwMywiZXhwIjoxNzUzNTA4NTAzfQ.8CaPOeGIdzsMwlwdncinkuZF-aZim9RCyWAzFPR4Hw8",
  fileName = "Python Data Science Handbook.pdf",
  className = "",
}: PdfChatPageProps) {
  const [leftWidth, setLeftWidth] = useState(40)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      const constrainedWidth = Math.min(Math.max(newLeftWidth, 30), 70)
      setLeftWidth(constrainedWidth)
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div className={`h-screen w-full bg-black text-white flex overflow-hidden ${className}`}>
      <div ref={containerRef} className="flex w-full h-full">
        {/* PDF Viewer */}
        <div style={{ width: `${leftWidth}%` }} className="h-full">
          <PdfViewer pdfUrl={pdfUrl} fileName={fileName} />
        </div>

        {/* Resizer */}
        <div
          className={`w-1 bg-black hover:bg-blue-500 cursor-col-resize transition-colors duration-200 relative flex items-center justify-center ${
            isResizing ? "bg-gradient-to-b from-blue-600 to-violet-600" : ""
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -inset-x-1 flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Chat Section */}
        <div style={{ width: `${100 - leftWidth}%` }} className="h-full">
          <ChatSection fileName={fileName} />
        </div>
      </div>
    </div>
  )
}
