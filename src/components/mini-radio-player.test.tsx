import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RadioProvider, useRadioContext } from "@/contexts/radio-context"
import { MiniRadioPlayer } from "./mini-radio-player"

function renderPlayer() {
    const view = render(<RadioProvider><MiniRadioPlayer /></RadioProvider>)
    const audio = view.container.querySelector("audio")
    if (!audio) throw new Error("Audio element missing")
    return audio
}

function OtherRadio() {
    const { setActiveRadio } = useRadioContext()
    return <button onClick={() => setActiveRadio(12345, true)}>other radio</button>
}

async function startRadio() {
    fireEvent.click(screen.getAllByRole("button", { name: "تشغيل الراديو" })[0])
    await act(async () => { await Promise.resolve() })
}

describe("MiniRadioPlayer reconnects live streams", () => {
    let play: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.useFakeTimers()
        play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
        vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
        vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("reopens a live station when its connection ends", async () => {
        const audio = renderPlayer()
        await startRadio()
        expect(play).toHaveBeenCalledTimes(1)

        fireEvent.ended(audio)
        await act(async () => { await vi.advanceTimersByTimeAsync(2000) })

        expect(play).toHaveBeenCalledTimes(2)
        expect(audio.src).toBe("https://stream.zeno.fm/ru2hqnplhk7uv")
    })

    it("waits for a real stall and cancels recovery when playback resumes", async () => {
        const audio = renderPlayer()
        await startRadio()

        fireEvent.waiting(audio)
        await act(async () => { await vi.advanceTimersByTimeAsync(10000) })
        fireEvent.playing(audio)
        await act(async () => { await vi.advanceTimersByTimeAsync(10000) })
        expect(play).toHaveBeenCalledTimes(1)

        fireEvent.stalled(audio)
        await act(async () => { await vi.advanceTimersByTimeAsync(17000) })
        expect(play).toHaveBeenCalledTimes(2)
    })

    it("recovers from an unexpected browser pause", async () => {
        const audio = renderPlayer()
        await startRadio()

        fireEvent.pause(audio)
        expect(screen.getAllByRole("button", { name: "إيقاف الراديو" })).toHaveLength(2)
        await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
        expect(play).toHaveBeenCalledTimes(2)
    })

    it("does not restart after the listener pauses or changes stations", async () => {
        const audio = renderPlayer()
        await startRadio()

        fireEvent.ended(audio)
        fireEvent.click(screen.getAllByRole("button", { name: "إيقاف الراديو" })[0])
        await act(async () => { await vi.advanceTimersByTimeAsync(12000) })
        expect(play).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getAllByRole("button", { name: "تشغيل الراديو" })[0])
        await act(async () => { await Promise.resolve() })
        fireEvent.ended(audio)
        fireEvent.click(screen.getAllByRole("button", { name: "المنشاوي" })[0])
        fireEvent.pause(audio)
        await act(async () => { await vi.advanceTimersByTimeAsync(12000) })
        expect(play).toHaveBeenCalledTimes(3)
        expect(audio.src).toBe("https://radio.alhuwayni.com/listen/alminshawi/radio.mp3")
    })

    it("cancels recovery when another radio takes over", async () => {
        const view = render(
            <RadioProvider>
                <MiniRadioPlayer />
                <OtherRadio />
            </RadioProvider>,
        )
        const audio = view.container.querySelector("audio")
        if (!audio) throw new Error("Audio element missing")
        await startRadio()

        fireEvent.ended(audio)
        fireEvent.click(screen.getByRole("button", { name: "other radio" }))
        await act(async () => { await vi.advanceTimersByTimeAsync(12000) })
        expect(play).toHaveBeenCalledTimes(1)
    })

    it("asks for another tap when the browser blocks playback", async () => {
        play.mockRejectedValueOnce(new DOMException("blocked", "NotAllowedError"))
        renderPlayer()
        await startRadio()

        expect(screen.getByText("اضغط للتشغيل مجددًا")).toBeInTheDocument()
        await act(async () => { await vi.advanceTimersByTimeAsync(12000) })
        expect(play).toHaveBeenCalledTimes(1)

        await startRadio()
        expect(play).toHaveBeenCalledTimes(2)
    })

    it("stops retrying after repeated connection failures", async () => {
        play.mockRejectedValue(new Error("network"))
        renderPlayer()
        await startRadio()

        await act(async () => { await vi.advanceTimersByTimeAsync(40000) })
        expect(play).toHaveBeenCalledTimes(6)
        expect(screen.getByText("تعذر إعادة الاتصال بالراديو، اضغط للتشغيل مجددًا")).toBeInTheDocument()
        expect(screen.getAllByRole("button", { name: "تشغيل الراديو" })).toHaveLength(2)
    })

    it("lets the lock screen pause cancel a pending reconnect", async () => {
        const audio = renderPlayer()
        await startRadio()
        fireEvent.ended(audio)

        const calls = vi.mocked(navigator.mediaSession.setActionHandler).mock.calls
        const pause = [...calls].reverse().find(([action, handler]) => action === "pause" && handler)?.[1]
        expect(pause).toBeTypeOf("function")
        act(() => { pause?.({ action: "pause" }) })

        await act(async () => { await vi.advanceTimersByTimeAsync(12000) })
        expect(play).toHaveBeenCalledTimes(1)
        expect(screen.getAllByRole("button", { name: "تشغيل الراديو" })).toHaveLength(2)
    })
})
