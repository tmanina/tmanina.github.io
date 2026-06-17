"use client"

import React from "react"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-neutral-900 text-white/50 mt-auto py-3 border-t border-white/10">
      <div className="w-full">
        <div className="text-center">
          <small>
            <i className="fas fa-copyright ms-1"></i>
            {year} Copyright to{" "}
            <strong className="text-white">M.S</strong>

            <span className="mx-2">|</span>

            <i className="fas fa-code me-1"></i>
            Developed by{" "}
            <strong className="text-white">M.S</strong>
          </small>
        </div>
      </div>
    </footer>
  )
}
