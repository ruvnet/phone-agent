export async function onRequest(context) {
  const cssContent = `/* 
 * Animation Styles
 * Provides animation effects for various UI elements
 */

/* Pulse animation for the hero visual */
@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

/* Waveform animation */
@keyframes wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(2);
  }
}

/* Fade in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse animation for the infinity logo */
@keyframes pulse {
  0% {
    border-color: var(--primary);
  }
  50% {
    border-color: var(--primary-light);
  }
  100% {
    border-color: var(--primary);
  }
}

/* Arrow pulse animation */
@keyframes pulse-arrow {
  0%, 100% {
    opacity: 0.5;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateX(5px);
  }
}

/* Responsive adjustments for arrow animation */
@media (max-width: 768px) {
  @keyframes pulse-arrow {
    0%, 100% {
      opacity: 0.5;
      transform: rotate(90deg) translateX(0);
    }
    50% {
      opacity: 1;
      transform: rotate(90deg) translateX(5px);
    }
  }
}

/* Shimmer effect for buttons */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Spinner animation for loading states */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

/* Floating animation for cards */
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.float {
  animation: float 4s ease-in-out infinite;
}

/* Typing cursor animation */
@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: currentColor;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

/* Gradient animation */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.gradient-bg {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

/* Scale in animation */
@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scale-in {
  animation: scaleIn 0.5s ease forwards;
}`;

  return new Response(cssContent, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}