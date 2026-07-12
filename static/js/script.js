const GEMINI_API_KEY = "AQ.Ab8RN6LrzO32rkBiz5mGgOGE3wmQFwyl-Vc3zsqhzeNzJt1FtA";

// In-Memory Session State
const RengkuhState = {

  currentScreen: 'home', // 'home' or 'cerita'
  ceritaHistory: [],     // Array of { role: 'user' | 'ai', message: string }
  reflectionSummary: null // Stored reflection summary object
};

// Markdown Prompt Templates (Loaded statically from server)
let chatSystemInstruction = "";
let summaryPromptSchema = "";

// UI Elements Map
const UIElements = {
  screenHome: document.getElementById('screen-home'),
  screenCerita: document.getElementById('screen-cerita'),
  btnStartChat1: document.getElementById('btn-start-chat-1'),
  btnStartChat2: document.getElementById('btn-start-chat-2'),
  btnBackToHome: document.getElementById('btn-back-to-home'),
  chatInput: document.getElementById('chat-input-text'),
  btnSendChat: document.getElementById('btn-send-chat'),
  chatLogs: document.getElementById('chat-logs-container'),
  suggestionContainer: document.getElementById('suggestion-chips-container'),
  reflectionContainer: document.getElementById('reflection-cards-container'),
  reflectionPlaceholder: document.getElementById('reflection-placeholder-element'),
  btnVoiceInput: document.getElementById('btn-voice-input'),
  initialAiTime: document.getElementById('initial-ai-time'),

  // Settings Modal Elements
  btnSettingsTrigger: document.getElementById('btn-settings-trigger'),
  settingsModal: document.getElementById('settings-modal'),
  settingsApiKey: document.getElementById('settings-api-key'),
  btnSettingsClose: document.getElementById('btn-settings-close'),
  btnSettingsSave: document.getElementById('btn-settings-save')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Set initial time for AI message (current local time)
  if (UIElements.initialAiTime) {
    UIElements.initialAiTime.innerText = formatCurrentTime();
  }

  // Load Prompt markdown files statically
  loadPrompts();

  // Setup Event Listeners
  setupNavigation();
  setupChatHandlers();
  setupVoiceInput();
  setupFaqAccordion();
  setupSettingsModal();
});

// Helper: Format Time (e.g., 10:02 AM)
function formatCurrentTime() {
  const date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
}

// 1. PROMPT LOADING
async function loadPrompts() {
  try {
    const res1 = await fetch('/prompts/cerita_system.md');
    chatSystemInstruction = await res1.text();

    const res2 = await fetch('/prompts/cerita_summary.md');
    summaryPromptSchema = await res2.text();
  } catch (err) {
    console.error("Gagal meload file prompt markdown:", err);
  }
}

// 2. NAVIGATION LOGIC
function setupNavigation() {
  const startChat = () => {
    RengkuhState.currentScreen = 'cerita';
    UIElements.screenHome.classList.remove('active');
    UIElements.screenCerita.classList.add('active');

    // Auto-prompt to set API Key if none is set
    const apiKey = GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      setTimeout(() => {
        alert("Halo Bu! Silakan masukkan Gemini API Key Anda terlebih dahulu di berkas static/js/script.js pada baris 'const GEMINI_API_KEY = \"...\";' agar fitur obrolan berjalan.");
      }, 500);
    }

    UIElements.chatInput.focus();
  };

  const backToHome = () => {
    RengkuhState.currentScreen = 'home';
    UIElements.screenCerita.classList.remove('active');
    UIElements.screenHome.classList.add('active');
  };

  UIElements.btnStartChat1.addEventListener('click', startChat);
  UIElements.btnStartChat2.addEventListener('click', startChat);
  UIElements.btnBackToHome.addEventListener('click', backToHome);
}

// 3. SETTINGS MODAL (localStorage API key storage)
function setupSettingsModal() {
  if (UIElements.btnSettingsTrigger) {
    UIElements.btnSettingsTrigger.addEventListener('click', openSettingsModal);
  }
  if (UIElements.btnSettingsClose) {
    UIElements.btnSettingsClose.addEventListener('click', closeSettingsModal);
  }
  if (UIElements.btnSettingsSave) {
    UIElements.btnSettingsSave.addEventListener('click', saveSettingsApiKey);
  }

  // Close on clicking outside the modal box
  if (UIElements.settingsModal) {
    UIElements.settingsModal.addEventListener('click', (e) => {
      if (e.target === UIElements.settingsModal) {
        closeSettingsModal();
      }
    });
  }
}

function openSettingsModal() {
  const savedKey = localStorage.getItem('gemini_api_key') || '';
  UIElements.settingsApiKey.value = savedKey;
  UIElements.settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
  UIElements.settingsModal.style.display = 'none';
}

function saveSettingsApiKey() {
  const key = UIElements.settingsApiKey.value.trim();
  if (!key) {
    alert("Kunci API tidak boleh kosong.");
    return;
  }
  localStorage.setItem('gemini_api_key', key);
  closeSettingsModal();
  alert("Pengaturan kunci API berhasil disimpan!");
}

// 4. CHAT HANDLERS & DIRECT GEMINI API CALLS
function setupChatHandlers() {
  // Suggestion Chips handler (copies text to input, does NOT send automatically)
  const chips = document.querySelectorAll('.suggestion-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      UIElements.chatInput.value = chip.innerText;
      UIElements.chatInput.focus();
    });
  });

  // Send message on click
  UIElements.btnSendChat.addEventListener('click', sendMessage);

  // Send message on Enter key (except with Shift key)
  UIElements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Send Message Flow
async function sendMessage() {
  const text = UIElements.chatInput.value.trim();
  if (!text) return;

  const apiKey = GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    alert("Silakan masukkan Gemini API Key terlebih dahulu di berkas static/js/script.js pada baris 'const GEMINI_API_KEY = \"...\";'.");
    return;
  }

  // Clear input area immediately
  UIElements.chatInput.value = '';

  // Append user bubble to UI
  appendChatBubble(text, 'user');

  // Update in-memory state history
  RengkuhState.ceritaHistory.push({ role: 'user', message: text });

  // Scroll to bottom of chat logs
  scrollChatToBottom();

  // Show typing loader
  const loaderId = showPulseLoader();

  // Disable controls during response wait
  toggleChatControls(false);

  try {
    // Call Gemini directly from browser client side
    // We pass slice(0, -1) to represent past history turns (excluding current message)
    const resultJson = await callGeminiDirect(text, RengkuhState.ceritaHistory.slice(0, -1), apiKey);

    removePulseLoader(loaderId);

    const aiResponseText = resultJson.aiMessage || "Maaf, saya tidak dapat memproses tanggapan saat ini.";

    // Append AI bubble to UI
    appendChatBubble(aiResponseText, 'ai');

    // Update state history
    RengkuhState.ceritaHistory.push({ role: 'ai', message: aiResponseText });

    // Render summary if ready
    if (resultJson.readyForSummary && resultJson.reflectionSummary) {
      RengkuhState.reflectionSummary = resultJson.reflectionSummary;
      renderReflectionCards(resultJson.reflectionSummary);
    }
  } catch (error) {
    removePulseLoader(loaderId);
    console.error('Chat Error:', error);
    appendChatBubble(`Maaf Bu, Rengkuh mengalami gangguan. Pastikan API Key Anda sudah benar. (${error.message})`, 'ai');
  } finally {
    toggleChatControls(true);
    scrollChatToBottom();
  }
}

// Direct Client-Side Gemini Call
async function callGeminiDirect(currentMessage, pastHistory, apiKey) {
  // Build combined system prompt instructions
  const combinedSystemPrompt = `
${chatSystemInstruction}

---

INSTRUKSI OUTPUT TAMBAHAN (PENTING):
Setiap kali Anda membalas pesan pengguna, kembalikan respons Anda dalam format JSON berikut:

{
  "aiMessage": "Balasan empati Anda di sini (2-4 kalimat, hangat, tanpa menghakimi)",
  "readyForSummary": false,
  "reflectionSummary": null
}

Jika Anda menilai bahwa percakapan sudah cukup mendalam secara emosional (pengguna sudah berbagi perasaan spesifik, situasi, atau beban nyata yang dirasakan), ubah readyForSummary menjadi true dan isi:

{
  "aiMessage": "Balasan empati Anda di sini",
  "readyForSummary": true,
  "reflectionSummary": {
    "dominantEmotion": "Pernyataan singkat emosi dominan (misal: 'Kelelahan yang mendalam namun penuh kasih.')",
    "personalStrengths": "Pernyataan singkat kekuatan diri (misal: 'Ketabahan dan empati luar biasa.')",
    "smallAction": "Satu tindakan self-care kecil yang konkret (misal: 'Minum air hangat dan bernapas 1 menit.')",
    "intisariHariIni": "Pesan hangat validasi emosional (misal: 'Anda sedang melewati masa sulit, dan itu tidak apa-apa.')"
  }
}

Aturan refleksi dari prompt cerita_summary:
${summaryPromptSchema}

PENTING:
- JANGAN mengulang-ulang kalimat penutup, slogan, atau basa-basi seperti "Saya siap mendengarkan...", "Rengkuh siap menemani...", "Ceritakan saja...", atau sejenisnya di setiap akhir pesan. Biarkan obrolan mengalir secara alami dan hangat seperti percakapan sehari-hari dengan sahabat dekat tanpa kalimat penutup yang monoton.
- Keluaran Anda harus berupa JSON murni yang valid, tanpa dibungkus markdown atau teks lain.
- Nilai readyForSummary harus false jika percakapan masih sangat awal (kurang dari 2-3 pesan pengguna yang bermakna).
- Jangan pernah membuat refleksi yang dikarang-karang. Hanya buat berdasarkan apa yang benar-benar diceritakan pengguna.
`;

  // Format contents array for Gemini REST API
  // Schema: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
  const contents = [];

  // Add history
  pastHistory.forEach(turn => {
    contents.push({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.message }]
    });
  });

  // Add current user input
  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }]
  });

  // REST API request for gemini-3.5-flash (Standard model with broad availability)
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: contents,
      systemInstruction: {
        parts: [{ text: combinedSystemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errMsg = errorData.error?.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error("Tidak menerima respon teks dari model AI.");
  }

  // Clean and parse JSON response
  let rawJsonText = textOutput.trim();
  if (rawJsonText.startsWith("```")) {
    const lines = rawJsonText.split("\n");
    if (lines[0].includes("json")) {
      rawJsonText = lines.slice(1, -1).join("\n");
    } else {
      rawJsonText = lines.slice(1, -1).join("\n");
    }
  }

  return JSON.parse(rawJsonText);
}

// Append bubble helper
function appendChatBubble(message, sender) {
  const msgGroup = document.createElement('div');
  msgGroup.className = `msg-group msg-group-${sender}`;

  const senderLabel = document.createElement('span');
  senderLabel.className = 'msg-sender-lbl';
  senderLabel.innerText = sender === 'user' ? 'Anda' : '🌿 Rengkuh';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerText = message;

  const timeLabel = document.createElement('span');
  timeLabel.className = 'msg-time';
  timeLabel.innerText = formatCurrentTime();

  bubble.appendChild(timeLabel);
  msgGroup.appendChild(senderLabel);
  msgGroup.appendChild(bubble);

  UIElements.chatLogs.appendChild(msgGroup);
}

// Pulse Loader helpers
function showPulseLoader() {
  const loader = document.createElement('div');
  const loaderId = 'loader-' + Date.now();
  loader.id = loaderId;
  loader.className = 'pulse-loader';
  loader.innerHTML = '<span class="pulse-dot"></span><span class="pulse-dot"></span><span class="pulse-dot"></span>';
  UIElements.chatLogs.appendChild(loader);
  scrollChatToBottom();
  return loaderId;
}

function removePulseLoader(id) {
  const loader = document.getElementById(id);
  if (loader) loader.remove();
}

function scrollChatToBottom() {
  UIElements.chatLogs.scrollTop = UIElements.chatLogs.scrollHeight;
}

function toggleChatControls(enable) {
  UIElements.chatInput.disabled = !enable;
  UIElements.btnSendChat.disabled = !enable;
  if (enable) {
    UIElements.chatInput.focus();
  }
}

// 5. REFLECTION CARDS RENDERER (DYNAMIC BASED ON JSON KEYS)
function renderReflectionCards(summaryJSON) {
  // Hide placeholder first
  if (UIElements.reflectionPlaceholder) {
    UIElements.reflectionPlaceholder.style.display = 'none';
  }

  // Clear existing cards
  const existingCards = UIElements.reflectionContainer.querySelectorAll('.reflection-card');
  existingCards.forEach(c => c.remove());

  // Key configurations for icons, colors, and titles
  const keyConfigMap = {
    dominantEmotion: { title: 'Emosi Dominan', icon: '💛', colorClass: 'yellow' },
    personalStrengths: { title: 'Kekuatan', icon: '🌱', colorClass: 'green' },
    smallAction: { title: 'Langkah Kecil', icon: '✨', colorClass: 'yellow' },
    intisariHariIni: { title: 'Intisari Hari Ini', icon: '📝', colorClass: 'grey' }
  };

  // Loop through keys and create cards dynamically
  Object.keys(summaryJSON).forEach(key => {
    const value = summaryJSON[key];
    if (!value) return;

    const displayVal = Array.isArray(value) ? value.join(', ') : value;

    // Use default values for dynamic keys not defined in config
    const config = keyConfigMap[key] || {
      title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      icon: '🌿',
      colorClass: 'grey'
    };

    const card = document.createElement('div');
    card.className = `reflection-card card-${config.colorClass}`;
    card.innerHTML = `
      <div class="card-header-row">
        <span class="card-icon">${config.icon}</span>
        <span class="card-title">${config.title}</span>
      </div>
      <p class="card-quote">'${displayVal}'</p>
    `;

    // Append at the bottom of the container
    UIElements.reflectionContainer.appendChild(card);
  });
}

// 6. MICROPHONE VOICE TO TEXT LOGIC
function setupVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    UIElements.btnVoiceInput.style.display = 'none'; // Hide if unsupported
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID'; // Bahasa Indonesia
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let isRecording = false;

  UIElements.btnVoiceInput.addEventListener('click', () => {
    if (isRecording) {
      recognition.stop();
      UIElements.btnVoiceInput.style.color = 'var(--color-text-secondary)';
      isRecording = false;
    } else {
      recognition.start();
      UIElements.btnVoiceInput.style.color = 'var(--color-primary)';
      isRecording = true;
    }
  });

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    UIElements.chatInput.value += (UIElements.chatInput.value ? ' ' : '') + text;
    UIElements.chatInput.focus();
  };

  recognition.onerror = (e) => {
    console.error('Speech recognition error:', e.error);
    UIElements.btnVoiceInput.style.color = 'var(--color-text-secondary)';
    isRecording = false;
  };

  recognition.onend = () => {
    UIElements.btnVoiceInput.style.color = 'var(--color-text-secondary)';
    isRecording = false;
  };
}

// 7. LANDING PAGE ACCORDION LOGIC
function setupFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    // Initially hide answers
    answer.style.display = 'none';

    question.addEventListener('click', () => {
      const isVisible = answer.style.display === 'block';

      // Close all answers
      document.querySelectorAll('.faq-answer').forEach(ans => ans.style.display = 'none');
      document.querySelectorAll('.faq-arrow').forEach(arr => arr.style.transform = 'rotate(0deg)');

      if (!isVisible) {
        answer.style.display = 'block';
        item.querySelector('.faq-arrow').style.transform = 'rotate(180deg)';
      }
    });
  });
}
