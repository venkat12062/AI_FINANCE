document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Protection
    if (typeof Auth !== 'undefined') {
        Auth.protectPage();
    }

    // 2. User Info
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    if (user) {
        const nameEl = document.getElementById('sidebar-user-name');
        const avatarEl = document.getElementById('sidebar-avatar');
        if (nameEl) nameEl.textContent = user.name || 'Account';
        if (avatarEl) avatarEl.textContent = (user.name ? user.name.charAt(0) : 'U').toUpperCase();
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    // Mobile Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // 3. DOM Elements
    const voiceStage = document.querySelector('.voice-stage');
    const statusText = document.getElementById('voice-status-text');
    const subText = document.getElementById('voice-sub-text');
    const audioWave = document.getElementById('audio-wave');
    const startBtn = document.getElementById('start-listen-btn');
    const btnText = document.getElementById('listen-btn-text');
    const transcriptContent = document.getElementById('transcript-content');
    const assistantBadge = document.getElementById('assistant-badge');
    const manualInput = document.getElementById('manual-text-input');
    const sendBtn = document.getElementById('send-text-btn');
    const ttsBtn = document.getElementById('tts-toggle-btn');
    const ttsIcon = document.getElementById('tts-icon');
    const recBadge = document.getElementById('rec-badge');
    const recTimer = document.getElementById('rec-timer');
    const permBanner = document.getElementById('mic-perm-banner');
    const grantMicBtn = document.getElementById('grant-mic-btn');
    const audioPlaybackContainer = document.getElementById('audio-playback-container');
    const voiceAudioPlayer = document.getElementById('voice-audio-player');

    let isRecording = false;
    let recognition = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let recStartTime = 0;
    let recInterval = null;
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let animId = null;
    let recognizedText = '';
    let ttsEnabled = true;

    // Format Rupee (₹ / INR)
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

    const showAlert = (message, isError = false) => {
        const globalAlert = document.getElementById('global-alert');
        if (!globalAlert) return;
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        globalAlert.classList.remove('hidden');
        setTimeout(() => globalAlert.classList.add('hidden'), 5000);
    };

    // 4. TTS (Text to Speech Audio Response)
    if (ttsBtn) {
        ttsBtn.addEventListener('click', () => {
            ttsEnabled = !ttsEnabled;
            if (ttsEnabled) {
                ttsIcon.className = 'fas fa-volume-high';
                ttsBtn.style.color = 'var(--primary)';
                showAlert('Voice audio speech response enabled');
            } else {
                ttsIcon.className = 'fas fa-volume-xmark';
                ttsBtn.style.color = 'var(--text-muted)';
                showAlert('Voice audio response muted');
            }
        });
    }

    const speakResponse = (text) => {
        if (!ttsEnabled || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            const cleanText = text.replace(/[✅❌⚠️$*₹]/g, ' Rupees ');
            const utter = new SpeechSynthesisUtterance(cleanText);
            utter.rate = 1.0;
            utter.pitch = 1.0;
            window.speechSynthesis.speak(utter);
        } catch (e) {
            console.warn('TTS error:', e);
        }
    };

    // 5. Speech Recognition Setup (Web Speech API)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-IN'; // Indian English
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                let text = '';
                for (let i = 0; i < event.results.length; ++i) {
                    text += event.results[i][0].transcript;
                }
                const clean = text.trim();
                if (clean) {
                    recognizedText = clean;
                    transcriptContent.innerHTML = `
                        <div class="user-speech"><i class="fas fa-microphone text-primary"></i> "${clean}"</div>
                    `;
                }
            };

            recognition.onerror = (e) => {
                console.warn('Speech recognition event notice:', e.error);
                if (e.error === 'not-allowed') {
                    permBanner.style.display = 'block';
                }
            };
        } catch (err) {
            console.warn('Speech recognition init notice:', err);
        }
    }

    // 6. Microphone Permission Check & Grant
    const checkMicPermission = async () => {
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const status = await navigator.permissions.query({ name: 'microphone' });
                if (status.state === 'denied') {
                    permBanner.style.display = 'block';
                } else {
                    permBanner.style.display = 'none';
                }
                status.onchange = () => {
                    if (status.state === 'granted') permBanner.style.display = 'none';
                    else if (status.state === 'denied') permBanner.style.display = 'block';
                };
            } catch (e) {}
        }
    };
    checkMicPermission();

    if (grantMicBtn) {
        grantMicBtn.addEventListener('click', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop());
                permBanner.style.display = 'none';
                showAlert('Microphone access granted successfully! Click "Start Voice Recording" to begin.');
            } catch (e) {
                showAlert('Could not access microphone. Please check your browser URL bar settings icon.', true);
            }
        });
    }

    // 7. Start Voice Recording Function
    const startRecording = async () => {
        try {
            recognizedText = '';
            audioChunks = [];

            // A. Open Microphone Hardware Stream
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true }
            });

            // B. Setup Real MediaRecorder
            mediaRecorder = new MediaRecorder(micStream);
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) audioChunks.push(e.data);
            };
            mediaRecorder.onstop = () => {
                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    voiceAudioPlayer.src = audioUrl;
                    audioPlaybackContainer.style.display = 'block';
                }
            };
            mediaRecorder.start(100);

            // C. Start Web Audio API Visualizer
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(micStream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 32;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const bars = document.querySelectorAll('.audio-wave .bar');

            const animateWave = () => {
                if (!isRecording) return;
                analyser.getByteFrequencyData(dataArray);
                bars.forEach((bar, index) => {
                    const val = dataArray[index % dataArray.length] || 0;
                    const scale = Math.max(0.2, (val / 128) * 1.8);
                    bar.style.transform = `scaleY(${scale})`;
                });
                animId = requestAnimationFrame(animateWave);
            };
            animateWave();

            // D. Start Speech Recognition in parallel
            if (recognition) {
                try {
                    recognition.start();
                } catch (e) {
                    console.warn('Recognition start retry');
                }
            }

            // E. UI Updates
            isRecording = true;
            voiceStage.classList.add('listening');
            audioWave.style.display = 'flex';
            recBadge.style.display = 'flex';
            statusText.textContent = 'Recording your voice... Speak now!';
            subText.textContent = 'Speak a command (e.g. "I spent ₹500 on Food", "Remaining budget")';
            btnText.textContent = 'Stop Recording';
            assistantBadge.textContent = 'Recording...';
            assistantBadge.className = 'badge badge-danger';

            transcriptContent.innerHTML = `
                <div class="user-speech" style="color:var(--text-muted);">
                    <i class="fas fa-circle-dot text-danger fa-fade"></i> <em>Listening to microphone...</em>
                </div>
            `;

            // Start Timer
            recStartTime = Date.now();
            recInterval = setInterval(() => {
                const elapsedSec = Math.floor((Date.now() - recStartTime) / 1000);
                const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
                const secs = String(elapsedSec % 60).padStart(2, '0');
                recTimer.textContent = `${mins}:${secs}`;
            }, 1000);

        } catch (err) {
            console.error('Recording initialization error:', err);
            permBanner.style.display = 'block';
            showAlert('Microphone access blocked. Click "Grant Microphone Access" or use the command buttons below.', true);
            stopRecording(false);
        }
    };

    // 8. Stop Voice Recording Function
    const stopRecording = (shouldProcess = true) => {
        isRecording = false;
        clearInterval(recInterval);

        voiceStage.classList.remove('listening');
        audioWave.style.display = 'none';
        recBadge.style.display = 'none';
        btnText.textContent = 'Start Voice Recording';
        statusText.textContent = 'Click the microphone to start voice recording';
        subText.textContent = '"I spent ₹500 on groceries today" or "What is my remaining budget?"';
        assistantBadge.textContent = 'Ready';
        assistantBadge.className = 'badge badge-primary';

        if (animId) cancelAnimationFrame(animId);

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            try { mediaRecorder.stop(); } catch (e) {}
        }

        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            micStream = null;
        }

        if (audioContext && audioContext.state !== 'closed') {
            try { audioContext.close(); } catch (e) {}
        }

        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }

        if (shouldProcess) {
            const finalSpeech = recognizedText.trim();
            if (finalSpeech && finalSpeech.length >= 2) {
                processVoiceCommand(finalSpeech);
            } else {
                // If microphone recorded sound but STT didn't catch specific words
                transcriptContent.innerHTML = `
                    <div style="padding:0.75rem; background:var(--bg-surface-elevated); border-radius:var(--radius-md);">
                        <p style="margin:0 0 0.5rem 0; font-weight:600; color:var(--text-primary);"><i class="fas fa-check-circle text-success"></i> Audio recorded successfully!</p>
                        <span style="font-size:0.85rem; color:var(--text-secondary);">Select what you would like to log or pick a command below:</span>
                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.6rem;">
                            <button class="btn btn-secondary quick-log-btn" data-text="I spent 500 on Food" style="padding:0.35rem 0.75rem; font-size:0.8rem;">Log ₹500 Food Expense</button>
                            <button class="btn btn-secondary quick-log-btn" data-text="I spent 1200 on Travel" style="padding:0.35rem 0.75rem; font-size:0.8rem;">Log ₹1,200 Travel Expense</button>
                            <button class="btn btn-secondary quick-log-btn" data-text="What is my remaining budget?" style="padding:0.35rem 0.75rem; font-size:0.8rem;">Check Budget</button>
                        </div>
                    </div>
                `;
                document.querySelectorAll('.quick-log-btn').forEach(b => {
                    b.addEventListener('click', () => processVoiceCommand(b.dataset.text));
                });
            }
        }
    };

    // Main Listen/Stop Trigger Button
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording(true);
            } else {
                startRecording();
            }
        });
    }

    // 9. Process Voice Command via Backend API
    const processVoiceCommand = async (commandText) => {
        statusText.textContent = 'Processing with AI...';
        assistantBadge.textContent = 'Processing...';
        assistantBadge.className = 'badge badge-warning';

        try {
            const res = await Api.post('/voice/create-transaction', { voiceText: commandText });

            if (res.ok && res.data.success) {
                const answer = res.data.message || res.data.data?.answer || 'Command executed.';
                const txData = res.data.data?.data;
                const isTx = res.data.data?.type === 'transaction_created';

                let cardHTML = '';
                if (isTx && txData) {
                    cardHTML = `
                        <div style="margin-top:0.85rem; padding:1.15rem; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-md);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                                <span class="badge ${txData.type === 'Income' ? 'badge-success' : 'badge-danger'}">
                                    <i class="fas ${txData.type === 'Income' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
                                    ${txData.type} Added
                                </span>
                                <strong style="color:var(--text-primary); font-size:1.25rem;">${formatCurrency(txData.amount)}</strong>
                            </div>
                            <div style="font-size:0.875rem; color:var(--text-secondary); display:flex; gap:1.5rem; flex-wrap:wrap; margin-bottom:0.75rem;">
                                <span><i class="fas fa-tag text-primary"></i> <strong>Category:</strong> ${txData.category}</span>
                                <span><i class="fas fa-calendar text-secondary"></i> <strong>Date:</strong> ${txData.date}</span>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <a href="/pages/${txData.type === 'Income' ? 'income/income.html' : 'expenses/expenses.html'}" class="btn btn-secondary" style="padding:0.4rem 0.85rem; font-size:0.775rem;">
                                    <i class="fas fa-list"></i> View in ${txData.type}
                                </a>
                                <a href="/pages/dashboard/dashboard.html" class="btn btn-secondary" style="padding:0.4rem 0.85rem; font-size:0.775rem;">
                                    <i class="fas fa-chart-pie"></i> Go to Dashboard
                                </a>
                            </div>
                        </div>
                    `;
                }

                transcriptContent.innerHTML = `
                    <div class="user-speech"><i class="fas fa-microphone text-primary"></i> "${commandText}"</div>
                    <div class="assistant-response" style="margin-top:0.6rem; font-weight:600; color:var(--text-primary); font-size:1.05rem;">
                        <i class="fas fa-robot text-primary"></i> ${answer}
                    </div>
                    ${cardHTML}
                `;

                speakResponse(answer);
                showAlert(answer);
                loadVoiceHistory();
            } else {
                const errMsg = res.data.message || 'Could not understand command.';
                transcriptContent.innerHTML = `
                    <div class="user-speech"><i class="fas fa-user text-muted"></i> "${commandText}"</div>
                    <div class="assistant-response text-danger" style="margin-top:0.5rem;"><i class="fas fa-circle-exclamation"></i> ${errMsg}</div>
                `;
                speakResponse(errMsg);
                showAlert(errMsg, true);
            }
        } catch (err) {
            showAlert('Failed to process voice command.', true);
        } finally {
            assistantBadge.textContent = 'Ready';
            assistantBadge.className = 'badge badge-primary';
            statusText.textContent = 'Click the microphone to start voice recording';
        }
    };

    // 10. Fallback Text Input & Chips Handlers
    if (sendBtn && manualInput) {
        const handleSend = () => {
            const text = manualInput.value.trim();
            if (!text) return;
            manualInput.value = '';
            transcriptContent.innerHTML = `<div class="user-speech"><i class="fas fa-user text-muted"></i> "${text}"</div>`;
            processVoiceCommand(text);
        };

        sendBtn.addEventListener('click', handleSend);
        manualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // Command Chips (Instant 1-Click Execution)
    document.querySelectorAll('.command-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cmd = chip.dataset.cmd;
            transcriptContent.innerHTML = `<div class="user-speech"><i class="fas fa-user text-muted"></i> "${cmd}"</div>`;
            processVoiceCommand(cmd);
        });
    });

    // 11. Load Voice History Log
    const loadVoiceHistory = async () => {
        const tbody = document.getElementById('voice-history-tbody');
        if (!tbody) return;

        try {
            const res = await Api.get('/voice/history');
            if (res.ok && res.data.success) {
                const history = res.data.data;
                if (history.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No voice commands recorded yet.</td></tr>';
                    return;
                }

                tbody.innerHTML = history.map(item => `
                    <tr>
                        <td>${new Date(item.created_at).toLocaleString()}</td>
                        <td style="font-weight:600; color:var(--text-primary);">"${item.voice_text}"</td>
                        <td><span class="badge ${item.parsed_type === 'Income' ? 'badge-success' : (item.parsed_type === 'Expense' ? 'badge-danger' : 'badge-info')}">${item.parsed_type || 'Command'}</span></td>
                        <td>${item.parsed_category || 'General'}</td>
                        <td>${item.parsed_amount > 0 ? formatCurrency(item.parsed_amount) : '-'}</td>
                        <td>
                            <button class="btn btn-icon btn-secondary text-danger del-voice-btn" data-id="${item.voice_id}" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');

                // Bind delete buttons
                document.querySelectorAll('.del-voice-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.currentTarget.dataset.id;
                        if (confirm('Delete this voice history entry?')) {
                            const delRes = await Api.delete(`/voice/history/${id}`);
                            if (delRes.ok) {
                                showAlert('Voice entry deleted.');
                                loadVoiceHistory();
                            }
                        }
                    });
                });
            }
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load history.</td></tr>';
        }
    };

    // Initial Load
    loadVoiceHistory();
});
