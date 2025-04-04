export async function onRequest(context) {
  const cssContent = `/* 
 * Modal Styles for AI Agent Call Scheduling
 * Provides styling for the call scheduling modal and form elements
 */

/* Modal container */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
}

/* Modal content - Dark Mode */
.modal-content {
  background-color: #1a1a2e;
  color: #e6e6e6;
  margin: 5% auto; /* Reduced from 10% to 5% to move modal higher */
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  width: 90%;
  max-width: 500px;
  position: relative;
  border: 1px solid rgba(255,255,255,0.1);
}

/* Modal header */
.modal-content h2 {
  color: #fff;
  margin-bottom: 8px;
  font-weight: 600;
}

.modal-content p {
  color: #b8b8b8;
  margin-bottom: 24px;
  font-size: 0.95rem;
}

/* Close button */
.close-modal {
  position: absolute;
  right: 20px;
  top: 15px;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  color: #b8b8b8;
  transition: color 0.2s ease;
}

.close-modal:hover {
  color: #ff6b6b;
}

/* Form groups */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #e6e6e6;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  font-size: 16px;
  background-color: rgba(255,255,255,0.05);
  color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #ff6b6b;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2);
}

.form-group input::placeholder {
  color: rgba(255,255,255,0.3);
}

/* Button styles */
.btn-accent {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-accent:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
}

/* Icon button styles */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  padding: 8px 16px;
  border-radius: 8px;
}

.btn-icon i {
  font-size: 1rem;
}

/* Utility classes */
.hidden {
  display: none;
}

/* Form response messages */
#form-response {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
}

.response-success {
  background-color: rgba(46, 213, 115, 0.1);
  color: #2ed573;
  border-left: 4px solid #2ed573;
}

.response-success h3 {
  color: #2ed573;
  margin-bottom: 8px;
}

.response-error {
  background-color: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  border-left: 4px solid #ff4757;
}

.response-error h3 {
  color: #ff4757;
  margin-bottom: 8px;
}

/* Modal form submit button */
.modal-content .btn-primary {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  margin-top: 10px;
}

.modal-content .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.modal-content .btn-primary:disabled {
  background: #4a4a5a;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-content {
    margin: 10% auto; /* Reduced from 15% to 10% for mobile */
    padding: 20px;
    width: 95%;
  }
  
  .btn-icon {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
  
  .btn-icon i {
    font-size: 0.9rem;
  }
}

/* Dark mode glow effects */
.modal-content {
  position: relative;
  overflow: hidden;
}

.modal-content::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(255, 107, 107, 0.05) 0%,
    transparent 70%
  );
  z-index: -1;
}

/* Animated gradient border */
@keyframes borderGlow {
  0% {
    border-color: rgba(255,255,255,0.1);
  }
  50% {
    border-color: rgba(255, 107, 107, 0.3);
  }
  100% {
    border-color: rgba(255,255,255,0.1);
  }
}

.modal-content {
  animation: borderGlow 4s infinite;
}`;

  return new Response(cssContent, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}