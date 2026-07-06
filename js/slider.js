/**
 * IDEACHAT - Testimonials Slider JavaScript
 * Handles slide transition, auto sliding, and pagination dot sync.
 */

document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.slider-track');
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  
  if (!track || slides.length === 0 || dots.length === 0) return;

  let currentIndex = 0;
  const slideCount = slides.length;
  let autoSlideTimer = null;
  const slideInterval = 5000; // 5 seconds

  // Transition to specific slide index
  const goToSlide = (index) => {
    // Boundary check
    if (index < 0) {
      currentIndex = slideCount - 1;
    } else if (index >= slideCount) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    // Move track
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Sync dots active state
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('active');
        dot.style.backgroundColor = 'var(--primary)';
      } else {
        dot.classList.remove('active');
        dot.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
      }
    });
  };

  // Start auto play timer
  const startAutoPlay = () => {
    stopAutoPlay(); // Prevent duplicates
    autoSlideTimer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, slideInterval);
  };

  // Stop auto play timer
  const stopAutoPlay = () => {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  };

  // Click handler for dot navigation indicators
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const targetIndex = parseInt(e.target.getAttribute('data-index'), 10);
      goToSlide(targetIndex);
      
      // Reset auto play on manual action
      startAutoPlay();
    });
  });

  // Touch swipe support for mobiles
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoPlay();
  }, { passive: true });

  const handleSwipe = () => {
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 50; // Minimum swipe distance in pixels
    
    if (swipeDistance < -swipeThreshold) {
      // Swiped left -> next slide
      goToSlide(currentIndex + 1);
    } else if (swipeDistance > swipeThreshold) {
      // Swiped right -> prev slide
      goToSlide(currentIndex - 1);
    }
  };

  // Initialize
  goToSlide(0);
  startAutoPlay();
});
