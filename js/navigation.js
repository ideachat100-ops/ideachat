/**
 * IDEACHAT - Navigation JavaScript
 * Handles sticky nav, mobile menu toggle, and active state highlights.
 */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // 1. Sticky Header
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('sticky');
    } else {
      header.classList.remove('sticky');
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Trigger once on load in case page is refreshed halfway down

  // 2. Mobile Hamburger Menu Toggle
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      
      // Prevent body scrolling when menu is active
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
  }

  // Close mobile menu when clicking nav link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (hamburger && navMenu) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Theme toggle: inject button into nav and persist preference
  const insertThemeToggle = () => {
    const navWrapper = document.querySelector('.nav-wrapper');
    if (!navWrapper) return;

    // Avoid inserting twice
    if (document.querySelector('.theme-toggle')) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.title = 'Toggle theme';
    btn.innerHTML = '<i class="fa-solid fa-moon"></i>';

    const themeNavItem = document.createElement('li');
    themeNavItem.className = 'theme-toggle-nav-item';
    themeNavItem.appendChild(btn);

    // Place the toggle as a nav item so it sits inside the mobile menu drawer
    navMenu.appendChild(themeNavItem);

    const applyTheme = (theme) => {
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      } else {
        document.body.classList.remove('dark-theme');
        btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      }
    };

    // Read stored preference or use system preference
    const stored = localStorage.getItem('ideachat_theme');
    if (stored) applyTheme(stored);
    else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }

    btn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      const newTheme = isDark ? 'dark' : 'light';
      localStorage.setItem('ideachat_theme', newTheme);
      applyTheme(newTheme);
    });
  };

  insertThemeToggle();

  // 3. Highlight Active Link on Scroll / URL Match
  const currentPath = window.location.pathname;
  let pageName = currentPath.split('/').pop() || 'index.html';
  
  // Handle relative subdirectories (e.g. course files in courses/)
  if (currentPath.includes('/courses/')) {
    pageName = 'academy.html'; // Highlight Academy if we are inside a course detail page
  }

  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref && (linkHref.includes(pageName) || (pageName === 'index.html' && linkHref === './') || (pageName === '' && linkHref === './'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
