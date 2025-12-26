// Global state management
const appState = {
    mediaFiles: [],
    timelineClips: [],
    currentProject: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0
};

// File Import Handler
class MediaImporter {
    constructor() {
        this.setupDragAndDrop();
        this.setupFileInput();
    }

    setupDragAndDrop() {
        const importArea = document.getElementById('importArea');
        
        importArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            importArea.classList.add('drag-over');
        });

        importArea.addEventListener('dragleave', () => {
            importArea.classList.remove('drag-over');
        });

        importArea.addEventListener('drop', (e) => {
            e.preventDefault();
            importArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    setupFileInput() {
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
                const mediaItem = {
                    id: Date.now() + Math.random(),
                    file: file,
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    url: URL.createObjectURL(file),
                    name: file.name,
                    duration: 0
                };

                if (mediaItem.type === 'video') {
                    this.getVideoDuration(mediaItem);
                } else {
                    mediaItem.duration = 3; // Default 3 seconds for images
                }

                appState.mediaFiles.push(mediaItem);
            }
        });

        this.renderMediaLibrary();
        this.showSections();
    }

    getVideoDuration(mediaItem) {
        const video = document.createElement('video');
        video.src = mediaItem.url;
        video.onloadedmetadata = () => {
            mediaItem.duration = video.duration;
            this.renderMediaLibrary();
        };
    }

    renderMediaLibrary() {
        const mediaGrid = document.getElementById('mediaGrid');
        mediaGrid.innerHTML = '';

        appState.mediaFiles.forEach((media, index) => {
            const mediaCard = document.createElement('div');
            mediaCard.className = 'media-card';
            mediaCard.innerHTML = `
                ${media.type === 'video' ? 
                    `<video src="${media.url}" class="media-thumbnail"></video>` : 
                    `<img src="${media.url}" class="media-thumbnail" alt="${media.name}">`
                }
                <div class="media-info">
                    <p class="media-name">${media.name}</p>
                    <p class="media-duration">${this.formatTime(media.duration)}</p>
                </div>
                <button class="btn-add-timeline" onclick="videoEditor.addToTimeline(${index})">
                    ➕ Add to Timeline
                </button>
            `;
            mediaGrid.appendChild(mediaCard);
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showSections() {
        document.getElementById('mediaLibrary').style.display = 'block';
        document.getElementById('editorSection').style.display = 'block';
        document.getElementById('aiPanel').style.display = 'block';
    }
}

// Video Editor Core
class VideoEditor {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 608; // 9:16 aspect ratio (TikTok)
        this.canvas.height = 1080;
        this.animationFrame = null;
    }

    addToTimeline(mediaIndex) {
        const media = appState.mediaFiles[mediaIndex];
        const clip = {
            id: Date.now() + Math.random(),
            media: media,
            startTime: appState.duration,
            duration: media.duration,
            effects: [],
            transitions: [],
            speed: 1.0,
            volume: 1.0,
            filters: []
        };

        appState.timelineClips.push(clip);
        appState.duration += clip.duration;
        this.renderTimeline();
        this.updatePreview();
        
        // Trigger AI analysis
        setTimeout(() => aiEditor.analyzeNewClip(clip), 500);
    }

    renderTimeline() {
        const timelineTracks = document.getElementById('timelineTracks');
        timelineTracks.innerHTML = '';

        let currentPos = 0;
        appState.timelineClips.forEach((clip, index) => {
            const clipElement = document.createElement('div');
            clipElement.className = 'timeline-clip';
            clipElement.style.left = `${(currentPos / appState.duration) * 100}%`;
            clipElement.style.width = `${(clip.duration / appState.duration) * 100}%`;
            clipElement.innerHTML = `
                <span class="clip-label">${clip.media.name}</span>
                <button class="clip-delete" onclick="videoEditor.removeClip(${index})">×</button>
            `;
            timelineTracks.appendChild(clipElement);
            currentPos += clip.duration;
        });

        document.getElementById('totalTime').textContent = mediaImporter.formatTime(appState.duration);
    }

    removeClip(index) {
        appState.timelineClips.splice(index, 1);
        this.recalculateDuration();
        this.renderTimeline();
        this.updatePreview();
    }

    recalculateDuration() {
        appState.duration = 0;
        appState.timelineClips.forEach(clip => {
            clip.startTime = appState.duration;
            appState.duration += clip.duration;
        });
    }

    updatePreview() {
        const clip = this.getCurrentClip();
        if (!clip) {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        if (clip.media.type === 'video') {
            const video = document.getElementById('previewVideo');
            video.src = clip.media.url;
            video.currentTime = appState.currentTime - clip.startTime;
            this.drawVideoFrame(video, clip);
        } else {
            const img = new Image();
            img.src = clip.media.url;
            img.onload = () => this.drawImageFrame(img, clip);
        }
    }

    drawVideoFrame(video, clip) {
        const drawFrame = () => {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Apply filters
            this.applyFilters(clip);
            
            // Draw video
            const scale = Math.max(
                this.canvas.width / video.videoWidth,
                this.canvas.height / video.videoHeight
            );
            const x = (this.canvas.width - video.videoWidth * scale) / 2;
            const y = (this.canvas.height - video.videoHeight * scale) / 2;
            
            this.ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
            
            // Apply transitions
            this.applyTransitions(clip);
        };

        if (appState.isPlaying) {
            video.play();
            const interval = setInterval(() => {
                if (!appState.isPlaying) {
                    clearInterval(interval);
                    video.pause();
                }
                drawFrame();
            }, 1000 / 30); // 30 fps
        } else {
            drawFrame();
        }
    }

    drawImageFrame(img, clip) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.applyFilters(clip);
        
        const scale = Math.max(
            this.canvas.width / img.width,
            this.canvas.height / img.height
        );
        const x = (this.canvas.width - img.width * scale) / 2;
        const y = (this.canvas.height - img.height * scale) / 2;
        
        this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        this.applyTransitions(clip);
    }

    getCurrentClip() {
        return appState.timelineClips.find(clip => 
            appState.currentTime >= clip.startTime && 
            appState.currentTime < clip.startTime + clip.duration
        );
    }

    applyFilters(clip) {
        clip.filters.forEach(filter => {
            switch(filter) {
                case 'vibrant':
                    this.ctx.filter = 'saturate(150%) contrast(110%)';
                    break;
                case 'vintage':
                    this.ctx.filter = 'sepia(50%) contrast(90%)';
                    break;
                case 'bw':
                    this.ctx.filter = 'grayscale(100%)';
                    break;
            }
        });
    }

    applyTransitions(clip) {
        const clipProgress = (appState.currentTime - clip.startTime) / clip.duration;
        
        clip.transitions.forEach(transition => {
            switch(transition) {
                case 'fade':
                    if (clipProgress < 0.1) {
                        this.ctx.globalAlpha = clipProgress * 10;
                    } else if (clipProgress > 0.9) {
                        this.ctx.globalAlpha = (1 - clipProgress) * 10;
                    }
                    break;
                case 'zoom':
                    if (clipProgress < 0.5) {
                        const scale = 1 + (clipProgress * 0.2);
                        this.ctx.scale(scale, scale);
                    }
                    break;
            }
        });
        
        this.ctx.globalAlpha = 1;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    addTransition(type) {
        const clip = this.getCurrentClip();
        if (clip && !clip.transitions.includes(type)) {
            clip.transitions.push(type);
            this.updatePreview();
            this.showNotification(`Added ${type} transition!`);
        }
    }

    addFilter(type) {
        const clip = this.getCurrentClip();
        if (clip) {
            clip.filters = [type]; // Replace filter
            this.updatePreview();
            this.showNotification(`Applied ${type} filter!`);
        }
    }

    adjustSpeed(speed) {
        const clip = this.getCurrentClip();
        if (clip) {
            const oldDuration = clip.duration;
            clip.speed = speed;
            clip.duration = (clip.media.duration / speed);
            appState.duration += (clip.duration - oldDuration);
            this.renderTimeline();
            this.showNotification(`Adjusted speed to ${speed}x!`);
        }
    }

    setVolume(value) {
        const clip = this.getCurrentClip();
        if (clip) {
            clip.volume = value / 100;
            document.getElementById('volumeValue').textContent = value + '%';
        }
    }

    play() {
        if (appState.timelineClips.length === 0) return;
        
        appState.isPlaying = true;
        const startTime = Date.now();
        const initialTime = appState.currentTime;

        const animate = () => {
            if (!appState.isPlaying) return;

            const elapsed = (Date.now() - startTime) / 1000;
            appState.currentTime = initialTime + elapsed;

            if (appState.currentTime >= appState.duration) {
                this.pause();
                appState.currentTime = 0;
                return;
            }

            this.updatePlayhead();
            this.updatePreview();
            document.getElementById('currentTime').textContent = 
                mediaImporter.formatTime(appState.currentTime);

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    pause() {
        appState.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    reset() {
        this.pause();
        appState.currentTime = 0;
        this.updatePlayhead();
        this.updatePreview();
        document.getElementById('currentTime').textContent = '0:00';
    }

    updatePlayhead() {
        const playhead = document.getElementById('playhead');
        playhead.style.left = `${(appState.currentTime / appState.duration) * 100}%`;
    }

    showNotification(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// AI Editor Intelligence
class AIEditor {
    constructor() {
        this.suggestions = [];
        this.referenceVideo = null;
        this.setupReferenceUpload();
    }

    setupReferenceUpload() {
        const referenceInput = document.getElementById('referenceInput');
        if (referenceInput) {
            referenceInput.addEventListener('change', (e) => {
                this.handleReferenceUpload(e.target.files[0]);
            });
        }
    }

    handleReferenceUpload(file) {
        if (!file || !file.type.startsWith('video/')) {
            alert('Please upload a video file');
            return;
        }

        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        
        video.onloadedmetadata = () => {
            this.referenceVideo = {
                file: file,
                url: video.src,
                duration: video.duration,
                name: file.name
            };

            // Analyze reference video
            this.analyzeReference(video);
            
            // Show preview
            document.getElementById('referencePreview').style.display = 'block';
            videoEditor.showNotification('📤 Reference video uploaded! AI will match this style.');
        };
    }

    analyzeReference(video) {
        // Analyze the reference video characteristics
        // In production, this would use video analysis APIs
        const avgClipLength = video.duration / 5; // Estimate 5 clips
        
        this.referenceStyle = {
            avgClipLength: avgClipLength,
            pace: avgClipLength < 4 ? 'fast' : avgClipLength < 6 ? 'medium' : 'slow',
            estimatedClips: Math.ceil(video.duration / avgClipLength),
            suggestedTransitions: this.detectTransitions(video),
            suggestedFilters: this.detectFilters(video)
        };

        videoEditor.showNotification('✨ Reference analyzed! AI will suggest similar edits.');
    }

    detectTransitions(video) {
        // Simulate transition detection
        // In production, would analyze frames
        return ['fade', 'zoom'];
    }

    detectFilters(video) {
        // Simulate filter detection
        // In production, would analyze color grading
        return Math.random() > 0.5 ? ['vibrant'] : ['vintage'];
    }

    removeReference() {
        this.referenceVideo = null;
        this.referenceStyle = null;
        document.getElementById('referencePreview').style.display = 'none';
        document.getElementById('referenceInput').value = '';
        videoEditor.showNotification('Reference video removed');
    }

    analyzeCurrent() {
        if (appState.timelineClips.length === 0) {
            this.showSuggestion('Please add some clips to your timeline first!', 'info');
            return;
        }

        this.showSuggestion('🔍 Analyzing your video...', 'loading');

        setTimeout(() => {
            this.generateSuggestions();
        }, 1500);
    }

    analyzeNewClip(clip) {
        const suggestions = [];
        
        // Analyze clip characteristics
        if (clip.duration > 10) {
            suggestions.push({
                type: 'duration',
                message: `This clip is ${clip.duration.toFixed(1)}s long. Consider splitting it for better pacing!`,
                action: () => this.suggestSplit(clip)
            });
        }

        if (clip.transitions.length === 0) {
            suggestions.push({
                type: 'transition',
                message: 'Add a fade transition to make this clip flow better',
                action: () => this.autoAddTransition(clip, 'fade')
            });
        }

        if (clip.filters.length === 0 && Math.random() > 0.5) {
            suggestions.push({
                type: 'filter',
                message: 'Try adding a vibrant filter to make colors pop!',
                action: () => this.autoAddFilter(clip, 'vibrant')
            });
        }

        this.displaySuggestions(suggestions);
    }

    generateSuggestions() {
        const suggestions = [];
        const clips = appState.timelineClips;

        // Check if we have a reference video to match
        if (this.referenceVideo && this.referenceStyle) {
            suggestions.push({
                type: 'reference',
                message: `📹 Matching style from "${this.referenceVideo.name}": ${this.referenceStyle.pace} pace with ~${this.referenceStyle.estimatedClips} clips`,
                action: null
            });

            // Suggest based on reference
            const targetClipLength = this.referenceStyle.avgClipLength;
            const currentAvgLength = appState.duration / clips.length;
            
            if (Math.abs(currentAvgLength - targetClipLength) > 1) {
                suggestions.push({
                    type: 'pacing-reference',
                    message: `Reference video uses ${targetClipLength.toFixed(1)}s clips. Yours average ${currentAvgLength.toFixed(1)}s. Adjust pacing to match?`,
                    action: () => this.matchReferencePacing()
                });
            }

            // Suggest reference transitions
            const hasReferenceTransitions = this.referenceStyle.suggestedTransitions.every(t => 
                clips.some(c => c.transitions.includes(t))
            );
            
            if (!hasReferenceTransitions) {
                suggestions.push({
                    type: 'transitions-reference',
                    message: `Reference video uses ${this.referenceStyle.suggestedTransitions.join(' and ')} transitions. Apply these?`,
                    action: () => this.applyReferenceTransitions()
                });
            }

            // Suggest reference filters
            const hasReferenceFilters = this.referenceStyle.suggestedFilters.some(f =>
                clips.some(c => c.filters.includes(f))
            );
            
            if (!hasReferenceFilters) {
                suggestions.push({
                    type: 'filters-reference',
                    message: `Reference video has a ${this.referenceStyle.suggestedFilters[0]} look. Apply similar filter?`,
                    action: () => this.applyReferenceFilters()
                });
            }
        }

        // Overall video analysis
        if (appState.duration < 15) {
            suggestions.push({
                type: 'length',
                message: `Your video is ${appState.duration.toFixed(1)}s. TikToks perform better at 15-60 seconds. Add more clips!`,
                action: null
            });
        } else if (appState.duration > 60) {
            suggestions.push({
                type: 'length',
                message: `Your video is ${appState.duration.toFixed(1)}s. Consider trimming for better engagement!`,
                action: null
            });
        }

        // Check for transitions
        const clipsWithoutTransitions = clips.filter(c => c.transitions.length === 0).length;
        if (clipsWithoutTransitions > 0) {
            suggestions.push({
                type: 'transitions',
                message: `${clipsWithoutTransitions} clips don't have transitions. Add them for smoother flow!`,
                action: () => this.autoAddTransitions()
            });
        }

        // Check for variety
        const hasFilters = clips.some(c => c.filters.length > 0);
        if (!hasFilters) {
            suggestions.push({
                type: 'filters',
                message: 'Add filters to create visual interest and maintain viewer attention!',
                action: () => this.autoAddFilters()
            });
        }

        // Speed variations
        const hasSpeedVariation = clips.some(c => c.speed !== 1.0);
        if (!hasSpeedVariation && clips.length > 2) {
            suggestions.push({
                type: 'speed',
                message: 'Try adding slow motion or speed up effects for dramatic impact!',
                action: () => this.suggestSpeedChanges()
            });
        }

        // Audio suggestions
        suggestions.push({
            type: 'audio',
            message: 'For key moments, try lowering the audio volume to 50% for dramatic effect',
            action: () => this.adjustAudioForDrama()
        });

        // Pacing suggestions
        const avgClipLength = appState.duration / clips.length;
        if (avgClipLength > 5) {
            suggestions.push({
                type: 'pacing',
                message: `Average clip length is ${avgClipLength.toFixed(1)}s. TikTok viewers prefer faster pacing (3-4s per clip)`,
                action: null
            });
        }

        this.displaySuggestions(suggestions);
    }

    displaySuggestions(suggestions) {
        const container = document.getElementById('suggestionsContainer');
        container.innerHTML = '';

        if (suggestions.length === 0) {
            container.innerHTML = '<p class="ai-success">✅ Your video looks great! No suggestions at the moment.</p>';
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const suggestionCard = document.createElement('div');
            suggestionCard.className = 'suggestion-card';
            suggestionCard.innerHTML = `
                <div class="suggestion-icon">${this.getIconForType(suggestion.type)}</div>
                <div class="suggestion-content">
                    <p>${suggestion.message}</p>
                    ${suggestion.action ? 
                        `<button class="btn-apply" onclick="aiEditor.applySuggestion(${index})">✨ Apply This</button>` : 
                        ''
                    }
                </div>
            `;
            container.appendChild(suggestionCard);
        });

        this.suggestions = suggestions;
    }

    applySuggestion(index) {
        const suggestion = this.suggestions[index];
        if (suggestion.action) {
            suggestion.action();
            videoEditor.showNotification('Applied AI suggestion!');
            this.analyzeCurrent(); // Re-analyze after applying
        }
    }

    autoEnhance() {
        videoEditor.showNotification('🤖 AI Auto-Enhancing your video...');
        
        // Apply multiple enhancements
        this.autoAddTransitions();
        setTimeout(() => this.autoAddFilters(), 500);
        setTimeout(() => this.optimizePacing(), 1000);
        
        setTimeout(() => {
            videoEditor.showNotification('✨ Auto-enhancement complete!');
            this.analyzeCurrent();
        }, 1500);
    }

    autoAddTransitions() {
        appState.timelineClips.forEach((clip, index) => {
            if (clip.transitions.length === 0) {
                const transitions = ['fade', 'zoom'];
                clip.transitions.push(transitions[index % transitions.length]);
            }
        });
        videoEditor.renderTimeline();
        videoEditor.updatePreview();
    }

    autoAddTransition(clip, type) {
        if (!clip.transitions.includes(type)) {
            clip.transitions.push(type);
            videoEditor.updatePreview();
        }
    }

    autoAddFilters() {
        const filters = ['vibrant', 'vintage'];
        appState.timelineClips.forEach((clip, index) => {
            if (clip.filters.length === 0 && index % 2 === 0) {
                clip.filters.push(filters[Math.floor(Math.random() * filters.length)]);
            }
        });
        videoEditor.updatePreview();
    }

    autoAddFilter(clip, filter) {
        clip.filters = [filter];
        videoEditor.updatePreview();
    }

    optimizePacing() {
        // Adjust long clips to be faster
        appState.timelineClips.forEach(clip => {
            if (clip.duration > 6 && clip.speed === 1.0) {
                clip.speed = 1.2;
                clip.duration = clip.media.duration / clip.speed;
            }
        });
        videoEditor.recalculateDuration();
        videoEditor.renderTimeline();
    }

    suggestSpeedChanges() {
        // Apply slow motion to middle clips
        const midIndex = Math.floor(appState.timelineClips.length / 2);
        if (appState.timelineClips[midIndex]) {
            appState.timelineClips[midIndex].speed = 0.5;
            appState.timelineClips[midIndex].duration = 
                appState.timelineClips[midIndex].media.duration / 0.5;
            videoEditor.recalculateDuration();
            videoEditor.renderTimeline();
        }
    }

    adjustAudioForDrama() {
        // Reduce volume on specific clips
        if (appState.timelineClips[0]) {
            appState.timelineClips[0].volume = 0.5;
        }
    }

    suggestSplit(clip) {
        videoEditor.showNotification('Split functionality coming soon!');
    }

    matchReferencePacing() {
        if (!this.referenceStyle) return;
        
        const targetSpeed = this.referenceStyle.avgClipLength / (appState.duration / appState.timelineClips.length);
        appState.timelineClips.forEach(clip => {
            if (clip.speed === 1.0) {
                clip.speed = targetSpeed;
                clip.duration = clip.media.duration / clip.speed;
            }
        });
        
        videoEditor.recalculateDuration();
        videoEditor.renderTimeline();
        videoEditor.showNotification('Pacing matched to reference video!');
    }

    applyReferenceTransitions() {
        if (!this.referenceStyle) return;
        
        appState.timelineClips.forEach(clip => {
            clip.transitions = [...this.referenceStyle.suggestedTransitions];
        });
        
        videoEditor.updatePreview();
        videoEditor.showNotification('Transitions matched to reference!');
    }

    applyReferenceFilters() {
        if (!this.referenceStyle) return;
        
        appState.timelineClips.forEach(clip => {
            clip.filters = [...this.referenceStyle.suggestedFilters];
        });
        
        videoEditor.updatePreview();
        videoEditor.showNotification('Filters matched to reference!');
    }

    // Natural Language Command Processing
    executeCommand() {
        const input = document.getElementById('aiCommandInput');
        const command = input.value.trim().toLowerCase();
        
        if (!command) {
            videoEditor.showNotification('Please enter a command');
            return;
        }

        // Add to history
        this.addCommandToHistory(command);
        
        // Parse and execute
        const result = this.parseCommand(command);
        
        if (result.success) {
            videoEditor.showNotification(`✅ ${result.message}`);
            input.value = ''; // Clear input
        } else {
            videoEditor.showNotification(`❌ ${result.message}`);
        }
    }

    parseCommand(command) {
        // Extract time if mentioned (e.g., "at 0:15", "at 15 seconds", "at 0:00:15")
        const timeMatch = command.match(/at (\d+):(\d+)(?::(\d+))?|at (\d+) second/);
        let targetTime = null;
        
        if (timeMatch) {
            if (timeMatch[4]) {
                // "at 15 seconds" format
                targetTime = parseInt(timeMatch[4]);
            } else {
                // "at 0:15" or "at 0:00:15" format
                const mins = parseInt(timeMatch[1]) || 0;
                const secs = parseInt(timeMatch[2]) || 0;
                const ms = parseInt(timeMatch[3]) || 0;
                targetTime = mins * 60 + secs + ms / 1000;
            }
        }

        // Extract clip number if mentioned (e.g., "clip 2", "second clip", "clip #3")
        const clipMatch = command.match(/clip (?:#)?(\d+)|(?:(first|second|third|fourth|fifth|last) clip)/);
        let clipIndex = null;
        
        if (clipMatch) {
            if (clipMatch[1]) {
                clipIndex = parseInt(clipMatch[1]) - 1; // Convert to 0-based index
            } else if (clipMatch[2]) {
                const wordToNum = {first: 0, second: 1, third: 2, fourth: 3, fifth: 4};
                clipIndex = wordToNum[clipMatch[2]] !== undefined ? wordToNum[clipMatch[2]] : 
                           (clipMatch[2] === 'last' ? appState.timelineClips.length - 1 : null);
            }
        }

        // Determine target clip by time or index
        let targetClip = null;
        let targetClipIndex = null;
        
        if (clipIndex !== null && appState.timelineClips[clipIndex]) {
            targetClip = appState.timelineClips[clipIndex];
            targetClipIndex = clipIndex;
        } else if (targetTime !== null) {
            // Find clip at that time
            targetClipIndex = appState.timelineClips.findIndex(clip => 
                targetTime >= clip.startTime && targetTime < clip.startTime + clip.duration
            );
            if (targetClipIndex !== -1) {
                targetClip = appState.timelineClips[targetClipIndex];
            }
        }

        // Command patterns
        const patterns = [
            // Slow motion
            {
                regex: /slow.?motion|slow.?mo|slow down/i,
                action: () => this.cmdSlowMotion(targetClip, targetClipIndex)
            },
            // Speed up
            {
                regex: /speed.?up|fast.?forward|faster|accelerate/i,
                action: () => this.cmdSpeedUp(targetClip, targetClipIndex)
            },
            // Fade transition
            {
                regex: /fade|fade transition/i,
                action: () => this.cmdAddFade(targetClip, targetClipIndex)
            },
            // Zoom transition
            {
                regex: /zoom|zoom in|zoom out/i,
                action: () => this.cmdAddZoom(targetClip, targetClipIndex)
            },
            // Vibrant filter
            {
                regex: /vibrant|colorful|bright|saturate|pop/i,
                action: () => this.cmdAddFilter(targetClip, targetClipIndex, 'vibrant')
            },
            // Vintage filter
            {
                regex: /vintage|retro|old|sepia/i,
                action: () => this.cmdAddFilter(targetClip, targetClipIndex, 'vintage')
            },
            // Black and white
            {
                regex: /black.?white|b.?w|grayscale|mono/i,
                action: () => this.cmdAddFilter(targetClip, targetClipIndex, 'bw')
            },
            // Volume
            {
                regex: /volume|audio|sound|loud|quiet/i,
                action: () => this.cmdAdjustVolume(command, targetClip, targetClipIndex)
            },
            // Remove effect
            {
                regex: /remove|delete|clear|undo/i,
                action: () => this.cmdRemoveEffects(targetClip, targetClipIndex)
            },
            // Add all clips
            {
                regex: /add all|import all/i,
                action: () => this.cmdAddAllClips()
            }
        ];

        // Try to match a pattern
        for (const pattern of patterns) {
            if (pattern.regex.test(command)) {
                return pattern.action();
            }
        }

        // If no pattern matched, provide help
        return {
            success: false,
            message: 'Command not recognized. Try: "add slow motion to clip 2", "fade between clips", "make it vibrant"'
        };
    }

    // Command implementations
    cmdSlowMotion(clip, index) {
        if (!clip) {
            // Apply to all clips
            appState.timelineClips.forEach(c => {
                if (c.speed === 1.0) {
                    c.speed = 0.5;
                    c.duration = c.media.duration / c.speed;
                }
            });
            videoEditor.recalculateDuration();
            videoEditor.renderTimeline();
            return {success: true, message: 'Slow motion applied to all clips'};
        } else {
            clip.speed = 0.5;
            clip.duration = clip.media.duration / clip.speed;
            videoEditor.recalculateDuration();
            videoEditor.renderTimeline();
            return {success: true, message: `Slow motion applied to clip ${index + 1}`};
        }
    }

    cmdSpeedUp(clip, index) {
        if (!clip) {
            appState.timelineClips.forEach(c => {
                if (c.speed === 1.0) {
                    c.speed = 2.0;
                    c.duration = c.media.duration / c.speed;
                }
            });
            videoEditor.recalculateDuration();
            videoEditor.renderTimeline();
            return {success: true, message: 'Speed up applied to all clips'};
        } else {
            clip.speed = 2.0;
            clip.duration = clip.media.duration / clip.speed;
            videoEditor.recalculateDuration();
            videoEditor.renderTimeline();
            return {success: true, message: `Speed up applied to clip ${index + 1}`};
        }
    }

    cmdAddFade(clip, index) {
        if (!clip) {
            appState.timelineClips.forEach(c => {
                if (!c.transitions.includes('fade')) {
                    c.transitions.push('fade');
                }
            });
            videoEditor.updatePreview();
            return {success: true, message: 'Fade transitions added to all clips'};
        } else {
            if (!clip.transitions.includes('fade')) {
                clip.transitions.push('fade');
            }
            videoEditor.updatePreview();
            return {success: true, message: `Fade transition added to clip ${index + 1}`};
        }
    }

    cmdAddZoom(clip, index) {
        if (!clip) {
            appState.timelineClips.forEach(c => {
                if (!c.transitions.includes('zoom')) {
                    c.transitions.push('zoom');
                }
            });
            videoEditor.updatePreview();
            return {success: true, message: 'Zoom transitions added to all clips'};
        } else {
            if (!clip.transitions.includes('zoom')) {
                clip.transitions.push('zoom');
            }
            videoEditor.updatePreview();
            return {success: true, message: `Zoom transition added to clip ${index + 1}`};
        }
    }

    cmdAddFilter(clip, index, filterType) {
        const filterNames = {vibrant: 'vibrant', vintage: 'vintage', bw: 'black & white'};
        
        if (!clip) {
            appState.timelineClips.forEach(c => {
                c.filters = [filterType];
            });
            videoEditor.updatePreview();
            return {success: true, message: `${filterNames[filterType]} filter applied to all clips`};
        } else {
            clip.filters = [filterType];
            videoEditor.updatePreview();
            return {success: true, message: `${filterNames[filterType]} filter applied to clip ${index + 1}`};
        }
    }

    cmdAdjustVolume(command, clip, index) {
        // Extract volume level
        const volumeMatch = command.match(/(\d+)%?|(?:to |at )(\d+)|mute|quiet|loud|max/);
        let volume = 1.0;
        
        if (volumeMatch) {
            if (volumeMatch[1] || volumeMatch[2]) {
                volume = parseInt(volumeMatch[1] || volumeMatch[2]) / 100;
            } else if (command.includes('mute')) {
                volume = 0;
            } else if (command.includes('quiet')) {
                volume = 0.3;
            } else if (command.includes('loud') || command.includes('max')) {
                volume = 1.0;
            }
        } else if (command.includes('lower') || command.includes('decrease')) {
            volume = 0.5;
        } else if (command.includes('raise') || command.includes('increase')) {
            volume = 1.0;
        }

        if (!clip) {
            appState.timelineClips.forEach(c => {
                c.volume = volume;
            });
            return {success: true, message: `Volume set to ${Math.round(volume * 100)}% for all clips`};
        } else {
            clip.volume = volume;
            return {success: true, message: `Volume set to ${Math.round(volume * 100)}% for clip ${index + 1}`};
        }
    }

    cmdRemoveEffects(clip, index) {
        if (!clip) {
            appState.timelineClips.forEach(c => {
                c.transitions = [];
                c.filters = [];
                c.speed = 1.0;
                c.duration = c.media.duration;
                c.volume = 1.0;
            });
            videoEditor.recalculateDuration();
            videoEditor.renderTimeline();
            videoEditor.updatePreview();
            return {success: true, message: 'All effects removed from all clips'};
        } else {
            clip.transitions = [];
            clip.filters = [];
            clip.speed = 1.0;
            clip.duration = clip.media.duration;
            clip.volume = 1.0;
            videoEditor.recalculateDuration();
            videoEditor.renderTimeline();
            videoEditor.updatePreview();
            return {success: true, message: `All effects removed from clip ${index + 1}`};
        }
    }

    cmdAddAllClips() {
        if (appState.mediaFiles.length === 0) {
            return {success: false, message: 'No media files to add. Import some first!'};
        }
        
        let addedCount = 0;
        appState.mediaFiles.forEach((media, index) => {
            // Check if already added
            const alreadyAdded = appState.timelineClips.some(clip => clip.media.id === media.id);
            if (!alreadyAdded) {
                videoEditor.addToTimeline(index);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            return {success: true, message: `Added ${addedCount} clips to timeline`};
        } else {
            return {success: true, message: 'All clips already on timeline'};
        }
    }

    addCommandToHistory(command) {
        const history = document.getElementById('commandHistory');
        const entry = document.createElement('div');
        entry.className = 'command-entry';
        entry.innerHTML = `
            <span class="command-text">💬 "${command}"</span>
        `;
        history.insertBefore(entry, history.firstChild);
        
        // Keep only last 5 commands
        while (history.children.length > 5) {
            history.removeChild(history.lastChild);
        }
    }

    showSuggestion(message, type) {
        const container = document.getElementById('suggestionsContainer');
        container.innerHTML = `<p class="ai-${type}">${message}</p>`;
    }

    getIconForType(type) {
        const icons = {
            'length': '⏱️',
            'transitions': '🎬',
            'filters': '🎨',
            'speed': '⚡',
            'audio': '🔊',
            'pacing': '🎯',
            'duration': '✂️',
            'transition': '➡️',
            'filter': '🌈'
        };
        return icons[type] || '💡';
    }
}

// Draft Management System
class DraftManager {
    constructor() {
        this.loadDraftsFromStorage();
    }

    saveDraft() {
        const draftName = prompt('Name your draft:', `Draft ${new Date().toLocaleString()}`);
        if (!draftName) return;

        const draft = {
            id: Date.now(),
            name: draftName,
            timestamp: new Date().toISOString(),
            project: {
                clips: appState.timelineClips.map(clip => ({
                    mediaId: clip.media.id,
                    startTime: clip.startTime,
                    duration: clip.duration,
                    effects: clip.effects,
                    transitions: clip.transitions,
                    speed: clip.speed,
                    volume: clip.volume,
                    filters: clip.filters
                })),
                duration: appState.duration,
                mediaFiles: appState.mediaFiles.map(m => ({
                    id: m.id,
                    name: m.name,
                    type: m.type,
                    duration: m.duration
                    // Note: URLs cannot be saved, files need to be re-imported
                }))
            }
        };

        const drafts = this.getDrafts();
        drafts.push(draft);
        localStorage.setItem('videoEditorDrafts', JSON.stringify(drafts));
        
        videoEditor.showNotification(`💾 Draft "${draftName}" saved!`);
    }

    getDrafts() {
        const stored = localStorage.getItem('videoEditorDrafts');
        return stored ? JSON.parse(stored) : [];
    }

    showDrafts() {
        const drafts = this.getDrafts();
        const draftsList = document.getElementById('draftsList');
        
        if (drafts.length === 0) {
            draftsList.innerHTML = '<p>No saved drafts yet. Create your first video!</p>';
            draftsList.style.display = 'block';
            return;
        }

        draftsList.innerHTML = '<h3>Your Saved Drafts</h3>';
        drafts.forEach((draft, index) => {
            const draftCard = document.createElement('div');
            draftCard.className = 'draft-card';
            draftCard.innerHTML = `
                <div class="draft-info">
                    <h4>${draft.name}</h4>
                    <p>📅 ${new Date(draft.timestamp).toLocaleString()}</p>
                    <p>⏱️ Duration: ${mediaImporter.formatTime(draft.project.duration)}</p>
                    <p>🎬 ${draft.project.clips.length} clips</p>
                </div>
                <div class="draft-actions">
                    <button class="btn-load" onclick="draftManager.loadDraft(${index})">📂 Load</button>
                    <button class="btn-delete" onclick="draftManager.deleteDraft(${index})">🗑️ Delete</button>
                </div>
            `;
            draftsList.appendChild(draftCard);
        });

        draftsList.style.display = 'block';
    }

    loadDraft(index) {
        const drafts = this.getDrafts();
        const draft = drafts[index];

        if (confirm(`Load draft "${draft.name}"? Current work will be lost if not saved.`)) {
            // Note: This is a simplified version. In production, you'd need to handle
            // re-importing media files or storing them in IndexedDB
            alert('Draft loading requires media files to be re-imported. Please import your media files first, then the draft data will be applied.');
            
            videoEditor.showNotification(`Loading draft: ${draft.name}`);
        }
    }

    deleteDraft(index) {
        const drafts = this.getDrafts();
        if (confirm(`Delete draft "${drafts[index].name}"?`)) {
            drafts.splice(index, 1);
            localStorage.setItem('videoEditorDrafts', JSON.stringify(drafts));
            this.showDrafts();
            videoEditor.showNotification('Draft deleted');
        }
    }

    loadDraftsFromStorage() {
        // Initialize on page load
    }

    exportVideo() {
        if (appState.timelineClips.length === 0) {
            alert('Please add clips to your timeline first!');
            return;
        }

        document.getElementById('exportModal').style.display = 'flex';
    }

    startExport() {
        const format = document.querySelector('input[name="format"]:checked').value;
        const progressContainer = document.getElementById('exportProgress');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        progressContainer.style.display = 'block';
        
        // Simulate export process
        let progress = 0;
        const exportInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(exportInterval);
                this.finishExport(format);
            }
            progressBar.value = progress;
            progressText.textContent = `Exporting for ${format}... ${Math.floor(progress)}%`;
        }, 200);
    }

    finishExport(format) {
        // In a real implementation, this would use a library like FFmpeg.js
        // For now, we'll create a simple canvas recording
        
        videoEditor.showNotification(`✅ Video exported for ${format}!`);
        document.getElementById('exportProgress').innerHTML = `
            <p class="success">✅ Export Complete!</p>
            <p>Your video is ready for ${format}!</p>
            <p class="note">📱 In a production version, this would generate a downloadable video file.</p>
            <button class="btn-primary" onclick="document.getElementById('exportModal').style.display='none'">Close</button>
        `;
    }
}

// Initialize all components
const mediaImporter = new MediaImporter();
const videoEditor = new VideoEditor();
const aiEditor = new AIEditor();
const draftManager = new DraftManager();

// Mobile-friendly touch support
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, that's okay
    });
}

console.log('🎬 AI Video Editor loaded successfully!');
