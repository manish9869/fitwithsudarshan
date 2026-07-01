import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
    const [visible, setVisible] = useState(false);
    const [clicking, setClicking] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(true); // assume touch until confirmed otherwise — avoids a flash of cursor-none styling on mobile before the check runs

    // Dot follows mouse exactly — no spring lag
    const dotX = useMotionValue(-200);
    const dotY = useMotionValue(-200);

    // Ring trails slightly behind — but much snappier than before
    const ringX = useSpring(dotX, { damping: 30, stiffness: 900, mass: 0.25 });
    const ringY = useSpring(dotY, { damping: 30, stiffness: 900, mass: 0.25 });

    // Tracks whether we're currently over a hoverable element, without
    // calling closest() on every mousemove — only re-checks when the
    // element under the pointer actually changes.
    const lastTargetRef = useRef(null);

    useEffect(() => {
        const touch = window.matchMedia("(hover: none)").matches;
        setIsTouchDevice(touch);
        if (touch) return; // no listeners at all on touch devices

        const onMove = (e) => {
            dotX.set(e.clientX);
            dotY.set(e.clientY);
            setVisible(true);

            // Cheap hover-target check piggybacked on the existing
            // mousemove listener instead of a second document-wide
            // "mouseover" listener.
            const target = e.target;
            if (target !== lastTargetRef.current) {
                lastTargetRef.current = target;
                const el = target.closest?.("a, button, [data-cursor-hover]");
                setHovering(!!el);
            }
        };
        const onDown = () => setClicking(true);
        const onUp = () => setClicking(false);
        const onLeave = () => setVisible(false);
        const onEnter = () => setVisible(true);

        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup", onUp);
        document.addEventListener("mouseleave", onLeave);
        document.addEventListener("mouseenter", onEnter);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("mouseup", onUp);
            document.removeEventListener("mouseleave", onLeave);
            document.removeEventListener("mouseenter", onEnter);
        };
    }, []);

    if (isTouchDevice) return null;

    const baseStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        translateX: "-50%",
        translateY: "-50%",
        pointerEvents: "none",
        zIndex: 2147483647,
        borderRadius: "50%",
        willChange: "transform",
    };

    return (
        <>
            {/* Outer ring — slightly trails */}
            <motion.div
                style={{
                    ...baseStyle,
                    x: ringX,
                    y: ringY,
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.15s",
                }}
                animate={{
                    width: hovering ? 42 : clicking ? 20 : 30,
                    height: hovering ? 42 : clicking ? 20 : 30,
                    border: hovering
                        ? "1.5px solid rgba(231,23,99,1)"
                        : "1.5px solid rgba(231,23,99,0.6)",
                    backgroundColor: hovering ? "rgba(231,23,99,0.1)" : "transparent",
                    boxShadow: hovering
                        ? "0 0 20px rgba(231,23,99,0.8), 0 0 45px rgba(231,23,99,0.3)"
                        : "0 0 8px rgba(231,23,99,0.3)",
                }}
                transition={{ duration: 0.15, ease: "easeOut" }}
            />

            {/* Inner dot — perfectly instant, no lag */}
            <motion.div
                style={{
                    ...baseStyle,
                    x: dotX,
                    y: dotY,
                    background: "#e71763",
                    boxShadow: "0 0 8px rgba(231,23,99,1), 0 0 20px rgba(231,23,99,0.6)",
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.1s",
                }}
                animate={{
                    width: clicking ? 3 : hovering ? 8 : 5,
                    height: clicking ? 3 : hovering ? 8 : 5,
                }}
                transition={{ duration: 0.1 }}
            />
        </>
    );
}
