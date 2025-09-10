"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const NOUNS = [
  "academy",
  "school",
  "organization",
  "camp",
  "charity",
  "club",
  "program",
  "team"
]

export function HeroRotator() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % NOUNS.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <h1 className="text-h1 text-center text-foreground leading-tight">
      We match your{" "}
      <span className="relative inline-block min-w-[200px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-primary inline-block"
          >
            {NOUNS[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </span>
      <br />
      with vetted coaches.
    </h1>
  )
}
