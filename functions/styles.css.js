export async function onRequest(context) {
  // Read the CSS file from the public directory
  const cssPath = './public/styles.css';
  
  try {
    // Return the dark theme CSS content
    const cssContent = `
    :root {
      /* Reduced color palette */
      --primary: #4F46E5; /* Blue/purple - main brand color */
      --primary-light: #818CF8; /* Lighter shade of primary */
      --primary-dark: #1E1B4B; /* Darker shade of primary */
      --dark: #1E1E1E; /* Very dark gray (almost black) */
      --darker: #121212; /* Even darker background */
      --light: #E5E7EB; /* Light gray */
      --gray: #6B7280; /* Medium gray */
      --gray-light: #9CA3AF; /* Lighter gray */
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: var(--light);
      background-color: var(--darker);
      font-weight: 300;
    }
    
    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    header {
      padding: 20px 0;
      background-color: rgba(30, 30, 30, 0.8);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 1.3rem;
      color: var(--primary);
      letter-spacing: -0.5px;
    }
    
    .logo-icon {
      margin-right: 10px;
      position: relative;
      width: 30px;
      height: 30px;
    }
    
    /* Animated infinity logo */
    .infinity {
      position: relative;
      width: 30px;
      height: 15px;
      transform: translateY(7px);
    }
    
    .infinity:before,
    .infinity:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 15px;
      height: 15px;
      border: 2px solid var(--primary);
      border-radius: 50px 50px 0 50px;
      transform: rotate(-45deg);
      animation: pulse 3s infinite alternate;
    }
    
    .infinity:after {
      left: auto;
      right: 0;
      border-radius: 50px 50px 50px 0;
      transform: rotate(45deg);
      animation-delay: 1.5s;
    }
    
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
    
    nav ul {
      display: flex;
      list-style: none;
    }
    
    nav ul li {
      margin-left: 30px;
    }
    
    nav ul li a {
      color: var(--light);
      text-decoration: none;
      font-weight: 400;
      font-size: 0.9rem;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      transition: all 0.3s;
      opacity: 0.8;
    }
    
    nav ul li a:hover {
      color: var(--primary);
      opacity: 1;
    }
    
    /* Enhanced Hero Section */
    .hero {
      padding: 100px 0;
      background: linear-gradient(135deg, var(--dark) 0%, var(--primary-dark) 100%);
      position: relative;
      overflow: hidden;
    }
    
    .hero .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
    }
    
    .hero-content {
      flex: 1;
      max-width: 600px;
      z-index: 2;
    }
    
    .hero h1 {
      font-size: 3.2rem;
      margin-bottom: 20px;
      color: var(--light);
      font-weight: 700;
      letter-spacing: -1px;
      line-height: 1.2;
    }
    
    .hero-tagline {
      font-size: 1.2rem;
      color: var(--gray-light);
      margin-bottom: 30px;
      font-weight: 300;
    }
    
    .hero-features {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .hero-feature {
      display: flex;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.05);
      padding: 8px 15px;
      border-radius: 50px;
      font-size: 0.9rem;
    }
    
    .hero-feature-icon {
      margin-right: 8px;
    }
    
    .hero-cta {
      display: flex;
      gap: 15px;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 30px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      transition: all 0.3s;
      border: none;
      position: relative;
      overflow: hidden;
    }
    
    .btn-primary {
      background-color: var(--primary);
      color: white;
    }
    
    .btn-primary:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transform: translateX(-100%);
    }
    
    .btn-primary:hover {
      background-color: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .btn-primary:hover:before {
      transform: translateX(100%);
      transition: transform 0.6s ease;
    }
    
    .btn-secondary {
      background-color: transparent;
      color: var(--light);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .btn-secondary:hover {
      background-color: rgba(255, 255, 255, 0.05);
      transform: translateY(-2px);
      border-color: var(--primary-light);
    }
    
    .hero-visual {
      flex: 1;
      max-width: 400px;
      z-index: 2;
    }
    
    .hero-visual-container {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hero-visual-element {
      position: relative;
      width: 80%;
      aspect-ratio: 1;
    }
    
    .pulse-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background-color: rgba(79, 70, 229, 0.1);
      animation: pulse-ring 2s infinite;
    }
    
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
    
    .waveform {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .wave {
      width: 4px;
      background-color: var(--primary);
      border-radius: 2px;
      animation: wave 1.5s infinite ease-in-out;
    }
    
    .wave:nth-child(1) {
      height: 20%;
      animation-delay: 0.1s;
    }
    
    .wave:nth-child(2) {
      height: 40%;
      animation-delay: 0.2s;
    }
    
    .wave:nth-child(3) {
      height: 60%;
      animation-delay: 0.3s;
    }
    
    .wave:nth-child(4) {
      height: 40%;
      animation-delay: 0.4s;
    }
    
    .wave:nth-child(5) {
      height: 20%;
      animation-delay: 0.5s;
    }
    
    @keyframes wave {
      0%, 100% {
        transform: scaleY(1);
      }
      50% {
        transform: scaleY(2);
      }
    }
    
    .features {
      padding: 100px 0;
      background-color: var(--darker);
    }
    
    .section-title {
      text-align: center;
      margin-bottom: 70px;
    }
    
    .section-title h2 {
      font-size: 2rem;
      color: var(--light);
      margin-bottom: 15px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    
    .section-title p {
      color: var(--gray-light);
      max-width: 500px;
      margin: 0 auto;
      font-size: 1rem;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }
    
    .feature-card {
      background-color: rgba(30, 30, 30, 0.5);
      border-radius: 6px;
      padding: 30px;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    
    .feature-card:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background-color: var(--primary);
      transition: all 0.3s;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
      background-color: rgba(30, 30, 30, 0.8);
    }
    
    .feature-icon {
      font-size: 1.8rem;
      margin-bottom: 20px;
      display: inline-block;
      color: var(--primary);
    }
    
    .feature-card h3 {
      margin-bottom: 15px;
      font-size: 1.2rem;
      color: var(--light);
      font-weight: 500;
    }
    
    .feature-card p {
      color: var(--gray-light);
      font-size: 0.95rem;
      line-height: 1.7;
    }
    
    /* Use Cases Section */
    .use-cases {
      padding: 100px 0;
      background-color: var(--dark);
    }
    
    .use-case-tabs {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .tab-nav {
      display: flex;
      justify-content: center;
      margin-bottom: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .tab-btn {
      background: none;
      border: none;
      color: var(--gray-light);
      padding: 15px 30px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      font-family: 'Inter', sans-serif;
    }
    
    .tab-btn:after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 3px;
      background-color: var(--primary);
      transform: scaleX(0);
      transition: transform 0.3s;
    }
    
    .tab-btn.active {
      color: var(--light);
    }
    
    .tab-btn.active:after {
      transform: scaleX(1);
    }
    
    .tab-btn:hover {
      color: var(--light);
    }
    
    .tab-content {
      position: relative;
    }
    
    .tab-pane {
      display: none;
      animation: fadeIn 0.5s ease forwards;
    }
    
    .tab-pane.active {
      display: block;
    }
    
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
    
    .use-case-content {
      display: flex;
      align-items: flex-start;
      gap: 40px;
      background-color: rgba(30, 30, 30, 0.5);
      border-radius: 8px;
      padding: 40px;
    }
    
    .use-case-image {
      flex-shrink: 0;
      width: 200px;
    }
    
    .image-placeholder {
      width: 100%;
      aspect-ratio: 1;
      background-color: rgba(79, 70, 229, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }
    
    .use-case-details {
      flex-grow: 1;
    }
    
    .use-case-details h3 {
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: var(--light);
      font-weight: 600;
    }
    
    .use-case-details p {
      color: var(--gray-light);
      margin-bottom: 20px;
      font-size: 1rem;
    }
    
    .use-case-list {
      list-style: none;
      margin-bottom: 30px;
    }
    
    .use-case-list li {
      padding-left: 25px;
      position: relative;
      margin-bottom: 12px;
      color: var(--gray-light);
    }
    
    .use-case-list li:before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--primary);
    }
    
    .use-case-list li strong {
      color: var(--light);
      font-weight: 500;
    }
    
    .use-case-quote {
      background-color: rgba(255, 255, 255, 0.05);
      border-left: 3px solid var(--primary);
      padding: 20px;
      border-radius: 0 4px 4px 0;
      font-style: italic;
    }
    
    .use-case-quote p {
      margin-bottom: 10px;
      color: var(--light);
      font-size: 0.95rem;
    }
    
    .use-case-quote cite {
      color: var(--gray-light);
      font-size: 0.85rem;
      font-style: normal;
    }
    
    .how-it-works {
      padding: 100px 0;
      background-color: var(--dark);
    }
    
    /* Flowchart Styles */
    .flowchart {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: rgba(30, 30, 30, 0.5);
      border-radius: 8px;
      position: relative;
    }
    
    .flow-step {
      display: flex;
      align-items: center;
      padding: 25px;
      position: relative;
      background-color: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      margin-bottom: 20px;
      transition: all 0.3s;
    }
    
    .flow-step:last-child {
      margin-bottom: 0;
    }
    
    .flow-step:hover {
      background-color: rgba(255, 255, 255, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .flow-icon {
      flex-shrink: 0;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 25px;
      position: relative;
    }
    
    .flow-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.1rem;
      color: white;
      background-color: var(--primary);
    }
    
    .flow-content {
      flex-grow: 1;
    }
    
    .flow-content h3 {
      margin-bottom: 5px;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--light);
    }
    
    .flow-content p {
      color: var(--gray-light);
      font-size: 0.9rem;
    }
    
    .flow-content code {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 2px 5px;
      border-radius: 3px;
      font-family: monospace;
      color: var(--primary-light);
      font-size: 0.85rem;
    }
    
    .flow-arrow {
      margin-left: 20px;
      color: var(--gray-light);
      animation: pulse-arrow 2s infinite;
    }
    
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
    
    .flow-step:last-child .flow-arrow {
      display: none;
    }
    
    /* Connecting lines between steps */
    .flowchart:before {
      content: '';
      position: absolute;
      top: 70px;
      left: 45px;
      width: 2px;
      height: calc(100% - 140px);
      background: var(--primary);
      opacity: 0.3;
      z-index: 0;
    }
    
    .api-section {
      padding: 100px 0;
      background-color: var(--darker);
    }
    
    /* API Styles */
    .api-endpoints {
      background-color: rgba(30, 30, 30, 0.5);
      border-radius: 8px;
      padding: 30px;
      color: white;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
      margin-top: 40px;
      border-left: 3px solid var(--primary);
    }
    
    .endpoint {
      margin-bottom: 40px;
      padding-bottom: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .endpoint:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .endpoint-url {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .method {
      padding: 3px 8px;
      border-radius: 3px;
      margin-right: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      background-color: var(--primary);
      color: white;
    }
    
    .url {
      color: var(--primary-light);
      font-size: 0.9rem;
    }
    
    .endpoint-desc {
      color: var(--gray-light);
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      margin-bottom: 20px;
    }
    
    .endpoint-details {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      padding: 20px;
      margin-top: 15px;
    }
    
    .endpoint-section {
      margin-bottom: 25px;
    }
    
    .endpoint-section:last-child {
      margin-bottom: 0;
    }
    
    .endpoint-section h4 {
      color: var(--light);
      font-size: 0.9rem;
      margin-bottom: 10px;
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    
    .endpoint-section h4:before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: var(--primary);
      border-radius: 50%;
      margin-right: 8px;
    }
    
    pre {
      background-color: rgba(0, 0, 0, 0.3);
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
    }
    
    code {
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
      font-size: 0.85rem;
      color: var(--gray-light);
    }
    
    .params-table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
    }
    
    .params-table th {
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--light);
      font-weight: 500;
    }
    
    .params-table td {
      padding: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--gray-light);
    }
    
    .params-table tr:last-child td {
      border-bottom: none;
    }
    
    .params-table td:first-child {
      color: var(--primary-light);
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
    }
    
    .api-note {
      background-color: rgba(79, 70, 229, 0.1);
      border-left: 3px solid var(--primary);
      padding: 20px;
      margin-top: 40px;
      border-radius: 0 6px 6px 0;
    }
    
    .api-note p {
      color: var(--gray-light);
      font-size: 0.9rem;
      margin-bottom: 10px;
    }
    
    .api-note p:last-child {
      margin-bottom: 0;
    }
    
    .api-note code {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 2px 5px;
      border-radius: 3px;
      font-family: monospace;
      color: var(--primary-light);
      font-size: 0.85rem;
    }
    
    .api-link {
      color: var(--primary);
      text-decoration: none;
      transition: all 0.3s;
      border-bottom: 1px dotted var(--primary);
    }
    
    .api-link:hover {
      color: var(--primary-light);
      border-bottom-style: solid;
    }
    
    footer {
      background-color: var(--primary-dark);
      color: white;
      padding: 40px 0;
      text-align: center;
    }
    
    .footer-content {
      max-width: 500px;
      margin: 0 auto;
    }
    
    .footer-logo {
      margin-bottom: 20px;
    }
    
    .copyright {
      color: var(--gray-light);
      font-size: 0.85rem;
      opacity: 0.7;
    }
    
    @media (max-width: 768px) {
      .hero .container {
        flex-direction: column;
        text-align: center;
      }
      
      .hero h1 {
        font-size: 2.5rem;
      }
      
      .hero-features {
        justify-content: center;
      }
      
      .hero-cta {
        justify-content: center;
      }
      
      .hero-visual {
        order: -1;
        margin-bottom: 40px;
      }
      
      .feature-grid {
        grid-template-columns: 1fr;
      }
      
      .flow-step {
        flex-direction: column;
        text-align: center;
        padding: 30px 15px;
      }
      
      .flow-icon {
        margin-right: 0;
        margin-bottom: 15px;
      }
      
      .flow-arrow {
        margin-left: 0;
        margin-top: 15px;
        transform: rotate(90deg);
      }
      
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
      
      .flowchart:before {
        display: none;
      }
      
      nav ul li {
        margin-left: 15px;
      }
      
      nav ul li a {
        font-size: 0.8rem;
      }
      
      .params-table {
        display: block;
        overflow-x: auto;
      }
      
      .tab-nav {
        flex-direction: column;
        align-items: center;
      }
      
      .tab-btn {
        width: 100%;
        text-align: center;
      }
      
      .use-case-content {
        flex-direction: column;
        padding: 25px;
      }
      
      .use-case-image {
        width: 100%;
        margin-bottom: 20px;
      }
    }
    
    /* Button icon styles */
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
    
    .btn-icon span {
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }
    
    /* Accent button style */
    .btn-accent {
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      color: white;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-accent:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .btn-icon {
        font-size: 0.8rem;
        padding: 6px 12px;
      }
      
      .btn-icon i {
        font-size: 0.9rem;
      }
      
      .btn-icon span {
        font-size: 0.75rem;
      }
      
      .hero-cta {
        flex-wrap: wrap;
      }
    }
    `;
    
    // Return the CSS content with the correct content type
    return new Response(cssContent, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response(`Error serving CSS: ${error.message}`, { status: 500 });
  }
}