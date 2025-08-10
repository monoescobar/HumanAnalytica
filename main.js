// main.js for Human Analytica - extracted from index.html

// Configuration object for timeouts and settings
const CONFIG = {
    timeouts: {
        ui: 3000,
        clickDelay: 300,
        tapDuration: 200,
        gestureDetection: 500,
        debugCheck: 5000,
        fullscreenHint: 2000,
        fallbackInit: 1000
    }
};

// Logger object for consistent logging
const LOGGER = {
    debug: (...args) => console.log('[DEBUG]', ...args),
    system: (...args) => console.log('[SYSTEM]', ...args),
    user: (...args) => console.log('[USER]', ...args),
    ui: (...args) => console.log('[UI]', ...args),
    video: (...args) => console.log('[VIDEO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args)
};

// Utility function to detect mobile devices
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

const VideoManager = {};
const UIStateManager = {};
// --- Move video logic into VideoManager ---
VideoManager.loadNextVideo = function(showUI = true) {
    if (STATE.isTransitioning) return;
    const isUserTriggered = showUI === true;
    ELEMENTS.soundNotification.classList.remove('show');
    
    if (isUserTriggered) {
        COUNTERS.loadingToggle++;
        LOGGER.debug(`Loading toggle count: ${COUNTERS.loadingToggle}`);
        if (COUNTERS.loadingToggle <= 1) {
            ELEMENTS.loading.classList.add('show');
            LOGGER.ui(`Showing loading screen (toggle ${COUNTERS.loadingToggle}/1)`);
        } else {
            LOGGER.debug(`Loading screen hidden (toggle ${COUNTERS.loadingToggle} > 1)`);
        }
        if (!document.fullscreenElement) {
            ELEMENTS.nextButton.classList.add('show');
            ELEMENTS.humanAnalyticaButton.classList.add('show');
        } else {
            ELEMENTS.nextButton.classList.remove('show');
            ELEMENTS.humanAnalyticaButton.classList.remove('show');
        }
        STATE.hasShownLoadingOnce = true;
        if (TIMEOUTS.notification) clearTimeout(TIMEOUTS.notification);
        TIMEOUTS.notification = setTimeout(() => {
            ELEMENTS.loading.classList.remove('show');
            ELEMENTS.nextButton.classList.remove('show');
            ELEMENTS.humanAnalyticaButton.classList.remove('show');
            LOGGER.debug('Backup timeout: Force hiding loading UI (double click/tap)');
        }, CONFIG.timeouts.ui);
    }
    
    const nextIndex = (STATE.currentVideoIndex + 1) % STATE.videoList.length;
    LOGGER.video(`Loading next video: ${nextIndex + 1}/${STATE.videoList.length}${isUserTriggered ? ' (with UI)' : ' (silent)'}`);
    STATE.isTransitioning = true;
    const videoUrl = STATE.videoList[nextIndex];
    const fileName = videoUrl.split('/').pop().split('?')[0];
    
    // Load the video in the inactive video element
    STATE.inactiveVideo.src = videoUrl;
    
    // Ensure the new video has the same muted state as the current one
    STATE.inactiveVideo.muted = STATE.activeVideo.muted;
    
    // Wait for the video to load, then transition
    const handleVideoLoad = () => {
        STATE.inactiveVideo.removeEventListener('loadeddata', handleVideoLoad);
        STATE.inactiveVideo.removeEventListener('error', handleVideoError);
        
        // Start playing the new video
        STATE.inactiveVideo.play().then(() => {
            // Fade out current video, fade in new video
            STATE.activeVideo.style.opacity = '0';
            STATE.inactiveVideo.style.opacity = '1';
            
            // Swap the video references
            const temp = STATE.activeVideo;
            STATE.activeVideo = STATE.inactiveVideo;
            STATE.inactiveVideo = temp;
            
            // Update the index
            STATE.currentVideoIndex = nextIndex;
            STATE.isTransitioning = false;
            
            LOGGER.video(`Video ${nextIndex + 1} loaded and playing: ${fileName}`);
            
            // Update UI elements only if this is the first video or user triggered
            if (STATE.currentVideoIndex === 0 || isUserTriggered) {
                updateNotificationText();
            }
        }).catch(error => {
            LOGGER.error('Error playing video:', error);
            STATE.isTransitioning = false;
        });
    };
    
    const handleVideoError = () => {
        STATE.inactiveVideo.removeEventListener('loadeddata', handleVideoLoad);
        STATE.inactiveVideo.removeEventListener('error', handleVideoError);
        LOGGER.error('Error loading video:', videoUrl);
        STATE.isTransitioning = false;
    };
    
    STATE.inactiveVideo.addEventListener('loadeddata', handleVideoLoad);
    STATE.inactiveVideo.addEventListener('error', handleVideoError);
};

function updateNotificationText() {
    const text = ELEMENTS.soundNotification.querySelector('.text');
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
    document.getElementById('sound-status').textContent = `Sound: ${STATE.activeVideo && STATE.activeVideo.muted ? 'Off' : 'On'}`;
}

VideoManager.toggleMute = function() {
    if (!STATE.activeVideo) {
        LOGGER.warn('No active video to toggle mute');
        return;
    }
    
    ELEMENTS.loading.classList.remove('show');
    const newMutedState = !STATE.activeVideo.muted;
    
    // Apply mute state to both videos
    STATE.activeVideo.muted = newMutedState;
    STATE.inactiveVideo.muted = newMutedState;
    
    // If unmuting and video is paused, try to play it
    if (!newMutedState) {
        if (STATE.activeVideo.paused) {
            STATE.activeVideo.play().catch(error => {
                LOGGER.debug('Error playing video:', error);
            });
        }
        
        // Try to resume audio context if suspended
        if (window.AudioContext || window.webkitAudioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!window.audioContext) {
                window.audioContext = new AudioContext();
            }
            if (window.audioContext.state === 'suspended') {
                window.audioContext.resume().then(() => {
                    LOGGER.debug('Audio context resumed');
                }).catch(err => {
                    LOGGER.debug('Error resuming audio context:', err);
                });
            }
        }
    }
    
    showSoundNotification();
    LOGGER.user(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);
};

VideoManager.transitionToNext = function(showUI = true) {
    VideoManager.loadNextVideo(showUI);
};

UIStateManager.toggleFullscreen = function() {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
            LOGGER.debug('Error exiting fullscreen:', err);
        });
    } else {
        ELEMENTS.videoContainer.requestFullscreen().catch(err => {
            LOGGER.debug('Error entering fullscreen:', err);
        });
    }
};

// DOM Element References
const ELEMENTS = {
    video: document.getElementById('video'),
    video2: document.getElementById('video2'),
    deviceInfo: document.getElementById('device-info'),
    loading: document.getElementById('loading'),
    soundNotification: document.getElementById('sound-notification'),
    nextButton: document.getElementById('next-button'),
    humanAnalyticaButton: document.getElementById('human-analytica-button'),
    infoArea: document.getElementById('info-area'),
    deviceType: document.getElementById('device-type'),
    videoCount: document.getElementById('video-count'),
    soundStatus: document.getElementById('sound-status'),
    lastModified: document.getElementById('last-modified'),
    currentVideo: document.getElementById('current-video'),
    videoContainer: document.getElementById('video-container')
};

// Application State
const STATE = {
    currentVideoIndex: -1, // Start at -1 so first video becomes index 0
    videoList: [],
    isPlaying: false,
    activeVideo: null, // Will be set after DOMContentLoaded
    inactiveVideo: null, // Will be set after DOMContentLoaded
    infoVisible: false,
    infoAreaVisible: false,
    isTransitioning: false,
    hasShownLoadingOnce: false,
    hasShownInitialInstructions: false,
    eventHandlersSetup: false // Track if event handlers have been set up
};

// UI Counters (for debugging/limiting notifications)
const COUNTERS = {
    soundToggle: 0,
    loadingToggle: 0
};

// Timeout References
const TIMEOUTS = {
    notification: null,
    deviceInfo: null
};

function updateStatus(message) {
    LOGGER.system(message);
}

function getTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

function setBottomButtonWidthsToWord(word) {
    const haBtn = ELEMENTS.humanAnalyticaButton;
    const infoBtn = ELEMENTS.nextButton;
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

// Generic button event handler to reduce code duplication
function addButtonEventListeners(element, clickHandler, condition = null) {
    // Click handler for desktop
    element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!condition || condition()) {
            clickHandler();
        }
    });
    
    // Touch handlers for mobile - prevent default to avoid double-firing
    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    element.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!condition || condition()) {
            clickHandler();
        }
    });
}

// Centralized event handler setup

// --- Modular Event Handler Setup ---
function setupEventHandlers() {
    // Prevent duplicate event handler setup
    if (STATE.eventHandlersSetup) {
        LOGGER.debug('Event handlers already set up, skipping');
        return;
    }
    
    LOGGER.debug('Setting up event handlers');
    setupVideoContainerHandlers();
    setupTouchHandlers();
    setupKeyboardHandlers();
    setupWindowHandlers();
    setupButtonHandlers();
    
    STATE.eventHandlersSetup = true;
    LOGGER.debug('Event handlers setup complete');
}

function setupWindowHandlers() {
    // Window resize and fullscreen change handlers can go here if needed
    // Currently the window load handler is at the bottom of the file
}

function setupButtonHandlers() {
    // Set up click handlers for next button and human analytica button
    if (ELEMENTS.nextButton) {
        addButtonEventListeners(ELEMENTS.nextButton, () => {
            LOGGER.user('Info button clicked');
            toggleInfoArea();
        });
    }
    
    if (ELEMENTS.humanAnalyticaButton) {
        addButtonEventListeners(ELEMENTS.humanAnalyticaButton, () => {
            LOGGER.user('Human Analytica button clicked');
            openHumanAnalytica();
        });
    }
    
    // Set up click handler for info area to close when clicked
    if (ELEMENTS.infoArea) {
        ELEMENTS.infoArea.addEventListener('click', (e) => {
            if (STATE.infoAreaVisible) {
                LOGGER.user('Info area clicked - closing');
                toggleInfoArea();
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
}

function setupVideoContainerHandlers() {
    const videoContainer = ELEMENTS.videoContainer;
    let clickCount = 0;
    let clickTimer = null;
    videoContainer.addEventListener('click', (e) => {
        // On mobile devices, skip click events to prevent duplicate with touch events
        if (isMobile()) {
            e.preventDefault();
            return;
        }
        
        if (!isMobile() && (e.ctrlKey || e.metaKey)) {
            UIStateManager.toggleFullscreen();
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        clickCount++;
        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                LOGGER.user('Single click detected - toggle mute');
                VideoManager.toggleMute();
                clickCount = 0;
            }, CONFIG.timeouts.clickDelay);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            LOGGER.user('Double click detected - load next video');
            VideoManager.transitionToNext(true);
            clickCount = 0;
        }
    });
    videoContainer.addEventListener('contextmenu', (e) => e.preventDefault());
}

function setupTouchHandlers() {
    const videoContainer = ELEMENTS.videoContainer;
    let tapCount = 0;
    let tapTimer = null;
    let touchStartTime = 0;
    let gestureStartTime = 0;
    let maxFingers = 0;
    let gestureTimer = null;
    let gestureInProgress = false;
    videoContainer.addEventListener('touchstart', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        e.preventDefault();
        const fingers = e.touches.length;
        if (!gestureInProgress) {
            gestureInProgress = true;
            gestureStartTime = Date.now();
            maxFingers = fingers;
            clearTimeout(gestureTimer);
            gestureTimer = setTimeout(() => {
                if (maxFingers >= 3) {
                    LOGGER.user('3+ finger gesture detected');
                    toggleDeviceInfo();
                }
                gestureInProgress = false;
                maxFingers = 0;
            }, CONFIG.timeouts.gestureDetection);
        }
        if (fingers > maxFingers) maxFingers = fingers;
        touchStartTime = Date.now();
    });
    videoContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const fingers = e.touches.length;
        if (fingers > maxFingers) maxFingers = fingers;
    });
    videoContainer.addEventListener('touchend', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        e.preventDefault();
        const currentTime = Date.now();
        const tapDuration = currentTime - touchStartTime;
        if (tapDuration < CONFIG.timeouts.tapDuration && e.changedTouches.length === 1) {
            tapCount++;
            if (tapCount === 1) {
                tapTimer = setTimeout(() => {
                    LOGGER.user('Single tap detected - toggle mute');
                    VideoManager.toggleMute();
                    tapCount = 0;
                }, CONFIG.timeouts.clickDelay);
            } else if (tapCount === 2) {
                clearTimeout(tapTimer);
                LOGGER.user('Double tap detected - load next video');
                VideoManager.transitionToNext(true);
                tapCount = 0;
            }
        }
    });
}

function setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            e.preventDefault();
            LOGGER.user('Space key pressed - toggle mute');
            VideoManager.toggleMute();
        } else if (e.key === 'n' || e.key === 'N') {
            // Add your handler for 'n' key here if needed
        }
    });
}

function openHumanAnalytica() {
    window.open('https://escob.art', '_self');
    LOGGER.user('Opening escob.art website in same tab');
}

function toggleInfoArea() {
    LOGGER.user('Info area toggle requested, current state:', STATE.infoAreaVisible);
    if (STATE.infoAreaVisible) {
        ELEMENTS.infoArea.classList.remove('show');
        STATE.infoAreaVisible = false;
        LOGGER.ui('Info area hidden');
        LOGGER.debug('Bottom buttons remain hidden until next user interaction');
        
        // Show fullscreen hint after a delay to avoid flash during closing transition
        setTimeout(() => {
            const fullscreenHint = document.getElementById('fullscreen-hint');
            if (fullscreenHint && !STATE.infoAreaVisible) {
                fullscreenHint.style.display = '';
            }
        }, 300); // Wait for CSS transition to complete
    } else {
        ELEMENTS.infoArea.classList.add('show');
        STATE.infoAreaVisible = true;
        ELEMENTS.nextButton.classList.remove('show');
        ELEMENTS.humanAnalyticaButton.classList.remove('show');
        LOGGER.ui('Info area shown, bottom buttons hidden');
        
        // Hide fullscreen hint immediately when info area is opening
        const fullscreenHint = document.getElementById('fullscreen-hint');
        if (fullscreenHint) {
            fullscreenHint.style.display = 'none';
        }
    }
}

function showInitialNotification() {
    const text = ELEMENTS.soundNotification.querySelector('.text');
    const mobile = isMobile();
    
    // Set initial instruction text
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
    
    // Show the notification and buttons
    ELEMENTS.soundNotification.classList.add('show');
    ELEMENTS.nextButton.classList.add('show');
    ELEMENTS.humanAnalyticaButton.classList.add('show');
    LOGGER.ui('Showing initial notification and buttons');
    
    // Auto-hide after a delay (longer for initial instructions)
    const hideDelay = 4000; // 4 seconds for initial instructions
    clearTimeout(TIMEOUTS.notification);
    TIMEOUTS.notification = setTimeout(() => {
        ELEMENTS.soundNotification.classList.remove('show');
        ELEMENTS.nextButton.classList.remove('show');
        ELEMENTS.humanAnalyticaButton.classList.remove('show');
        LOGGER.ui('Auto-hiding initial notification');
    }, hideDelay);
}

function showSoundNotification() {
    const text = ELEMENTS.soundNotification.querySelector('.text');
    const mobile = isMobile();
    if (STATE.activeVideo.muted) {
        text.textContent = 'Sound Off';
    } else {
        text.textContent = 'Sound On';
    }
    document.getElementById('sound-status').textContent = `Sound: ${STATE.activeVideo.muted ? 'Off' : 'On'}`;
    clearTimeout(TIMEOUTS.notification);
    if (!STATE.hasShownInitialInstructions) {
        STATE.hasShownInitialInstructions = true;
        LOGGER.debug('Early interaction detected - marking initial instructions as shown');
    }
    COUNTERS.soundToggle++;
    LOGGER.debug(`Sound toggle count: ${COUNTERS.soundToggle}`);
    
    // Don't show anything if in fullscreen
    if (document.fullscreenElement) {
        LOGGER.debug('In fullscreen - skipping sound notification');
        return;
    }
    
    // Show sound notification based on toggle count
    if (COUNTERS.soundToggle <= 2) {
        ELEMENTS.soundNotification.classList.add('show');
        LOGGER.ui(`Showing sound notification (toggle ${COUNTERS.soundToggle}/2)`);
    } else {
        LOGGER.debug(`Sound notification hidden (toggle ${COUNTERS.soundToggle} > 2)`);
    }
    
    // Show buttons briefly
    ELEMENTS.nextButton.classList.add('show');
    ELEMENTS.humanAnalyticaButton.classList.add('show');
    
    TIMEOUTS.notification = setTimeout(() => {
        ELEMENTS.soundNotification.classList.remove('show');
        ELEMENTS.nextButton.classList.remove('show');
        ELEMENTS.humanAnalyticaButton.classList.remove('show');
    }, CONFIG.timeouts.ui);
}

function toggleDeviceInfo() {
    LOGGER.debug('toggleDeviceInfo() CALLED');
    LOGGER.debug('Device info element exists:', !!ELEMENTS.deviceInfo);
    LOGGER.debug('Current classes:', ELEMENTS.deviceInfo.className);
    LOGGER.debug('Current opacity:', window.getComputedStyle(ELEMENTS.deviceInfo).opacity);
    clearTimeout(TIMEOUTS.deviceInfo);
    LOGGER.debug('Cleared existing timeout');
    STATE.infoVisible = true;
    ELEMENTS.deviceInfo.classList.add('show');
    LOGGER.debug('Added "show" class to device info');
    LOGGER.debug('New classes after show:', ELEMENTS.deviceInfo.className);
    ELEMENTS.deviceInfo.offsetHeight;
    LOGGER.debug('Forced style recalculation');
    setTimeout(() => {
        const computedOpacity = window.getComputedStyle(ELEMENTS.deviceInfo).opacity;
        LOGGER.debug('Computed opacity after show:', computedOpacity);
        if (computedOpacity === '0') {
            LOGGER.warn('WARNING: Opacity is still 0 - CSS might not be applied');
        } else {
            LOGGER.debug('SUCCESS: Device info should be visible');
        }
    }, CONFIG.timeouts.debugCheck);
    LOGGER.user('DEVICE INFO SHOWN - 3-finger gesture detected successfully!');
    TIMEOUTS.deviceInfo = setTimeout(() => {
        STATE.infoVisible = false;
        ELEMENTS.deviceInfo.classList.remove('show');
        LOGGER.ui('Device info auto-hidden after 4 seconds');
    }, CONFIG.timeouts.ui);
}

function attachVideoEventListeners() {
    // DEPRECATED: This function has been replaced by setupEventHandlers()
    // Left as placeholder to avoid breaking references
    LOGGER.warn('attachVideoEventListeners is deprecated, using setupEventHandlers instead');
}

// setupEventHandlers() is now called only in init() to avoid duplicate event listeners
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
    }, CONFIG.timeouts.fullscreenHint);
}

function init() {
    LOGGER.system('Initializing application...');
    
    // Set up video references
    STATE.activeVideo = ELEMENTS.video;
    STATE.inactiveVideo = ELEMENTS.video2;
    
    // Ensure both videos start muted (required for autoplay)
    STATE.activeVideo.muted = true;
    STATE.inactiveVideo.muted = true;
    
    // Set up event handlers
    setupEventHandlers();
    
    // Initialize video list based on device type
    if (typeof window.VIDEO_URLS !== 'undefined') {
        const deviceType = isMobile() ? 'mobile' : 'desktop';
        const videoUrls = window.VIDEO_URLS[deviceType];
        
        if (videoUrls && videoUrls.length > 0) {
            STATE.videoList = videoUrls;
            LOGGER.system(`Loaded ${STATE.videoList.length} ${deviceType} videos`);
            
            // Load first video and show initial UI
            VideoManager.loadNextVideo(false);
            
            // Show initial notification after a brief delay
            setTimeout(() => {
                showInitialNotification();
            }, 1000);
        } else {
            LOGGER.warn(`No ${deviceType} video URLs found in window.VIDEO_URLS`);
        }
    } else {
        LOGGER.warn('window.VIDEO_URLS not found, checking for legacy videoUrls');
        if (typeof videoUrls !== 'undefined' && videoUrls.length > 0) {
            STATE.videoList = videoUrls;
            LOGGER.system(`Loaded ${STATE.videoList.length} videos from legacy videoUrls`);
            VideoManager.loadNextVideo(false);
            
            // Show initial notification after a brief delay
            setTimeout(() => {
                showInitialNotification();
            }, 1000);
        } else {
            LOGGER.error('No video URLs found');
        }
    }
    
    LOGGER.system('Application initialized');
}

document.addEventListener('DOMContentLoaded', () => {
    setBottomButtonWidthsToWord('Human Analytica');
    LOGGER.system('DOM Content Loaded, initializing');
    init();
});
window.addEventListener('load', () => {
    LOGGER.system('Window loaded');
    if (STATE.videoList.length === 0) {
        LOGGER.warn('Fallback initialization');
        setTimeout(init, CONFIG.timeouts.fallbackInit);
    }
});
LOGGER.system('Application script loaded successfully');
window.testDeviceInfo = function() {
    LOGGER.debug('GLOBAL TEST: Testing device info display');
    toggleDeviceInfo();
};
window.testThreeFingers = function() {
    LOGGER.debug('SIMULATING 3-FINGER TOUCH');
    LOGGER.debug('Device info element:', ELEMENTS.deviceInfo);
    LOGGER.debug('Current classes:', ELEMENTS.deviceInfo.className);
    toggleDeviceInfo();
};
