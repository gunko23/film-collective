"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Loader2, Send, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      const showDate = shouldShowDateDivider(msg.created_at, prevMsg?.created_at)
      const isOwn = msg.user_id?.toLowerCase() === chatConfig.currentUserId?.toLowerCase()
      const showAvatar = !isOwn && (index === 0 || prevMsg?.user_id !== msg.user_id)
      return { msg, showDate, isOwn, showAvatar }
    })
  }, [messages, chatConfig.currentUserId])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={stickyInput ? { paddingBottom: 70 + keyboardOffset } : undefined}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">{emptyStateIcon}</span>
              </div>
              <p className="text-muted-foreground text-sm">{emptyStateMessage}</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map(({ msg, showDate, isOwn, showAvatar }) => (
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
                showUserName={showAvatar}
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

      {/* Input area */}
      <div
        className={cn(
          "flex-shrink-0 p-3 border-t border-border/30 bg-background",
          stickyInput && "fixed left-0 right-0 z-50"
        )}
        style={stickyInput ? { bottom: stickyInputBottomOffset + keyboardOffset } : undefined}
      >
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-end gap-2 bg-card/50 border border-border/50 rounded-2xl px-3 py-2 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
            {/* Emoji/GIF button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={cn(
                  "p-1.5 rounded-full transition-colors flex-shrink-0",
                  showPicker
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Smile className="h-5 w-5" />
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
              className="flex-1 bg-transparent text-sm text-foreground resize-none focus:outline-none min-h-[24px] max-h-24 py-1 placeholder:text-muted-foreground/50"
            />

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex-shrink-0 disabled:opacity-50"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
