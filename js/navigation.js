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

  // Theme: permanently dark — no toggle
  document.body.classList.add('dark-theme');



  // 3. Highlight Active Link on Scroll / URL Match
  const currentPath = window.location.pathname;
  let pageName = currentPath.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref && (linkHref.includes(pageName) || (pageName === 'index.html' && linkHref === './') || (pageName === '' && linkHref === './'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
