// js/mobile-nav.js
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const navOverlay = document.getElementById('nav-overlay');

    if (!hamburgerBtn || !mobileNavDrawer || !navOverlay) return;

    function openMobileNav() {
        hamburgerBtn.classList.add('open');
        mobileNavDrawer.classList.add('open');
        navOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileNav() {
        hamburgerBtn.classList.remove('open');
        mobileNavDrawer.classList.remove('open');
        navOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.closeMobileNav = closeMobileNav; // глобально для inline onclick

    hamburgerBtn.addEventListener('click', () => {
        mobileNavDrawer.classList.contains('open') ? closeMobileNav() : openMobileNav();
    });

    navOverlay.addEventListener('click', closeMobileNav);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMobileNav();
    });
});