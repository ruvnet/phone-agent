export async function onRequest(context) {
  const htmlContent = `<!-- Call Scheduling Modal -->
<div id="call-modal" class="modal">
  <div class="modal-content">
    <span class="close-modal">&times;</span>
    <h2>Schedule an AI Agent Call</h2>
    <p>Enter your details to have our AI agent call you at your preferred time.</p>
    
    <form id="schedule-call-form">
      <div class="form-group">
        <label for="name">
          <i class="fas fa-user"></i> Your Name
        </label>
        <input type="text" id="name" name="name" placeholder="Enter your full name" required>
      </div>
      
      <div class="form-group">
        <label for="phone">
          <i class="fas fa-phone"></i> Phone Number
        </label>
        <input type="tel" id="phone" name="phone" placeholder="+1 (123) 456-7890" required>
      </div>
      
      <div class="form-group">
        <label for="datetime">
          <i class="fas fa-calendar-alt"></i> Preferred Date & Time
        </label>
        <input type="datetime-local" id="datetime" name="datetime" required>
      </div>
      
      <div class="form-group">
        <label for="topic">
          <i class="fas fa-comment-alt"></i> Call Topic
        </label>
        <input type="text" id="topic" name="topic" placeholder="What would you like to discuss? (Optional)">
      </div>
      
      <button type="submit" class="btn btn-primary">
        <i class="fas fa-phone-alt"></i> Schedule Call
      </button>
    </form>
    
    <div id="form-response" class="hidden"></div>
  </div>
</div>`;

  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}