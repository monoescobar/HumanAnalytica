// main.js for Human Analytica - extracted from index.html

console.log('Dreams and Poems - Simple Video Player Starting...');

function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

let currentVideoIndex = 0;
let videoList = [];
let isPlaying = false;
let video = document.getElementById('video');
let video2 = document.getElementById('video2');
let activeVideo = video;
let inactiveVideo = video2;
let deviceInfo = document.getElementById('device-info');
let loading = document.getElementById('loading');
let soundNotification = document.getElementById('sound-notification');
let nextButton = document.getElementById('next-button');
let humanAnalyticaButton = document.getElementById('human-analytica-button');
let infoArea = document.getElementById('info-area');
let notificationTimeout;
let deviceInfoTimeout;
let infoVisible = false;
let infoAreaVisible = false;
let isTransitioning = false;
let hasShownLoadingOnce = false;
let hasShownInitialInstructions = false;
let soundToggleCount = 0;
let loadingToggleCount = 0;

const linkedInProfile = 'https://www.linkedin.com/in/carlos-escobar-32156b24/';

function updateStatus(message) {
    console.log(message);
}

function getTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

function setBottomButtonWidthsToWord(word) {
    const haBtn = document.getElementById('human-analytica-button');
    const infoBtn = document.getElementById('next-button');
    if (!haBtn || !infoBtn) return;
    const style = window.getComputedStyle(haBtn);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const textWidth = getTextWidth(word, font);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const totalWidth = Math.ceil(textWidth + padding);
    haBtn.style.width = totalWidth + 'px';
    infoBtn.style.width = totalWidth + 'px';
    haBtn.style.minWidth = totalWidth + 'px';
    infoBtn.style.minWidth = totalWidth + 'px';
    haBtn.style.maxWidth = totalWidth + 'px';
    infoBtn.style.maxWidth = totalWidth + 'px';
}

function init() {
    setBottomButtonWidthsToWord('Human Analytica');
    try {
        updateStatus('Checking video URLs...');
        if (!window.VIDEO_URLS) {
            updateStatus('ERROR: Video URLs not found');
            return;
        }
        const mobile = isMobile();
        videoList = mobile ? window.VIDEO_URLS.mobile : window.VIDEO_URLS.desktop;
        updateStatus(`Found ${videoList.length} videos for ${mobile ? 'mobile' : 'desktop'}`);
        if (videoList.length === 0) {
            updateStatus('ERROR: No videos available');
            return;
        }
        shuffleArray(videoList);
        document.getElementById('device-type').textContent = `Device: ${mobile ? 'Mobile' : 'Desktop'}`;
        document.getElementById('video-count').textContent = `Videos: ${videoList.length}`;
        document.getElementById('sound-status').textContent = `Sound: ${activeVideo.muted ? 'Off' : 'On'}`;
        document.getElementById('last-modified').textContent = `Modified: 25:08:09:16:08:38`;
        console.log(`Initialized for ${mobile ? 'mobile' : 'desktop'} with ${videoList.length} videos`);
        console.log('Video list:', videoList.slice(0, 3));
        loadVideo(0);
        showInitialNotification();
    } catch (error) {
        console.error('Initialization error:', error);
        updateStatus('ERROR: Initialization failed');
    }
}

function loadNextVideo(showUI = true) {
    if (isTransitioning) return;
    const isUserTriggered = showUI === true;
    soundNotification.classList.remove('show');
    if (isUserTriggered) {
        loadingToggleCount++;
        console.log(`📺 Loading toggle count: ${loadingToggleCount}`);
        if (loadingToggleCount <= 1) {
            loading.classList.add('show');
            console.log(`✅ Showing loading screen (toggle ${loadingToggleCount}/1)`);
        } else {
            console.log(`❌ Loading screen hidden (toggle ${loadingToggleCount} > 1)`);
        }
        // Only show bottom buttons if not in fullscreen
        if (!document.fullscreenElement) {
            nextButton.classList.add('show');
            humanAnalyticaButton.classList.add('show');
        } else {
            nextButton.classList.remove('show');
            humanAnalyticaButton.classList.remove('show');
        }
        hasShownLoadingOnce = true;
        if (notificationTimeout) clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            loading.classList.remove('show');
            nextButton.classList.remove('show');
            humanAnalyticaButton.classList.remove('show');
            console.log('🔧 Backup timeout: Force hiding loading UI (double click/tap)');
        }, 4000);
    }
    const nextIndex = (currentVideoIndex + 1) % videoList.length;
    console.log(`Loading next video: ${nextIndex + 1}/${videoList.length}${isUserTriggered ? ' (with UI)' : ' (silent)'}`);
    isTransitioning = true;
    const videoUrl = videoList[nextIndex];
    const fileName = videoUrl.split('/').pop().split('?')[0];
    inactiveVideo.src = videoUrl;
    inactiveVideo.muted = activeVideo.muted;
    inactiveVideo.load();
    inactiveVideo.onloadeddata = () => {
        console.log('Next video loaded, starting crossfade...');
        inactiveVideo.play().then(() => {
            activeVideo.style.opacity = '0';
            inactiveVideo.style.opacity = '1';
            setTimeout(() => {
                activeVideo.pause();
                activeVideo.style.opacity = '0';
                [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
                activeVideo.style.opacity = '1';
                inactiveVideo.style.opacity = '0';
                currentVideoIndex = nextIndex;
                document.getElementById('current-video').textContent = `Now: ${fileName}`;
                // Do NOT hide the UI here if isUserTriggered, let the notificationTimeout handle it
                isTransitioning = false;
                console.log('Crossfade complete - active video opacity:', activeVideo.style.opacity, 'inactive video opacity:', inactiveVideo.style.opacity);
            }, 800);
        }).catch(error => {
            console.log('Error playing next video:', error);
            if (isUserTriggered) {
                loading.classList.remove('show');
                nextButton.classList.remove('show');
                humanAnalyticaButton.classList.remove('show');
            }
            isTransitioning = false;
        });
    };
    inactiveVideo.onerror = () => {
        console.log('Error loading next video, trying another...');
        if (isUserTriggered) {
            loading.classList.remove('show');
            nextButton.classList.remove('show');
            humanAnalyticaButton.classList.remove('show');
        }
        isTransitioning = false;
        setTimeout(() => loadNextVideo(isUserTriggered), 1000);
    };
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadVideo(index) {
    try {
        if (index >= videoList.length) index = 0;
        currentVideoIndex = index;
        const videoUrl = videoList[index];
        const fileName = videoUrl.split('/').pop().split('?')[0];
        updateStatus(`Loading video ${index + 1}/${videoList.length}...`);
        console.log(`Loading video ${index + 1}/${videoList.length}: ${videoUrl}`);
        activeVideo.src = videoUrl;
        activeVideo.load();
        activeVideo.onloadeddata = () => {
            console.log('Video loaded successfully');
            document.getElementById('current-video').textContent = `Now: ${fileName}`;
            activeVideo.play().then(() => {
                isPlaying = true;
                console.log('Video playing');
            }).catch(error => {
                console.log('Autoplay prevented:', error);
            });
        };
        activeVideo.onerror = (error) => {
            console.error('Video error:', error);
            setTimeout(() => {
                const nextIndex = (currentVideoIndex + 1) % videoList.length;
                loadVideo(nextIndex);
            }, 1000);
        };
        activeVideo.onended = () => {
            loadNextVideo(false);
        };
    } catch (error) {
        console.error('Error loading video:', error);
        setTimeout(() => {
            const nextIndex = (currentVideoIndex + 1) % videoList.length;
            loadVideo(nextIndex);
        }, 1000);
    }
}

function openHumanAnalytica() {
    window.open('https://escob.art', '_self');
    console.log('Opening escob.art website in same tab');
}

function toggleInfoArea() {
    console.log('Info area toggle requested, current state:', infoAreaVisible);
    if (infoAreaVisible) {
        infoArea.classList.remove('show');
        infoAreaVisible = false;
        console.log('Info area hidden');
        console.log('Bottom buttons remain hidden until next user interaction');
    } else {
        infoArea.classList.add('show');
        infoAreaVisible = true;
        nextButton.classList.remove('show');
        humanAnalyticaButton.classList.remove('show');
        console.log('Info area shown, bottom buttons hidden');
    }
}

function toggleMute() {
    loading.classList.remove('show');
    const newMutedState = !activeVideo.muted;
    activeVideo.muted = newMutedState;
    inactiveVideo.muted = newMutedState;
    if (!newMutedState && activeVideo.paused) {
        activeVideo.load();
        activeVideo.play().catch(error => {
            console.log('Audio context may be suspended, trying to resume...');
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (window.audioContext && window.audioContext.state === 'suspended') {
                    window.audioContext.resume();
                }
            }
        });
    }
    showSoundNotification();
    console.log(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);
}

function showInitialNotification() {
    const text = soundNotification.querySelector('.text');
    const mobile = isMobile();
    if (mobile) {
        text.innerHTML = 'One Tap<br>Sound On<br><br>Two Taps<br>Next One';
    } else {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        if (isMac) {
            text.innerHTML = 'One Click Sound On<br><br>Two Clicks Next One<br><br>Cmd + Click Full Screen';
        } else {
            text.innerHTML = 'One Click Sound On<br><br>Two Clicks Next One<br><br>Ctrl + Click Full Screen';
        }
    }
    document.getElementById('sound-status').textContent = `Sound: ${activeVideo.muted ? 'Off' : 'On'}`;
    clearTimeout(notificationTimeout);
    if (!document.fullscreenElement) {
        soundNotification.classList.add('show');
        nextButton.classList.add('show');
        humanAnalyticaButton.classList.add('show');
    } else {
        soundNotification.classList.remove('show');
        nextButton.classList.remove('show');
        humanAnalyticaButton.classList.remove('show');
        // Prevent notificationTimeout from showing/hiding in fullscreen
        if (notificationTimeout) clearTimeout(notificationTimeout);
        return;
    }
    const hideDelay = 4000;
    notificationTimeout = setTimeout(() => {
        soundNotification.classList.remove('show');
        nextButton.classList.remove('show');
        humanAnalyticaButton.classList.remove('show');
        hasShownInitialInstructions = true;
    }, hideDelay);
}

function showSoundNotification() {
    const text = soundNotification.querySelector('.text');
    const mobile = isMobile();
    if (activeVideo.muted) {
        text.textContent = 'Sound Off';
    } else {
        text.textContent = 'Sound On';
    }
    document.getElementById('sound-status').textContent = `Sound: ${activeVideo.muted ? 'Off' : 'On'}`;
    clearTimeout(notificationTimeout);
    if (!hasShownInitialInstructions) {
        hasShownInitialInstructions = true;
        console.log('🔧 Early interaction detected - marking initial instructions as shown');
    }
    soundToggleCount++;
    console.log(`🔊 Sound toggle count: ${soundToggleCount}`);
    if (soundToggleCount <= 2) {
        soundNotification.classList.add('show');
        console.log(`✅ Showing sound notification (toggle ${soundToggleCount}/2)`);
    } else {
        console.log(`❌ Sound notification hidden (toggle ${soundToggleCount} > 2)`);
    }
    if (!document.fullscreenElement) {
        soundNotification.classList.add('show');
        nextButton.classList.add('show');
        humanAnalyticaButton.classList.add('show');
    } else {
        soundNotification.classList.remove('show');
        nextButton.classList.remove('show');
        humanAnalyticaButton.classList.remove('show');
        if (notificationTimeout) clearTimeout(notificationTimeout);
        return;
    }
// Hide sound notification immediately if entering fullscreen
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        soundNotification.classList.remove('show');
        nextButton.classList.remove('show');
        humanAnalyticaButton.classList.remove('show');
        if (notificationTimeout) clearTimeout(notificationTimeout);
    }
});
    notificationTimeout = setTimeout(() => {
        soundNotification.classList.remove('show');
        nextButton.classList.remove('show');
        humanAnalyticaButton.classList.remove('show');
    }, 4000);
}

function toggleDeviceInfo() {
    console.log('🔧 toggleDeviceInfo() CALLED');
    console.log('📋 Device info element exists:', !!deviceInfo);
    console.log('📋 Current classes:', deviceInfo.className);
    console.log('📋 Current opacity:', window.getComputedStyle(deviceInfo).opacity);
    clearTimeout(deviceInfoTimeout);
    console.log('⏰ Cleared existing timeout');
    infoVisible = true;
    deviceInfo.classList.add('show');
    console.log('✅ Added "show" class to device info');
    console.log('📋 New classes after show:', deviceInfo.className);
    deviceInfo.offsetHeight;
    console.log('🔄 Forced style recalculation');
    setTimeout(() => {
        const computedOpacity = window.getComputedStyle(deviceInfo).opacity;
        console.log('📋 Computed opacity after show:', computedOpacity);
        if (computedOpacity === '0') {
            console.log('⚠️ WARNING: Opacity is still 0 - CSS might not be applied');
        } else {
            console.log('✅ SUCCESS: Device info should be visible');
        }
    }, 100);
    console.log('✅ DEVICE INFO SHOWN - 3-finger gesture detected successfully!');
    deviceInfoTimeout = setTimeout(() => {
        infoVisible = false;
        deviceInfo.classList.remove('show');
        console.log('⏰ Device info auto-hidden after 4 seconds');
    }, 4000);
}

function attachVideoEventListeners() {
    const videoContainer = document.getElementById('video-container');
    let touchStartTime = 0;
    let clickCount = 0;
    let clickTimer = null;
    videoContainer.addEventListener('click', (e) => {
        if (!isMobile() && (e.ctrlKey || e.metaKey)) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoContainer.requestFullscreen();
            }
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }, true);
    let tapCount = 0;
    let tapTimer = null;
    let lastTapTime = 0;
    let gestureStartTime = 0;
    let maxFingers = 0;
    let gestureTimer = null;
    let gestureInProgress = false;
    videoContainer.addEventListener('click', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        clickCount++;
        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                console.log('Single click detected - toggle mute');
                toggleMute();
                clickCount = 0;
            }, 400);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            console.log('Double click detected - load next video');
            loadNextVideo();
            clickCount = 0;
        }
    });
    videoContainer.addEventListener('touchstart', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        e.preventDefault();
        const fingers = e.touches.length;
        if (!gestureInProgress) {
            gestureInProgress = true;
            gestureStartTime = Date.now();
            maxFingers = fingers;
            console.log(`🎯 NEW GESTURE STARTED: ${fingers} finger(s)`);
            gestureTimer = setTimeout(() => {
                executeGesture();
            }, 200);
        } else {
            if (fingers > maxFingers) {
                maxFingers = fingers;
                console.log(`� GESTURE UPDATED: max fingers now ${maxFingers}`);
            }
        }
        console.log(`📍 Touch coordinates:`, Array.from(e.touches).map((t, i) => `F${i+1}:(${Math.round(t.clientX)}, ${Math.round(t.clientY)})`));
    });
    videoContainer.addEventListener('touchmove', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        const fingers = e.touches.length;
        if (gestureInProgress && fingers > maxFingers) {
            maxFingers = fingers;
            console.log(`🔄 GESTURE UPDATE: max fingers increased to ${maxFingers}`);
        }
    });
    videoContainer.addEventListener('touchend', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        const remainingTouches = e.touches.length;
        console.log(`👆 FINGER LIFTED: ${remainingTouches} finger(s) remaining`);
        if (remainingTouches === 0 && gestureInProgress) {
            console.log('🏁 ALL FINGERS LIFTED - executing gesture immediately');
            clearTimeout(gestureTimer);
            executeGesture();
        }
    });
    function executeGesture() {
        if (!gestureInProgress) return;
        const duration = Date.now() - gestureStartTime;
        console.log(`🎯 EXECUTING GESTURE: ${maxFingers} max fingers (${duration}ms duration)`);
        if (maxFingers === 1) {
            const currentTime = Date.now();
            if (currentTime - lastTapTime < 400) {
                clearTimeout(tapTimer);
                console.log('✅ DOUBLE TAP → NEXT VIDEO');
                loadNextVideo();
                tapCount = 0;
            } else {
                tapCount = 1;
                tapTimer = setTimeout(() => {
                    if (tapCount === 1) {
                        console.log('✅ SINGLE TAP → TOGGLE SOUND');
                        toggleMute();
                    }
                    tapCount = 0;
                }, 400);
            }
            lastTapTime = currentTime;
        } else if (maxFingers === 2) {
            console.log('✅ 2 FINGERS → SHOW INFO AREA');
            toggleDeviceInfo();
        } else if (maxFingers >= 3) {
            console.log(`✅ ${maxFingers} FINGERS → SHOW INFO AREA (multi-touch)`);
            toggleDeviceInfo();
        } else {
            console.log('❌ No valid gesture detected');
        }
        gestureInProgress = false;
        maxFingers = 0;
        gestureStartTime = 0;
    }
    videoContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'enter':
            e.preventDefault();
            if (activeVideo.paused) {
                activeVideo.play();
            } else {
                loadNextVideo();
            }
            break;
        case 'm':
            toggleMute();
            break;
        case 'i':
            toggleDeviceInfo();
            break;
        case 't':
            console.log('🧪 TEST: Manual device info toggle');
            toggleDeviceInfo();
            break;
    }
});
attachVideoEventListeners();
if (!isMobile()) {
    setTimeout(() => {
        const infoArea = document.getElementById('info-area');
        if (infoArea && !document.getElementById('fullscreen-hint')) {
            let hint = document.createElement('div');
            hint.className = 'close-hint';
            hint.id = 'fullscreen-hint';
            hint.textContent = 'Ctrl+Click for fullscreen';
            infoArea.appendChild(hint);
        }
    }, 1000);
}
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isMobile()) {
        console.log('Page became visible again, checking audio state...');
        setTimeout(() => {
            if (!activeVideo.muted && (activeVideo.paused || activeVideo.currentTime === 0)) {
                console.log('Reloading video to restore audio context...');
                const currentIndex = currentVideoIndex;
                loadVideo(currentIndex);
            }
        }, 500);
    }
});
window.addEventListener('focus', () => {
    if (isMobile() && !activeVideo.muted && activeVideo.paused) {
        console.log('Window focused, attempting to resume video...');
        activeVideo.play().catch(error => {
            console.log('Could not resume, reloading video...');
            loadVideo(currentVideoIndex);
        });
    }
});
window.addEventListener('resize', () => {
    setBottomButtonWidthsToWord('Human Analytica');
});
humanAnalyticaButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (humanAnalyticaButton.classList.contains('show')) {
        openHumanAnalytica();
    }
});
humanAnalyticaButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
});
humanAnalyticaButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (humanAnalyticaButton.classList.contains('show')) {
        openHumanAnalytica();
    }
});
nextButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (nextButton.classList.contains('show')) {
        toggleInfoArea();
    }
});
nextButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
});
nextButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (nextButton.classList.contains('show')) {
        toggleInfoArea();
    }
});
infoArea.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (infoAreaVisible) {
        toggleInfoArea();
    }
});
infoArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
});
infoArea.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (infoAreaVisible) {
        toggleInfoArea();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    setBottomButtonWidthsToWord('Human Analytica');
    console.log('DOM Content Loaded, initializing...');
    init();
});
window.addEventListener('load', () => {
    console.log('Window loaded');
    if (videoList.length === 0) {
        console.log('Fallback initialization...');
        setTimeout(init, 500);
    }
});
console.log('Dreams and Poems - Simple Video Player Script Loaded');
window.testDeviceInfo = function() {
    console.log('🧪 GLOBAL TEST: Testing device info display');
    toggleDeviceInfo();
};
window.testThreeFingers = function() {
    console.log('🧪 SIMULATING 3-FINGER TOUCH');
    console.log('📋 Device info element:', deviceInfo);
    console.log('👀 Current classes:', deviceInfo.className);
    toggleDeviceInfo();
};
