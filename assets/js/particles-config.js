particlesJS("particles-js", {
    particles: {
        number: {
            value: 80,
            density: { enable: true, value_area: 500 }
        },
        color: { value: "#18d26e" },
        shape: {
            type: "circle",
            stroke: { width: 0, color: "#000000" }
        },
        opacity: {
            value: 0.5,
            random: false,
            anim: { enable: false, speed: 1 }
        },
        size: {
            value: 3,
            random: true,
            anim: { enable: false }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: "#18d26e",
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 3,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 1200 }
        }
    },
    interactivity: {
        detect_on: "window", // Changed from canvas to window for better detection
        events: {
            onhover: {
                enable: true,
                mode: "repulse" // Changed from grab to repulse for more dynamic effect
            },
            onclick: {
                enable: true,
                mode: "push" // Keeping push but will adjust its speed in modes
            },
            resize: true
        },
        modes: {
            repulse: {
                distance: 80, // How far particles move away from cursor
                duration: 0.4 // How quickly they move away
            },
            grab: {
                distance: 180,
                line_linked: { opacity: 0.8 }
            },
            push: {
                particles_nb: 4, // Reduced from 4 to 2 for fewer particles
                quantity: 5 // Added to control creation rate
            },
            remove: { particles_nb: 2 },
            bubble: {
                distance: 200,
                size: 6,
                duration: 2,
                opacity: 8,
                speed: 3
            }
        }
    },
    retina_detect: true,
    fps_limit: 30 // Added to control overall animation speed
});
