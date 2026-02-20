// Notify background that a valid Amazon page is loaded
chrome.runtime.sendMessage({ type: 'AMAZON_VISITED' });

// Create a stylish toast notification
function showSamuraiToast() {
  const toast = document.createElement('div');
  toast.id = 'smt4-toast';
  toast.innerHTML = `
    <div class="toast-header">SMT IV: Amazon Edition</div>
    <div class="toast-body">Oh, a Hunter...</div>
  `;
  document.body.appendChild(toast);

  // Remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 1000);
  }, 4000);
}

// Only show toast once per session if enabled
chrome.storage.local.get(['enabled'], (data) => {
  const hasShownToast = sessionStorage.getItem('smt4_toast_shown');
  if (data.enabled && !hasShownToast) {
    showSamuraiToast();
    sessionStorage.setItem('smt4_toast_shown', 'true');
  }
});