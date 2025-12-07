"use client"

import { useEffect, useState } from "react"
import { Film, Star, Clapperboard, Popcorn, Ticket, Heart, Sparkles, Play } from "lucide-react"

const icons = [Film, Star, Clapperboard, Popcorn, Ticket, Heart, Sparkles, Play]

interface FloatingElement {
  id: number
  Icon: typeof Film
  x: number
  y: number
  delay: number
  duration: number
  size: number
  opacity: number
}

export function FloatingElements() {
  const [elements, setElements] = useState<FloatingElement[]>([])

  useEffect(() => {
    const newElements: FloatingElement[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      Icon: icons[i % icons.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      size: 16 + Math.random() * 24,
      opacity: 0.1 + Math.random() * 0.15,
    }))
    setElements(newElements)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute animate-float"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
          }}
        >
          <element.Icon
            style={{
              width: element.size,
              height: element.size,
              opacity: element.opacity,
            }}
            className="text-accent"
          />
        </div>
      ))}
    </div>
  )
}
