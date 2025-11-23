"use client"

import * as React from "react"

type TasbihButton = {
    id: string
    text: string
}

export function TasbihCircle() {
    // All 6 buttons in one array
    const allButtons: TasbihButton[] = [
        { id: "subhan", text: "سبحان الله" },
        { id: "hamd", text: "الحمد لله" },
        { id: "akbar", text: "الله أكبر" },
        { id: "tahlil", text: "لا إله إلا الله" },
        { id: "lahawla", text: "لا حول ولا قوة إلا بالله" },
        { id: "istighfar", text: "استغفر الله" },
    ]

    const [buttons, setButtons] = React.useState<TasbihButton[]>(allButtons)
    const [clickCount, setClickCount] = React.useState(0)
    const [isPressed, setIsPressed] = React.useState(false)
    const [allCompleted, setAllCompleted] = React.useState(false)
    const [completedDhikrs, setCompletedDhikrs] = React.useState<string[]>([])

    const TARGET = 3 // 3 total clicks
    const selectedDhikr = buttons[0].id // Always the first button

    const handleRotateButtons = () => {
        // Move first button to the end (rotation)
        setButtons((prev) => {
            const [first, ...rest] = prev
            return [...rest, first]
        })
        // Reset counter when rotating
        setClickCount(0)
        // Do NOT reset completed dhikrs here, so we can track progress of all 6
    }

    const handleCircleClick = () => {
        if (clickCount >= TARGET || completedDhikrs.includes(selectedDhikr)) return

        // Animation
        setIsPressed(true)
        setTimeout(() => setIsPressed(false), 200)

        // Vibration on each click (always enabled)
        if (navigator.vibrate) navigator.vibrate(50)

        const newCount = clickCount + 1

        if (newCount >= TARGET) {
            // Completed this dhikr
            setClickCount(TARGET)

            // Strong vibration on completion (always enabled)
            if (navigator.vibrate) navigator.vibrate([100, 50, 100])

            // Mark as completed
            const newCompleted = [...completedDhikrs, selectedDhikr]
            setCompletedDhikrs(newCompleted)

            // Auto-rotate to next dhikr after 500ms
            setTimeout(() => {
                if (newCompleted.length >= 6) {
                    // All 6 completed
                    setAllCompleted(true)
                } else {
                    // Rotate to next dhikr
                    handleRotateButtons()
                }
            }, 500)
        } else {
            setClickCount(newCount)
        }
    }

    const handleReset = () => {
        setClickCount(0)
        setAllCompleted(false)
        setButtons(allButtons) // Reset to original order
        setCompletedDhikrs([])
    }

    const selectedButton = buttons[0] // Always the first button

    return (
        <div className="col-12">
            <style jsx>{`
        .tasbih-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) scale(1); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) scale(0.95); }
          20%, 40%, 60%, 80% { transform: translateX(4px) scale(0.95); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        
        .circle-shake {
          animation: shake 0.4s ease-in-out, pulse 0.4s ease-in-out;
        }

        /* Main Integrated Circle */
        .main-circle {
            width: 220px;
            height: 220px;
            position: relative;
            cursor: pointer;
            user-select: none;
            touch-action: manipulation;
            border-radius: 50%;
            background-color: transparent;
            box-shadow: none !important;
            transition: all 0.3s ease;
            margin-bottom: 1rem;
        }
        
        .main-circle:active {
            transform: scale(0.95);
        }

        @media (max-width: 768px) {
          .tasbih-container {
            gap: 1rem;
          }
        }

        @media (max-width: 576px) {
            .main-circle {
                width: 180px;
                height: 180px;
            }
        }

        @media (max-width: 360px) {
            .main-circle {
                width: 160px;
                height: 160px;
            }
        }
      `}</style>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                {/* Header */}
                <div className="gradient-bg text-white p-3 text-center">
                    <h4 className="mb-0 d-flex align-items-center justify-content-center gap-2">
                        <i className="fas fa-dharmachakra"></i>
                        <span>حلقة تسبيح</span>
                    </h4>
                </div>

                {/* Content */}
                <div className="card-body p-4">
                    {!allCompleted ? (
                        <div className="tasbih-container">
                            {/* Buttons Column - Always Left */}
                            <div style={{ minWidth: "160px", position: "relative" }}>
                                {/* Rotation button in corner */}
                                <button
                                    type="button"
                                    onClick={handleRotateButtons}
                                    className="btn btn-sm btn-outline-secondary rounded-circle"
                                    style={{
                                        position: "absolute",
                                        top: "-35px",
                                        right: "-10px",
                                        width: "32px",
                                        height: "32px",
                                        padding: "0",
                                        zIndex: 10,
                                        transition: "all 0.3s ease",
                                    }}
                                    title="تدوير الأذكار"
                                >
                                    <i className="fas fa-arrow-rotate-right" style={{ fontSize: "0.75rem" }}></i>
                                </button>

                                <div className="d-flex flex-column gap-2">
                                    {buttons.slice(0, 3).map((button, index) => (
                                        <div
                                            key={button.id}
                                            className={`btn rounded-pill ${index === 0
                                                ? "gradient-bg text-white"
                                                : completedDhikrs.includes(button.id)
                                                    ? "btn-success"
                                                    : "btn-outline-secondary"
                                                }`}
                                            style={{
                                                transition: "all 0.3s ease",
                                                fontSize: "0.85rem",
                                                fontWeight: "600",
                                                padding: "0.4rem 1.2rem",
                                                opacity: completedDhikrs.includes(button.id) ? 0.6 : 1,
                                                cursor: "default",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {button.text}
                                            {completedDhikrs.includes(button.id) && <i className="fas fa-check ms-2"></i>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Circle with 3-segment Progress Border */}
                            {/* Circle with 3-segment Progress Border */}

                            {/* Integrated Circle with SVG Border */}


                            <div
                                onClick={handleCircleClick}
                                className={`main-circle d-flex align-items-center justify-content-center ${isPressed ? "circle-shake" : ""}`}
                            >
                                {/* SVG Border */}
                                <svg
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        pointerEvents: "none",
                                        zIndex: 1
                                    }}
                                    viewBox="0 0 220 220"
                                    preserveAspectRatio="xMidYMid meet"
                                >
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#7d9d7f" />
                                            <stop offset="100%" stopColor="#d4a574" />
                                        </linearGradient>
                                    </defs>

                                    {/* Base Arc Segments - Three separate arcs with gaps */}
                                    {[0, 1, 2].map((segmentIndex) => {
                                        const radius = 105
                                        const centerX = 110
                                        const centerY = 110

                                        // Each arc is 100 degrees with 20 degree gaps
                                        const arcAngle = 100
                                        const gapAngle = 20
                                        const startAngle = -90 + segmentIndex * (arcAngle + gapAngle)
                                        const endAngle = startAngle + arcAngle

                                        const startRad = (startAngle * Math.PI) / 180
                                        const endRad = (endAngle * Math.PI) / 180

                                        const x1 = centerX + radius * Math.cos(startRad)
                                        const y1 = centerY + radius * Math.sin(startRad)
                                        const x2 = centerX + radius * Math.cos(endRad)
                                        const y2 = centerY + radius * Math.sin(endRad)

                                        return (
                                            <path
                                                key={`base-${segmentIndex}`}
                                                d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
                                                fill="none"
                                                stroke="#e0e0e0"
                                                strokeWidth="8"
                                                opacity="0.3"
                                                strokeLinecap="round"
                                            />
                                        )
                                    })}

                                    {/* Progress Segments - Fill in as clicked */}
                                    {[0, 1, 2].map((segmentIndex) => {
                                        if (clickCount <= segmentIndex) return null

                                        const radius = 105
                                        const centerX = 110
                                        const centerY = 110

                                        // Match the base arc dimensions
                                        const arcAngle = 100
                                        const gapAngle = 20
                                        const startAngle = -90 + segmentIndex * (arcAngle + gapAngle)
                                        const endAngle = startAngle + arcAngle

                                        const startRad = (startAngle * Math.PI) / 180
                                        const endRad = (endAngle * Math.PI) / 180

                                        const x1 = centerX + radius * Math.cos(startRad)
                                        const y1 = centerY + radius * Math.sin(startRad)
                                        const x2 = centerX + radius * Math.cos(endRad)
                                        const y2 = centerY + radius * Math.sin(endRad)

                                        return (
                                            <path
                                                key={`progress-${segmentIndex}`}
                                                d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
                                                fill="none"
                                                stroke="url(#progressGradient)"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                style={{ transition: "all 0.3s ease" }}
                                            />
                                        )
                                    })}
                                </svg>

                                {/* Text Content */}
                                <span className="h4 text-center px-4 fw-bold gradient-text position-relative" style={{ zIndex: 2 }}>
                                    {selectedButton?.text}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Completion Message */}
                            <div className="text-center py-5">
                                <h2 className="mb-5 gradient-text fw-bold" style={{ fontSize: "2.5rem" }}>تم بحمد الله</h2>
                                <br />

                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="btn btn-lg gradient-bg text-white rounded-pill px-5 py-3"
                                >
                                    <i className="fas fa-rotate-right me-2"></i>
                                    أعد التسبيح
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
