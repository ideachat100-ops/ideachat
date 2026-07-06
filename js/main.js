/**
 * IDEACHAT - Main Core JavaScript
 * Handles typing animation, counter animations, preloader, scroll reveal, and back to top actions.
 */

window.addEventListener('load', () => {
  // 1. Hide Preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.visibility = 'hidden';
      preloader.remove();
    }, 500);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // 2. Typing Effect for Hero Section
  const typingElement = document.querySelector('.typing-text');
  if (typingElement) {
    const words = JSON.parse(typingElement.getAttribute('data-words') || '[]');
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let delay = 150;

    const type = () => {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
        delay = 60; // Faster when deleting
      } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
        delay = 120;
      }

      if (!isDeleting && charIndex === currentWord.length) {
        delay = 2000; // Pause at end of word
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 500; // Pause before typing next word
      }

      setTimeout(type, delay);
    };

    if (words.length > 0) {
      setTimeout(type, 1000);
    }
  }

  // 3. Scroll Reveal Animation Engine (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Unobserve after revealing to prevent repeating animation when scrolling back
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  // 4. Back To Top Button
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 5. Stat Counter Animation (Intersection Observer)
  const counterElements = document.querySelectorAll('.counter-number');
  if ('IntersectionObserver' in window && counterElements.length > 0) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = +entry.target.getAttribute('data-target');
          const countTo = parseInt(target, 10);
          let count = 0;
          const duration = 2000; // 2 seconds
          const stepTime = Math.max(Math.floor(duration / countTo), 15);
          
          const timer = setInterval(() => {
            count += Math.ceil(countTo / (duration / stepTime));
            if (count >= countTo) {
              entry.target.textContent = countTo;
              clearInterval(timer);
            } else {
              entry.target.textContent = count;
            }
          }, stepTime);
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterElements.forEach(counter => counterObserver.observe(counter));
  } else {
    // Fallback if observer not supported
    counterElements.forEach(counter => {
      counter.textContent = counter.getAttribute('data-target');
    });
  }

  // 6. Lazy Loading Images Helper (Native / IntersectionObserver)
  const lazyImages = document.querySelectorAll('img.lazy');
  if ('IntersectionObserver' in window && lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = image.dataset.src;
          image.classList.remove('lazy');
          observer.unobserve(image);
        }
      });
    });

    lazyImages.forEach(image => imageObserver.observe(image));
  } else {
    // Fallback: load all images immediately
    lazyImages.forEach(image => {
      image.src = image.dataset.src;
    });
  }

  // Hero background rotator removed — reverted to single static hero images
});
