/**
 * Dreams and Poems - Video URLs Configuration
 * Enhanced with metadata, categorization, and error handling
 * 
 * @author Carlos Escobar
 * @description Video URL configuration with enhanced features
 */

// Video metadata for enhanced features
const VIDEO_METADATA = {
  quality: {
    desktop: 'high',
    mobile: 'medium'
  },
  formats: ['mp4'],
  cdn: {
    primary: 'filedn.com',
    fallback: null
  },
  categories: {
    dreams: 'Abstract and surreal content',
    poems: 'Text-based poetic content',
    mixed: 'Combined audio-visual poetry'
  }
};

// Configuration for video loading and playback
const VIDEO_CONFIG = {
  preload: {
    desktop: 3,
    mobile: 2  // Increased from 1 to 2 for smoother mobile experience
  },
  retry: {
    maxAttempts: 3,
    delay: 1000
  },
  timeout: {
    loading: 30000,
    buffer: 5000
  },
  mobile: {
    crossfadeDuration: 800,  // Faster transitions on mobile
    touchTimeout: 150,       // Reduced touch detection timeout
    enableHoldToPause: false // Disable problematic hold-to-pause
  }
};

// Video URLs configuration for Dreams and Poems
window.VIDEO_URLS = {
    desktop: [
      "https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0001.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0002.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0003.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0004.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0005.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0006.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0007.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0008.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0009.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0010.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0011.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0012.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0013.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Desktop/HumanAnalytica_hor_0014.mp4"  ],
    mobile: [
      "https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0001.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0002.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0003.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0004.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0005.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0006.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0007.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0008.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0009.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0010.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0011.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0012.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0013.mp4","https://filedn.com/lHC6pEBkEzyQnHC8rtghiku/HumanAnalytica/Mobile/HumanAnalytica_ver_0014.mp4"     ]
};

// Enhanced error handling and URL validation for Dreams and Poems v024
window.VIDEO_ERROR_HANDLER = {
    failedUrls: new Set(),
    retryCount: new Map(),
    maxRetries: 3,
    
    // HTTP status code explanations
    statusCodes: {
        304: 'Not Modified - Browser cache is up to date',
        404: 'Video file not found on server',
        403: 'Access forbidden - permission denied',
        500: 'Server error',
        503: 'Service unavailable'
    },
    
    // Log and handle video errors with detailed information
    logError(url, error, statusCode = null) {
        const videoName = url.split('/').pop();
        const errorType = statusCode || (error.name || 'Unknown Error');
        
        console.group(`🚨 Video Error: ${videoName}`);
        console.log(`URL: ${url}`);
        console.log(`Error Type: ${errorType}`);
        
        if (statusCode) {
            console.log(`HTTP Status: ${statusCode} - ${this.statusCodes[statusCode] || 'Unknown status'}`);
            
            // 304 is actually not an error - it means cached version is current
            if (statusCode === 304) {
                console.log(`✅ This is actually good - video is cached!`);
                console.groupEnd();
                return false; // Not a real error
            }
            
            // 404 means the video file doesn't exist
            if (statusCode === 404) {
                console.error(`❌ Video file missing: ${videoName}`);
                this.failedUrls.add(url);
            }
        }
        
        if (error.message) {
            console.log(`Error Message: ${error.message}`);
        }
        
        const retries = this.retryCount.get(url) || 0;
        console.log(`Retry Count: ${retries}/${this.maxRetries}`);
        console.groupEnd();
        
        // Track failed URLs to avoid repeated attempts
        if (retries >= this.maxRetries) {
            this.failedUrls.add(url);
            console.warn(`🚫 Marking ${videoName} as permanently failed`);
        } else {
            this.retryCount.set(url, retries + 1);
        }
        
        return true; // Real error occurred
    },
    
    // Check if URL should be skipped due to previous failures
    shouldSkipUrl(url) {
        return this.failedUrls.has(url);
    },
    
    // Get a filtered list of working video URLs
    getWorkingUrls(urlArray) {
        return urlArray.filter(url => !this.shouldSkipUrl(url));
    },
    
    // Reset error tracking (useful for testing)
    reset() {
        this.failedUrls.clear();
        this.retryCount.clear();
        console.log('🔄 Video error tracking reset');
    },
    
    // Get summary of video loading issues
    getSummary() {
        return {
            totalFailed: this.failedUrls.size,
            failedUrls: Array.from(this.failedUrls),
            totalRetries: this.retryCount.size
        };
    }
};

// URL validation utility
window.VIDEO_URL_VALIDATOR = {
    // Test if a video URL is accessible
    async testUrl(url) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                cache: 'no-cache' // Avoid cached responses for testing
            });
            
            if (response.ok || response.status === 304) {
                return { valid: true, status: response.status };
            } else {
                return { 
                    valid: false, 
                    status: response.status,
                    message: `HTTP ${response.status}: ${response.statusText}`
                };
            }
        } catch (error) {
            return { 
                valid: false, 
                status: null,
                message: error.message 
            };
        }
    },
    
    // Test a batch of URLs with rate limiting
    async testBatch(urls, batchSize = 5, delay = 1000) {
        const results = [];
        
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const batchPromises = batch.map(url => this.testUrl(url));
            
            try {
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults.map((result, index) => ({
                    url: batch[index],
                    ...result
                })));
                
                // Add delay between batches to avoid overwhelming the server
                if (i + batchSize < urls.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                console.error(`Batch testing failed:`, error);
            }
        }
        
        return results;
    },
    
    // Quick validation of URL format
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' && url.endsWith('.mp4');
        } catch {
            return false;
        }
    }
};

// Enhanced video loading with error handling
window.ENHANCED_VIDEO_LOADER = {
    // Load video with comprehensive error handling
    async loadVideo(videoElement, url) {
        return new Promise((resolve, reject) => {
            if (VIDEO_ERROR_HANDLER.shouldSkipUrl(url)) {
                reject(new Error(`URL marked as failed: ${url}`));
                return;
            }
            
            const timeout = setTimeout(() => {
                reject(new Error(`Video load timeout: ${url}`));
            }, 30000);
            
            const onLoad = () => {
                clearTimeout(timeout);
                videoElement.removeEventListener('loadeddata', onLoad);
                videoElement.removeEventListener('error', onError);
                resolve(videoElement);
            };
            
            const onError = (event) => {
                clearTimeout(timeout);
                videoElement.removeEventListener('loadeddata', onLoad);
                videoElement.removeEventListener('error', onError);
                
                const error = event.target.error || new Error('Video load failed');
                VIDEO_ERROR_HANDLER.logError(url, error);
                reject(error);
            };
            
            videoElement.addEventListener('loadeddata', onLoad, { once: true });
            videoElement.addEventListener('error', onError, { once: true });
            
            videoElement.src = url;
            videoElement.load();
        });
    }
};

console.log('📹 Enhanced video error handling and validation loaded');
console.log(`📊 Total videos configured: Desktop ${VIDEO_URLS.desktop.length}, Mobile ${VIDEO_URLS.mobile.length}`);
