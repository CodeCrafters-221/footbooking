import React from "react";
import { motion } from "framer-motion";

export default function FadeIn({ children, delay = 0, direction = "up", className = "" }) {
  const directions = {
    up: { y: 30, opacity: 0 },
    down: { y: -30, opacity: 0 },
    left: { x: 30, opacity: 0 },
    right: { x: -30, opacity: 0 },
    none: { opacity: 0 },
  };

  return (
    <motion.div
      initial={directions[direction]}
      whileInView={{
        x: 0,
        y: 0,
        opacity: 1,
      }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: [0.25, 0.25, 0, 1], // ease out cubic
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
