/**
 * @file passWheel.ts
 * Forwards WheelEvents from drei Html overlays back to the R3F canvas.
 *
 * drei `<Html>` elements with `pointer-events: auto` intercept native wheel
 * events, which prevents the canvas zoom/scroll handler from receiving them.
 * Calling `passWheel` in an `onWheel` handler re-dispatches the event on the
 * canvas so zoom and horizontal scroll continue to work normally.
 *
 * The loose structural type (rather than `React.WheelEvent`) allows the same
 * function to be attached to both React `onWheel` props and drei's `onWheel`
 * prop, which forwards the native `WheelEvent` at runtime even though the
 * drei TypeScript types declare it as `ThreeEvent<WheelEvent>`.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WheelLike = {
  currentTarget: any
  deltaX: number; deltaY: number; deltaZ: number; deltaMode: number
  ctrlKey: boolean; shiftKey: boolean; altKey: boolean; metaKey: boolean
  clientX: number; clientY: number
}

/**
 * Re-dispatches a wheel event on the R3F canvas element so that the canvas's
 * native `wheel` listener (zoom + scroll) receives it even when the event
 * originated inside a drei Html overlay.
 */
export function passWheel(e: WheelLike): void {
  const doc = (e.currentTarget as any)?.ownerDocument ?? document
  const canvas = doc.querySelector('.tab-r3f-canvas-area canvas') as HTMLElement | null
  if (!canvas) return
  canvas.dispatchEvent(new WheelEvent('wheel', {
    deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ, deltaMode: e.deltaMode,
    ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey,
    clientX: e.clientX, clientY: e.clientY,
    bubbles: true, cancelable: true,
  }))
}
