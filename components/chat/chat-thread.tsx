"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Loader2, Send, Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat, type ChatConfig } from "@/hooks/use-chat"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { DateDivider, shouldShowDateDivider } from "@/components/chat/date-divider"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { MessageBubble } from "@/components/chat/message-bubble"
import { EmojiGifPicker } from "@/components/chat/emoji-gif-picker"

interface ChatThreadProps {
  chatConfig: ChatConfig
  inputPlaceholder?: string
  emptyStateMessage?: string
  emptyStateIcon?: string
  pickerVariant?: "popover" | "inline"
  avatarLink?: (userId: string) => string
  reactionEmojis?: string[]
  stickyInput?: boolean
  stickyInputBottomOffset?: number
}

export function ChatThread({
  chatConfig,
  inputPlaceholder = "Message",
  emptyStateMessage = "No messages yet",
  emptyStateIcon = "💬",
  pickerVariant = "popover",
  avatarLink,
  reactionEmojis,
  stickyInput = false,
  stickyInputBottomOffset = 0,
}: ChatThreadProps) {
  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    sendGif,
    toggleReaction,
    typingUsers,
    extendTyping,
    stopTyping,
    setOnNewMessage,
  } = useChat(chatConfig)

  const { containerRef, bottomRef, handleScroll, scrollToBottom, scrollIfNeeded, shouldAutoScrollRef } = useAutoScroll()

  const [newMessage, setNewMessage] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Track visual viewport to position sticky input above the mobile keyboard
  useEffect(() => {
    if (!stickyInput || typeof window === "undefined" || !window.visualViewport) return

    const vv = window.visualViewport
    const onViewportChange = () => {
      const bottom = window.innerHeight - (vv.offsetTop + vv.height)
      setKeyboardOffset(Math.max(0, bottom))
    }

    vv.addEventListener("resize", onViewportChange)
    vv.addEventListener("scroll", onViewportChange)
    return () => {
      vv.removeEventListener("resize", onViewportChange)
      vv.removeEventListener("scroll", onViewportChange)
    }
  }, [stickyInput])

  // Scroll to bottom when mobile keyboard opens so latest messages stay visible
  useEffect(() => {
    if (keyboardOffset > 0) {
      scrollToBottom()
    }
  }, [keyboardOffset, scrollToBottom])

  // Wire up auto-scroll on new message
  useEffect(() => {
    setOnNewMessage(() => {
      scrollToBottom()
    })
  }, [setOnNewMessage, scrollToBottom])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollIfNeeded()
  }, [messages, scrollIfNeeded])

  // Initial scroll to bottom (using container scroll, not scrollIntoView which affects parents)
  const hasInitiallyScrolled = useRef(false)
  useEffect(() => {
    if (!hasInitiallyScrolled.current && messages.length > 0 && !isLoading) {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
      hasInitiallyScrolled.current = true
    }
  }, [messages.length, isLoading, containerRef])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"
    extendTyping()
  }, [extendTyping])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const content = newMessage.trim()
    setNewMessage("")
    if (inputRef.current) inputRef.current.style.height = "auto"

    // Re-focus input to keep mobile keyboard open
    inputRef.current?.focus()

    await sendMessage(content)
  }, [newMessage, isSending, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])

  const handleEmojiSelect = useCallback((emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    if (pickerVariant === "popover") setShowPicker(false)
    inputRef.current?.focus()
  }, [pickerVariant])

  const handleGifSelect = useCallback(async (url: string) => {
    setShowPicker(false)
    await sendGif(url)
  }, [sendGif])

  const groupedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const prevMsg = messages[index - 1]
      const nextMsg = messages[index + 1]
      const showDate = shouldShowDateDivider(msg.created_at, prevMsg?.created_at)
      const isOwn = msg.user_id?.toLowerCase() === chatConfig.currentUserId?.toLowerCase()
      const showAvatar = !isOwn && (index === 0 || prevMsg?.user_id !== msg.user_id || showDate)
      const isGroupStart = !prevMsg || prevMsg.user_id !== msg.user_id || showDate
      const isGroupEnd = !nextMsg || nextMsg.user_id !== msg.user_id || shouldShowDateDivider(nextMsg.created_at, msg.created_at)
      return { msg, showDate, isOwn, showAvatar, isGroupStart, isGroupEnd }
    })
  }, [messages, chatConfig.currentUserId])

  const hasText = newMessage.trim().length > 0

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#6b6358" }} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{
          padding: "16px 24px",
          ...(stickyInput ? { paddingBottom: 70 + keyboardOffset } : {}),
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(107, 99, 88, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#6b6358" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 13, color: "#6b6358" }}>{emptyStateMessage}</p>
              <p style={{ fontSize: 11, color: "rgba(107, 99, 88, 0.5)", marginTop: 4 }}>Start the conversation!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map(({ msg, showDate, isOwn, showAvatar, isGroupStart, isGroupEnd }) => (
            <div key={msg.id}>
              {showDate && <DateDivider dateString={msg.created_at} />}
              <MessageBubble
                id={msg.id}
                content={msg.content}
                gifUrl={msg.gif_url}
                userId={msg.user_id}
                userName={msg.user_name}
                userAvatar={msg.user_avatar}
                createdAt={msg.created_at}
                isOptimistic={msg.isOptimistic}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showUserName={isGroupStart && !isOwn}
                isGroupStart={isGroupStart}
                isGroupEnd={isGroupEnd}
                reactions={msg.reactions || []}
                currentUserId={chatConfig.currentUserId}
                onReactionToggle={toggleReaction}
                avatarLink={avatarLink}
                reactionEmojis={reactionEmojis}
              />
            </div>
          ))
        )}

        <TypingIndicator
          typingUsers={typingUsers}
          currentUserId={chatConfig.currentUserId}
        />

        <div ref={bottomRef} />
      </div>

      {/* Inline picker (shown above the input) */}
      {pickerVariant === "inline" && (
        <EmojiGifPicker
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          onEmojiSelect={handleEmojiSelect}
          onGifSelect={handleGifSelect}
          variant="inline"
        />
      )}

      {/* Input area — Soulframe capsule style */}
      <div
        className={cn(
          "flex-shrink-0",
          stickyInput && "fixed left-0 right-0 z-50"
        )}
        style={{
          padding: "12px 24px 16px",
          borderTop: "1px solid rgba(107, 99, 88, 0.04)",
          background: "rgba(15, 13, 11, 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          ...(stickyInput ? { bottom: stickyInputBottomOffset + keyboardOffset } : {}),
        }}
      >
        <form onSubmit={handleSubmit} className="w-full">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 24,
              background: "#1a1714",
              border: "1px solid rgba(107, 99, 88, 0.06)",
              transition: "border-color 0.2s ease",
            }}
          >
            {/* Emoji/GIF button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                style={{
                  padding: 4,
                  borderRadius: "50%",
                  background: showPicker ? "rgba(61, 90, 150, 0.12)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s ease",
                }}
              >
                <Smile
                  className="h-5 w-5"
                  style={{ color: showPicker ? "#5a7cb8" : "#6b6358" }}
                />
              </button>

              {/* Popover picker (rendered inside the relative wrapper) */}
              {pickerVariant === "popover" && (
                <EmojiGifPicker
                  isOpen={showPicker}
                  onClose={() => setShowPicker(false)}
                  onEmojiSelect={handleEmojiSelect}
                  onGifSelect={handleGifSelect}
                  variant="popover"
                />
              )}
            </div>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              rows={1}
              className="flex-1 resize-none focus:outline-none min-h-[24px] max-h-24 py-1"
              style={{
                background: "transparent",
                fontSize: 14,
                color: "#e8e2d6",
                border: "none",
              }}
            />

            {/* Send button — orange gradient when text present */}
            <button
              type="submit"
              disabled={!hasText || isSending}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: hasText
                  ? "linear-gradient(135deg, #ff6b2d, #ff8f5e)"
                  : "rgba(107, 99, 88, 0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: hasText ? "pointer" : "default",
                border: "none",
                flexShrink: 0,
                transition: "all 0.3s ease",
              }}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#6b6358" }} />
              ) : (
                <Send
                  className="h-[15px] w-[15px]"
                  style={{
                    color: hasText ? "#0f0d0b" : "rgba(107, 99, 88, 0.3)",
                    marginLeft: 1,
                  }}
                />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
