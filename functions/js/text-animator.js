export async function onRequest(context) {
  const jsContent = `/**
 * Text Animator Module
 * Provides subtle text animation effects for the landing page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize text animations
  initTextAnimations();
});

/**
 * Initialize text animations on the page
 */
function initTextAnimations() {
  // Animate the hero heading with a subtle fade-in and slide effect
  animateHeroHeading();
  
  // Animate feature cards with a staggered reveal
  animateFeatureCards();
  
  // Add hover animations to buttons
  addButtonHoverEffects();
}

/**
 * Animate the main hero heading
 */
function animateHeroHeading() {
  const heroHeading = document.querySelector('.hero h1');
  const heroTagline = document.querySelector('.hero-tagline');
  
  if (heroHeading && heroTagline) {
    // Split the heading text into words
    const words = heroHeading.textContent.split(' ');
    heroHeading.innerHTML = '';
    
    // Create spans for each word with staggered animation
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      span.style.display = 'inline-block';
      span.style.transition = \`opacity 0.5s ease, transform 0.5s ease\`;
      span.style.transitionDelay = \`\${0.1 + (index * 0.1)}s\`;
      
      heroHeading.appendChild(span);
      
      // Trigger animation after a short delay
      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      }, 100);
    });
    
    // Animate the tagline with a slight delay
    heroTagline.style.opacity = '0';
    heroTagline.style.transform = 'translateY(20px)';
    heroTagline.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    heroTagline.style.transitionDelay = \`\${0.1 + (words.length * 0.1) + 0.2}s\`;
    
    setTimeout(() => {
      heroTagline.style.opacity = '1';
      heroTagline.style.transform = 'translateY(0)';
    }, 100);
  }
}

/**
 * Animate feature cards with a staggered reveal
 */
function animateFeatureCards() {
  const featureCards = document.querySelectorAll('.feature-card');
  
  if (featureCards.length > 0) {
    featureCards.forEach((card, index) => {
      // Set initial state
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.transitionDelay = \`\${0.1 + (index * 0.1)}s\`;
      
      // Create intersection observer to trigger animation when card comes into view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            observer.unobserve(card);
          }
        });
      }, { threshold: 0.1 });
      
      observer.observe(card);
    });
  }
}

/**
 * Add hover effects to buttons
 */
function addButtonHoverEffects() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
  });
}`;

  return new Response(jsContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}