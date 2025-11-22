// main.js for Human Analytica - extracted from index.html

const APP_VERSION = 'V0.002';

// Configuration object for timeouts and settings
const CONFIG = {
    timeouts: {
        ui: 4000,
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
VideoManager.loadNextVideo = function (showUI = true) {
    if (STATE.isTransitioning) return;
    const isUserTriggered = showUI === true;
    ELEMENTS.soundNotification.classList.remove('show');

    if (isUserTriggered) {
        ELEMENTS.loading.classList.add('show');
        LOGGER.ui('Showing loading screen');
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

    // 🎲 VIDEO SELECTION WITH LOCALSTORAGE STRATEGY
    let selectedIndex;
    let logMessage;

    // Check if this is the first video load and we have a specific start video
    if (STATE.videoLoadCount === 0 && window.VIDEO_URLS.strategy === 'lastFirst' && window.VIDEO_URLS.startVideo) {
        // Use the specific start video (highest numbered video)
        selectedIndex = window.VIDEO_URLS.startVideo - 1; // Convert to 0-based index
        logMessage = `Loading LAST video (new content): ${selectedIndex + 1}/${STATE.videoList.length}${isUserTriggered ? ' (with UI)' : ' (silent)'}`;
        LOGGER.video(`🆕 NEW CONTENT DETECTED - Starting with highest video #${window.VIDEO_URLS.startVideo}`);
    } else {
        // Always random for all other cases
        selectedIndex = Math.floor(Math.random() * STATE.videoList.length);
        logMessage = `Loading random video: ${selectedIndex + 1}/${STATE.videoList.length}${isUserTriggered ? ' (with UI)' : ' (silent)'}`;
    }

    LOGGER.video(logMessage);
    STATE.isTransitioning = true;
    const videoUrl = STATE.videoList[selectedIndex];
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

            // Update the index and increment load counter
            STATE.currentVideoIndex = selectedIndex;
            STATE.videoLoadCount++; // Increment load counter
            STATE.isTransitioning = false;

            LOGGER.video(`Video ${selectedIndex + 1} loaded and playing: ${fileName}`);

            // Update UI elements only if this is the first video or user triggered
            if (STATE.videoLoadCount === 1 || isUserTriggered) {
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
            text.innerHTML = 'One Click Sound On<br><br>Two Clicks Next One<br><br>Three Clicks Full Screen';
        } else {
            text.innerHTML = 'One Click Sound On<br><br>Two Clicks Next One<br><br>Three Clicks Full Screen';
        }
    }

    // Update device info content as well
    if (STATE.infoVisible) {
        updateDeviceInfoContent();
    }

    document.getElementById('sound-status').textContent = `Sound: ${STATE.activeVideo && STATE.activeVideo.muted ? 'Off' : 'On'}`;
}

VideoManager.toggleMute = function () {
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

VideoManager.transitionToNext = function (showUI = true) {
    LOGGER.user('User requested random video transition');
    VideoManager.loadNextVideo(showUI);
};

UIStateManager.toggleFullscreen = function () {
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
    videoContainer: document.getElementById('video-container'),
    // New elements for device info area
    deviceCount: document.getElementById('device-count'),
    storageKey: document.getElementById('storage-key'),
    appVersion: document.getElementById('app-version')
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
    eventHandlersSetup: false, // Track if event handlers have been set up
    videoLoadCount: 0 // Track how many videos have been loaded (for first video detection)
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

        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;

        clickCount++;
        clearTimeout(clickTimer);

        if (clickCount === 3) {
            LOGGER.user('Triple click detected - toggle fullscreen');
            UIStateManager.toggleFullscreen();
            clickCount = 0;
        } else {
            clickTimer = setTimeout(() => {
                if (clickCount === 1) {
                    LOGGER.user('Single click detected - toggle mute');
                    VideoManager.toggleMute();
                } else if (clickCount === 2) {
                    LOGGER.user('Double click detected - load next video');
                    VideoManager.transitionToNext(true);
                }
                clickCount = 0;
            }, CONFIG.timeouts.clickDelay);
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
    let multiFingerGesture = false; // Track if this was a multi-finger gesture

    videoContainer.addEventListener('touchstart', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        e.preventDefault();
        const fingers = e.touches.length;

        // Reset multi-finger flag at start of new gesture
        if (!gestureInProgress) {
            multiFingerGesture = false;
            gestureInProgress = true;
            gestureStartTime = Date.now();
            maxFingers = fingers;
            clearTimeout(gestureTimer);
            gestureTimer = setTimeout(() => {
                if (maxFingers >= 3) {
                    LOGGER.user('3+ finger gesture detected');
                    multiFingerGesture = true; // Mark as multi-finger gesture
                    toggleDeviceInfo();
                }
                gestureInProgress = false;
                maxFingers = 0;
            }, CONFIG.timeouts.gestureDetection);
        }
        if (fingers > maxFingers) {
            maxFingers = fingers;
            if (fingers >= 3) {
                multiFingerGesture = true; // Mark as multi-finger as soon as 3+ fingers detected
            }
        }
        touchStartTime = Date.now();
    });
    videoContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const fingers = e.touches.length;
        if (fingers > maxFingers) {
            maxFingers = fingers;
            if (fingers >= 3) {
                multiFingerGesture = true; // Mark as multi-finger during move
            }
        }
    });
    videoContainer.addEventListener('touchend', (e) => {
        if (e.target.closest('#next-button') || e.target.closest('#human-analytica-button')) return;
        e.preventDefault();

        // Skip tap detection if this was a multi-finger gesture
        if (multiFingerGesture) {
            LOGGER.debug('Skipping tap detection - multi-finger gesture detected');
            return;
        }

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
        } else if (e.key === 'i' || e.key === 'I') {
            e.preventDefault();
            LOGGER.user('I key pressed - toggle device info');
            toggleDeviceInfoWithKeyboard();
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
            text.innerHTML = 'One Click Sound On<br><br>Two Clicks Next One<br><br>Three Clicks Full Screen';
        } else {
            text.innerHTML = 'One Click Sound On<br><br>Two Clicks Next One<br><br>Three Clicks Full Screen';
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

    // Show sound notification
    ELEMENTS.soundNotification.classList.add('show');

    TIMEOUTS.notification = setTimeout(() => {
        ELEMENTS.soundNotification.classList.remove('show');
        ELEMENTS.nextButton.classList.remove('show');
        ELEMENTS.humanAnalyticaButton.classList.remove('show');
    }, CONFIG.timeouts.ui);
}

function toggleDeviceInfo() {
    LOGGER.debug('toggleDeviceInfo() CALLED');

    if (STATE.infoVisible) {
        // Hide device info
        STATE.infoVisible = false;
        ELEMENTS.deviceInfo.classList.remove('show');
        LOGGER.ui('Device info hidden via gesture');
    } else {
        // Show device info
        STATE.infoVisible = true;
        updateDeviceInfoContent();
        ELEMENTS.deviceInfo.classList.add('show');
        LOGGER.ui('Device info shown via gesture (persistent)');

        // Force style recalculation
        ELEMENTS.deviceInfo.offsetHeight;
    }
}

function toggleDeviceInfoWithKeyboard() {
    LOGGER.debug('toggleDeviceInfoWithKeyboard() CALLED');

    if (STATE.infoVisible) {
        // Hide device info
        STATE.infoVisible = false;
        ELEMENTS.deviceInfo.classList.remove('show');
        LOGGER.ui('Device info hidden via keyboard');
    } else {
        // Show device info
        STATE.infoVisible = true;
        updateDeviceInfoContent();
        ELEMENTS.deviceInfo.classList.add('show');
        LOGGER.ui('Device info shown via keyboard (persistent)');

        // Force style recalculation
        ELEMENTS.deviceInfo.offsetHeight;
    }
}

function updateDeviceInfoContent() {
    // Update device-specific content in the device info area
    const mobile = isMobile();
    const deviceType = mobile ? 'Mobile' : 'Desktop';
    const platform = mobile ? 'mobile' : 'desktop';
    const videoCount = STATE.videoList.length || 'Loading...';

    // Remove device type display (Row 1 - empty)
    if (ELEMENTS.deviceType) {
        ELEMENTS.deviceType.textContent = '';
    }

    // Row 2: Total video count
    if (ELEMENTS.videoCount) {
        ELEMENTS.videoCount.textContent = videoCount;
    }

    // Row 3: Current video position
    if (ELEMENTS.currentVideo) {
        const currentIndex = STATE.currentVideoIndex >= 0 ? STATE.currentVideoIndex + 1 : 1;
        ELEMENTS.currentVideo.textContent = `${currentIndex}/${videoCount}`;
    }

    // Row 4: Sound status
    if (ELEMENTS.soundStatus) {
        ELEMENTS.soundStatus.textContent = `Sound: ${STATE.activeVideo && STATE.activeVideo.muted ? 'Off' : 'On'}`;
    }

    // Row 5: Stored count from localStorage (device saved number)
    if (ELEMENTS.lastModified) {
        const storageKey = mobile ? 'HAMC' : 'HADC';
        const storedCount = localStorage.getItem(storageKey);
        ELEMENTS.lastModified.textContent = storedCount ? `Stored: ${storedCount}` : 'Stored: None';
    }

    // NEW ROW 6: Device count from config
    if (ELEMENTS.deviceCount) {
        const configCount = window.VIDEO_URL_CONFIG ? window.VIDEO_URL_CONFIG[platform].count : 'N/A';
        ELEMENTS.deviceCount.textContent = `Count: ${configCount}`;
    }

    // NEW ROW 7: Storage key (HADC/HAMC) - REMOVED
    if (ELEMENTS.storageKey) {
        ELEMENTS.storageKey.textContent = '';
    }

    // NEW ROW 8: App Version
    if (ELEMENTS.appVersion) {
        ELEMENTS.appVersion.textContent = `Version: ${APP_VERSION}`;
    }

    LOGGER.debug(`Device info content updated for ${deviceType} device`);
}


// setupEventHandlers() is now called only in init() to avoid duplicate event listeners
if (!isMobile()) {
    setTimeout(() => {
        const infoArea = document.getElementById('info-area');
        if (infoArea && !document.getElementById('fullscreen-hint')) {
            let hint = document.createElement('div');
            hint.className = 'close-hint';
            hint.id = 'fullscreen-hint';
            hint.textContent = 'Three Clicks for fullscreen';
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

    // Device info area is OFF by default
    STATE.infoVisible = false;
    LOGGER.ui('Device info area OFF by default - use 3-finger gesture (mobile) or I key (desktop) to show');

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
window.testDeviceInfo = function () {
    LOGGER.debug('GLOBAL TEST: Testing device info display');
    toggleDeviceInfo();
};
window.testThreeFingers = function () {
    LOGGER.debug('SIMULATING 3-FINGER TOUCH');
    LOGGER.debug('Device info element:', ELEMENTS.deviceInfo);
    LOGGER.debug('Current classes:', ELEMENTS.deviceInfo.className);
    toggleDeviceInfo();
};
