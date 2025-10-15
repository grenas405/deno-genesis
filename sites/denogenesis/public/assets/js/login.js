/**
 * Login Form Handler
 * Handles authentication for the admin login page
 * Following API endpoint patterns and UI guidelines
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initializeLoginForm);

/**
 * Initialize the login form functionality
 */
function initializeLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const messageElement = document.getElementById('loginMessage');

  if (!loginForm) {
    console.error('Login form not found');
    return;
  }

  // Add form submit event listener
  loginForm.addEventListener('submit', handleLoginSubmit);

  // Add input event listeners for real-time validation
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  if (usernameInput) {
    usernameInput.addEventListener('input', clearErrorOnInput);
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', clearErrorOnInput);
  }

  // Check if user is already logged in
  checkExistingAuth();
}

/**
 * Handle form submission
 * @param {Event} event - The submit event
 */
async function handleLoginSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const messageElement = document.getElementById('loginMessage');

  // Get form data
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Basic validation
  if (!username || !password) {
    displayMessage('Please enter both username and password', 'error');
    return;
  }

  // Disable submit button and show loading state
  submitButton.disabled = true;
  submitButton.classList.add('loading');
  const originalButtonText = submitButton.textContent;
  submitButton.textContent = 'Logging in...';

  try {
    // Make API request to login endpoint
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      // Successful login
      // Store the JWT token
      localStorage.setItem('authToken', data.token);
      
      // Display success message
      displayMessage('✅ Login successful! Redirecting...', 'success');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/admin/dashboard.html';
      }, 1500);

    } else {
      // Login failed
      const errorMessage = data.error || data.message || 'Invalid credentials';
      displayMessage(`❌ ${errorMessage}`, 'error');
      
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
      submitButton.textContent = originalButtonText;

      // Clear password field on error
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    }

  } catch (error) {
    console.error('Login error:', error);
    displayMessage('❌ Network error. Please check your connection and try again.', 'error');
    
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.classList.remove('loading');
    submitButton.textContent = originalButtonText;
  }
}

/**
 * Display a message to the user
 * @param {string} text - The message text
 * @param {string} type - The message type (success, error, info)
 */
function displayMessage(text, type = 'info') {
  const messageElement = document.getElementById('loginMessage');
  
  if (!messageElement) {
    console.error('Message element not found');
    return;
  }

  // Remove all type classes
  messageElement.classList.remove('success', 'error', 'info');
  
  // Add the appropriate class
  if (type) {
    messageElement.classList.add(type);
  }

  // Set the message text
  messageElement.textContent = text;

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      messageElement.textContent = '';
      messageElement.classList.remove('success');
    }, 5000);
  }
}

/**
 * Clear error message when user starts typing
 */
function clearErrorOnInput() {
  const messageElement = document.getElementById('loginMessage');
  
  if (messageElement && messageElement.classList.contains('error')) {
    messageElement.textContent = '';
    messageElement.classList.remove('error');
  }
}

/**
 * Check if user is already authenticated
 * If yes, redirect to dashboard
 */
async function checkExistingAuth() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return; // No token, user needs to log in
  }

  try {
    // Verify the token is still valid by making a request to a protected endpoint
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // Token is valid, redirect to dashboard
      displayMessage('ℹ️ Already logged in. Redirecting...', 'info');
      setTimeout(() => {
        window.location.href = '/admin/dashboard.html';
      }, 1000);
    } else {
      // Token is invalid or expired, remove it
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    // Network error or token verification failed
    console.error('Auth check error:', error);
    // Keep the user on the login page
  }
}

/**
 * Validate username format
 * @param {string} username - The username to validate
 * @returns {boolean} - True if valid
 */
function validateUsername(username) {
  // Username should be at least 3 characters
  // and contain only alphanumeric characters, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password format
 * @param {string} password - The password to validate
 * @returns {boolean} - True if valid
 */
function validatePassword(password) {
  // Password should be at least 8 characters
  return password.length >= 8;
}

/**
 * Handle logout (can be called from other pages)
 */
function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/admin/login.html';
}

// Export functions for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    displayMessage,
    logout,
    validateUsername,
    validatePassword
  };
}
