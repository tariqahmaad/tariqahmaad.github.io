document.addEventListener('DOMContentLoaded', function () {
    // Add the animation class to skill cards when they enter the viewport
    const skillCards = document.querySelectorAll('.skill-card');

    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Function to add animation to elements in viewport
    function animateOnScroll() {
        skillCards.forEach(card => {
            if (isInViewport(card)) {
                card.classList.add('in-viewport');
            }
        });
    }

    // Run once on page load
    animateOnScroll();

    // Add event listener for scroll
    window.addEventListener('scroll', animateOnScroll);
});
