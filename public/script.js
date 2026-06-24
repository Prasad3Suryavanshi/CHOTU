// ==========================================
// SHORTEN & TIMER LOGIC
// ==========================================
const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");
const shortenBtn = document.getElementById("shortenBtn");
const shortenError = document.getElementById("shortenError");

const shortenFormWrap = document.getElementById("shortenFormWrap");
const shortenResultWrap = document.getElementById("shortenResultWrap");
const codeText = document.getElementById("codeText");
const copyHint = document.getElementById("copyHint");
const timerFill = document.getElementById("timerFill");
const resetBtn = document.getElementById("resetBtn");

let countdownInterval = null;

urlForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  shortenError.hidden = true;

  let url = urlInput.value.trim();
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;

  shortenBtn.disabled = true;
  shortenBtn.textContent = "GENERATING...";

  try {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create code.");

    shortenFormWrap.hidden = true;
    shortenResultWrap.hidden = false;
    
    // Reset visuals
    codeText.innerText = data.code;
    codeText.dataset.original = data.code;
    codeText.classList.remove("expired");
    copyHint.textContent = "CLICK THE CODE TO COPY";
    copyHint.className = "click-hint";

    startCountdown(data.expiresInSeconds);
  } catch (err) {
    shortenError.textContent = err.message;
    shortenError.hidden = false;
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = "CREATE CODE";
  }
});

function startCountdown(totalSeconds) {
  let remaining = totalSeconds;
  
  // Reset Timer Bar
  timerFill.className = "timer-fill";
  timerFill.style.width = "100%";

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    remaining -= 1;
    
    // Calculate percentage
    const percentage = (remaining / totalSeconds) * 100;
    timerFill.style.width = `${percentage}%`;
    
    // Shift color based on time left
    if (percentage <= 25) {
      timerFill.className = "timer-fill danger";
    } else if (percentage <= 50) {
      timerFill.className = "timer-fill warning";
    }

    // Handle Expiration
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      timerFill.style.width = "0%";
      codeText.classList.add("expired");
      copyHint.textContent = "CODE EXPIRED";
      copyHint.className = "click-hint error";
    }
  }, 1000);
}

resetBtn.addEventListener("click", () => {
  clearInterval(countdownInterval);
  urlInput.value = "";
  shortenFormWrap.hidden = false;
  shortenResultWrap.hidden = true;
});

// ==========================================
// DIRECT CLICK-TO-COPY LOGIC & VISUALS
// ==========================================
codeText.addEventListener("click", async () => {
  const originalCode = codeText.dataset.original;
  
  // Guard clause against clicking an expired code
  if (!originalCode || codeText.classList.contains("expired")) return;

  // Visual "Waiting/Copying" State
  copyHint.textContent = "COPYING...";
  copyHint.className = "click-hint waiting";

  try {
    await navigator.clipboard.writeText(originalCode);
    
    // Visual "Success" State
    codeText.style.color = "var(--p-green)";
    copyHint.textContent = "COPIED SUCCESSFULLY!";
    copyHint.className = "click-hint success";
    
    setTimeout(() => {
      codeText.style.color = ""; // Revert to default stylesheet color
      if (copyHint.className.includes("success")) {
        copyHint.textContent = "CLICK THE CODE TO COPY";
        copyHint.className = "click-hint";
      }
    }, 2000);
    
  } catch (err) {
    console.error("Clipboard write failed", err);
    
    // Visual "Failure" State
    codeText.style.color = "var(--p-red)";
    copyHint.textContent = "FAILED TO COPY!";
    copyHint.className = "click-hint error";
    
    setTimeout(() => {
      codeText.style.color = "";
      if (copyHint.className.includes("error")) {
        copyHint.textContent = "CLICK THE CODE TO COPY";
        copyHint.className = "click-hint";
      }
    }, 2000);
  }
});

// ==========================================
// REDIRECT LOGIC
// ==========================================
const codeForm = document.getElementById("codeForm");
const codeInput = document.getElementById("codeInput");
const goBtn = document.getElementById("goBtn");
const redirectError = document.getElementById("redirectError");

codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.toUpperCase();
});

codeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  redirectError.hidden = true;

  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 6) {
    redirectError.textContent = "Code must be exactly 6 characters.";
    redirectError.hidden = false;
    return;
  }

  // Visual Wait State for Redirection
  goBtn.disabled = true;
  goBtn.textContent = "LOCATING...";

  try {
    const res = await fetch(`/api/resolve?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Invalid or expired code.");
    }

    // Success -> Redirect happens instantly
    window.location.href = data.url;

  } catch (err) {
    // Failure State
    redirectError.textContent = err.message;
    redirectError.hidden = false;
    goBtn.disabled = false;
    goBtn.textContent = "OPEN LINK";
  }
});