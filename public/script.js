// ==========================================
// CUSTOM CURSOR
// ==========================================
const cursor = document.getElementById("customCursor");

if (window.matchMedia("(pointer: fine)").matches) {
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });

  document.addEventListener("mousedown", () => cursor.classList.add("clicking"));
  document.addEventListener("mouseup", () => cursor.classList.remove("clicking"));

  const interactives = "button, a, input, .huge-code, .choice-col";
  document.querySelectorAll(interactives).forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
  });
} else {
  cursor.style.display = "none";
}

// ==========================================
// SCREEN ROUTING
// ==========================================
const choiceView = document.getElementById("choiceView");
const shortenView = document.getElementById("shortenView");
const redirectView = document.getElementById("redirectView");

document.getElementById("toShortenBtn").addEventListener("click", () => triggerTransition(shortenView));
document.getElementById("toRedirectBtn").addEventListener("click", () => triggerTransition(redirectView));
document.getElementById("shortenBackBtn").addEventListener("click", () => triggerTransition(choiceView));
document.getElementById("redirectBackBtn").addEventListener("click", () => triggerTransition(choiceView));

function triggerTransition(targetView) {
  const bars = document.querySelectorAll('.t-bar');
  const staggerTime = 80; 
  
  bars.forEach((bar, index) => {
    bar.style.transform = 'translateY(100%)'; 
    setTimeout(() => { bar.style.transform = 'translateY(0)'; }, index * staggerTime);
  });

  const coverTime = (bars.length - 1) * staggerTime + 400; 

  setTimeout(() => {
    [choiceView, shortenView, redirectView].forEach(view => view.classList.add("view-hidden"));
    targetView.classList.remove("view-hidden");
    
    document.getElementById("urlInput").value = "";
    document.getElementById("codeInput").value = "";
    document.getElementById("shortenError").hidden = true;
    document.getElementById("redirectError").hidden = true;
    
    if (targetView === choiceView) {
      document.getElementById("shortenResult").hidden = true;
      document.getElementById("shortenForm").hidden = false;
      document.getElementById("shortenStatus").textContent = "READY";
      clearInterval(countdownInterval);
    }

    bars.forEach((bar, index) => {
      setTimeout(() => { bar.style.transform = 'translateY(-100%)'; }, index * staggerTime);
    });

    setTimeout(() => {
      bars.forEach((bar) => {
        bar.style.transition = 'none'; 
        bar.style.transform = 'translateY(100%)'; 
        bar.offsetHeight; 
        bar.style.transition = 'transform 0.5s cubic-bezier(0.77, 0, 0.175, 1)'; 
      });
    }, (bars.length - 1) * staggerTime + 400);

  }, coverTime);
}

// ==========================================
// SHORTEN & GRANULAR COUNTER LOGIC
// ==========================================
const urlForm = document.getElementById("urlForm");
const shortenBtn = document.getElementById("shortenBtn");
const fallingCounter = document.getElementById("fallingCounter");
const shortenStatus = document.getElementById("shortenStatus");
const codeText = document.getElementById("codeText");

let countdownInterval = null;
let oldCounterStr = ""; 

urlForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("shortenError").hidden = true;

  let url = document.getElementById("urlInput").value.trim();
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;

  shortenBtn.disabled = true;
  shortenBtn.textContent = "WAIT...";

  try {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");

    document.getElementById("shortenForm").hidden = true;
    document.getElementById("shortenResult").hidden = false;
    
    codeText.dataset.original = data.code; 
    codeText.innerText = data.code;
    shortenStatus.textContent = "ACTIVE";

    oldCounterStr = ""; 
    startFallingCounter(data.expiresInSeconds);
  } catch (err) {
    document.getElementById("shortenError").textContent = err.message;
    document.getElementById("shortenError").hidden = false;
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = "GENERATE ↵";
  }
});

function setGranularCounter(newVal) {
  const newStr = newVal.toString();
  let html = '';
  const lengthChanged = oldCounterStr.length !== newStr.length;
  
  for(let i = 0; i < newStr.length; i++) {
     let isDifferent = lengthChanged || oldCounterStr[i] !== newStr[i];
     let dropClass = isDifferent ? 'dropping' : '';
     html += `<span class="digit ${dropClass}">${newStr[i]}</span>`;
  }
  
  fallingCounter.innerHTML = html;
  oldCounterStr = newStr;
}

function startFallingCounter(totalSeconds) {
  let remaining = totalSeconds;
  setGranularCounter(remaining);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      setGranularCounter(0);
      shortenStatus.textContent = "EXPIRED";
      return;
    }
    setGranularCounter(remaining);
  }, 1000);
}

// ==========================================
// TEXT SCRABBLE COPY EFFECT
// ==========================================
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function runScramble(element, targetText, onComplete) {
  let iteration = 0;
  clearInterval(element.scrambleInterval);
  
  element.scrambleInterval = setInterval(() => {
    element.innerText = targetText.split("").map((letter, index) => {
      if(index < iteration) return targetText[index];
      return chars[Math.floor(Math.random() * chars.length)];
    }).join("");

    if(iteration >= targetText.length) {
      clearInterval(element.scrambleInterval);
      if(onComplete) onComplete();
    }
    iteration += 1 / 2;
  }, 30);
}

codeText.addEventListener("click", async () => {
  if (codeText.classList.contains("is-copying")) return;
  codeText.classList.add("is-copying");

  const originalCode = codeText.dataset.original || codeText.innerText;

  try {
    await navigator.clipboard.writeText(originalCode);
  } catch {}

  runScramble(codeText, "COPIED", () => {
    setTimeout(() => {
      runScramble(codeText, originalCode, () => {
        codeText.classList.remove("is-copying");
      });
    }, 1000);
  });
});

// ==========================================
// REDIRECT LOGIC & RIPPLES
// ==========================================
const codeForm = document.getElementById("codeForm");
const codeInput = document.getElementById("codeInput");
const goBtn = document.getElementById("goBtn");
const bgRipple = document.getElementById("bgRipple");

codeInput.addEventListener("input", () => codeInput.value = codeInput.value.toUpperCase());

codeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("redirectError").hidden = true;

  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 6) {
    triggerRipple("error");
    document.getElementById("redirectError").textContent = "Code must be exactly 6 characters.";
    document.getElementById("redirectError").hidden = false;
    return;
  }

  goBtn.disabled = true;

  try {
    const res = await fetch(`/api/resolve?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    
    if (!res.ok) {
      triggerRipple("error");
      throw new Error(data.error || "Invalid or expired code.");
    }

    triggerRipple("success");
    setTimeout(() => { window.location.href = data.url; }, 600); 

  } catch (err) {
    document.getElementById("redirectError").textContent = err.message;
    document.getElementById("redirectError").hidden = false;
    goBtn.disabled = false;
  }
});

function triggerRipple(type) {
  bgRipple.style.backgroundColor = type === "success" ? "var(--success)" : "var(--danger)";
  bgRipple.classList.add("active");
  document.body.classList.add("ripple-dark");

  if (type === "error") {
    setTimeout(() => {
      bgRipple.classList.remove("active");
      document.body.classList.remove("ripple-dark");
    }, 800);
  }
}

// ==========================================
// ANIME.JS POLKA DOT BACKGROUND LOGIC
// ==========================================
const polkaContainer = document.getElementById('polkaContainer');
let gridCols = 0;
let gridRows = 0;
const dotSpacing = 40; 

function buildPolkaGrid() {
  polkaContainer.innerHTML = '';
  
  gridCols = Math.floor(window.innerWidth / dotSpacing);
  gridRows = Math.floor(window.innerHeight / dotSpacing);
  
  polkaContainer.style.width = `${gridCols * dotSpacing}px`;
  polkaContainer.style.height = `${gridRows * dotSpacing}px`;
  
  polkaContainer.style.left = `calc(50vw - ${gridCols * dotSpacing / 2}px)`;
  polkaContainer.style.top = `calc(50dvh - ${gridRows * dotSpacing / 2}px)`;

  const totalDots = gridCols * gridRows;
  
  for (let i = 0; i < totalDots; i++) {
    const dotWrapper = document.createElement('div');
    dotWrapper.style.width = `${dotSpacing}px`;
    dotWrapper.style.height = `${dotSpacing}px`;
    dotWrapper.style.display = 'flex';
    dotWrapper.style.justifyContent = 'center';
    dotWrapper.style.alignItems = 'center';

    const dot = document.createElement('div');
    dot.classList.add('dot');
    dotWrapper.appendChild(dot);
    polkaContainer.appendChild(dotWrapper);
  }
}

function triggerAnimeRipple() {
  if (gridCols === 0 || gridRows === 0) return;
  
  const totalDots = gridCols * gridRows;
  const randomOrigin = Math.floor(Math.random() * totalDots); 

  anime({
    targets: '.dot',
    scale: [
      { value: 3.5, easing: 'easeOutSine', duration: 400 },
      { value: 1, easing: 'easeInOutQuad', duration: 900 }
    ],
    opacity: [
      { value: 0.9, easing: 'easeOutSine', duration: 400 },
      { value: 0.2, easing: 'easeInOutQuad', duration: 900 }
    ],
    delay: anime.stagger(60, { grid: [gridCols, gridRows], from: randomOrigin }) 
  });
}

window.addEventListener('resize', () => {
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(buildPolkaGrid, 200);
});

buildPolkaGrid();
setInterval(triggerAnimeRipple, 4000); 
setTimeout(triggerAnimeRipple, 300);