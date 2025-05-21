"use client"

import { motion } from "framer-motion"

export default function LoadingAnimation() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 bg-green-500 rounded-full"
            animate={{
              y: ["0%", "-100%", "0%"],
            }}
            transition={{
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}
