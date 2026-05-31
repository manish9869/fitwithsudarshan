import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Menu, X } from "lucide-react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"

const navItems = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Programs", href: "#programs" },
    { name: "Transformations", href: "#transformations" },
    { name: "Tools", href: "#tools" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
    { name: "Blogs", href: "#blog" },
    { name: "Contact", href: "#contact" },
]

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const openMenu = () => {
        setIsMobileMenuOpen(true)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsVisible(true))
        })
    }

    const closeMenu = () => {
        setIsVisible(false)
        setTimeout(() => setIsMobileMenuOpen(false), 350)
    }

    // ✅ FIXED SCROLL LOCK (no position fixed)
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [isMobileMenuOpen])

    const handleNavClick = (item) => {
        const id = item.href.replace("#", "")
        const el = document.getElementById(id)

        closeMenu()

        setTimeout(() => {
            if (el) {
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                })
            }
        }, 350)
    }

    const mobileMenu = isMobileMenuOpen ? (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "#0a0a0a",
                zIndex: 999999,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                transform: isVisible ? "translateX(0)" : "translateX(100%)",
                opacity: isVisible ? 1 : 0,
                transition:
                    "transform 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <img
                    src="/logo.png"
                    alt="Fit with Sudarshan"
                    style={{ height: "40px" }}
                />

                <button
                    onClick={closeMenu}
                    style={{
                        padding: "8px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        cursor: "pointer",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Nav Links */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px",
                    gap: "4px",
                }}
            >
                {navItems.map((item, index) => (
                    <button
                        key={item.name}
                        onClick={() => handleNavClick(item)}
                        style={{
                            all: "unset",
                            display: "flex",
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderRadius: "12px",
                            color: "white",
                            fontSize: "16px",
                            fontWeight: 500,
                            borderBottom:
                                "1px solid rgba(255,255,255,0.06)",
                            cursor: "pointer",
                            transform: isVisible
                                ? "translateX(0)"
                                : "translateX(30px)",
                            opacity: isVisible ? 1 : 0,
                            transition: `transform 400ms cubic-bezier(0.32, 0.72, 0, 1) ${index * 40
                                }ms, opacity 350ms ease ${index * 40}ms`,
                        }}
                    >
                        {item.name}
                        <span
                            style={{
                                color: "rgba(255,255,255,0.3)",
                                fontSize: "12px",
                            }}
                        >
                            →
                        </span>
                    </button>
                ))}
            </div>
        </div>
    ) : null

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass py-3" : "bg-transparent py-4"
                    }`}
            >
                <div className="container mx-auto flex items-center justify-between px-4">
                    {/* Logo */}
                    <a href="#home">
                        <img
                            src="/logo.png"
                            alt="Fit with Sudarshan"
                            className="h-12 lg:h-16"
                        />
                    </a>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-1">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                {item.name}
                                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-primary transition-all group-hover:w-full" />
                            </a>
                        ))}
                    </div>

                    {/* Right Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openMenu}
                            className="p-2 lg:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </motion.nav>

            {createPortal(mobileMenu, document.body)}
        </>
    )
}