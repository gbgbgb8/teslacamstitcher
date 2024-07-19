const LAYOUTS = {
    MOBILE_LANDSCAPE: {
        width: 1920,
        height: 1080,
        cameras: {
            front: { width: 1920, height: 1080, x: 0, y: 0 },
            rear: { width: 640, height: 360, x: 1280, y: 720 },
            left: { width: 640, height: 360, x: 0, y: 720 },
            right: { width: 640, height: 360, x: 640, y: 720 },
        },
        gridAreas: 'front front front front front front . . . . . . . rear rear rear left left left right right right',
        gridColumns: 'repeat(3, 1fr)',
        gridRows: 'auto auto',
    },
    FULLSCREEN: {
        width: 1920,
        height: 960,
        cameras: {
            front: { width: 1280, height: 960, x: 320, y: 0 },
            left: { width: 640, height: 480, x: 0, y: 480 },
            right: { width: 640, height: 480, x: 1280, y: 480 },
            rear: { width: 640, height: 480, x: 640, y: 480 },
        },
        gridAreas: '. front front front . left front front front right rear rear rear',
        gridColumns: 'repeat(5, 1fr)',
        gridRows: '1fr 1fr',
    },
    WIDESCREEN: {
        width: 1920,
        height: 1920,
        cameras: {
            front: { width: 1920, height: 1440, x: 0, y: 0 },
            left: { width: 640, height: 480, x: 0, y: 1440 },
            right: { width: 640, height: 480, x: 1280, y: 1440 },
            rear: { width: 640, height: 480, x: 640, y: 1440 },
        },
        gridAreas: 'front front front left rear right',
        gridColumns: 'repeat(3, 1fr)',
        gridRows: '3fr 1fr',
    },
    DIAMOND: {
        width: 1920,
        height: 976,
        cameras: {
            front: { width: 1280, height: 480, x: 320, y: 0 },
            left: { width: 640, height: 480, x: 0, y: 248 },
            right: { width: 640, height: 480, x: 1280, y: 248 },
            rear: { width: 1280, height: 480, x: 320, y: 496 },
        },
        gridAreas: '. front front . left . . right rear rear',
        gridColumns: 'repeat(4, 1fr)',
        gridRows: '1fr 1fr 1fr',
    },
    CROSS: {
        width: 1920,
        height: 1440,
        cameras: {
            front: { width: 1280, height: 480, x: 320, y: 0 },
            left: { width: 960, height: 480, x: 0, y: 480 },
            right: { width: 960, height: 480, x: 960, y: 480 },
            rear: { width: 1280, height: 480, x: 320, y: 960 },
        },
        gridAreas: '. front front . left right . rear rear .',
        gridColumns: 'repeat(4, 1fr)',
        gridRows: '1fr 1fr 1fr',
    },
};

let videos = { front: null, left: null, right: null, rear: null };
let excludedCameras = [];
let cameraPositions = {};

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const processButton = document.getElementById('processButton');
    const showTimestampCheckbox = document.getElementById('showTimestamp');
    const layoutSelect = document.getElementById('layout');
    const showBordersCheckbox = document.getElementById('showBorders');
    const secondaryOpacitySlider = document.getElementById('secondaryOpacity');
    const videoSpeedSlider = document.getElementById('videoSpeed');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDrag);
    dropZone.addEventListener('dragleave', handleDrag);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    processButton.addEventListener('click', processVideos);
    showTimestampCheckbox.addEventListener('change', toggleTimestampFormat);
    layoutSelect.addEventListener('change', updateThumbnailLayout);
    showBordersCheckbox.addEventListener('change', updateThumbnailLayout);
    secondaryOpacitySlider.addEventListener('input', updateOpacityValue);
    videoSpeedSlider.addEventListener('input', updateSpeedValue);

    toggleTimestampFormat();
    updateOpacityValue();
    updateSpeedValue();
});

function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropZone').classList.toggle('drag-active', e.type === 'dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropZone').classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
}

function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
}

function handleFiles(files) {
    videos = { front: null, left: null, right: null, rear: null };
    Array.from(files).forEach(file => {
        if (file.name.includes('-front')) videos.front = file;
        else if (file.name.includes('-left_repeater')) videos.left = file;
        else if (file.name.includes('-right_repeater')) videos.right = file;
        else if (file.name.includes('-back')) videos.rear = file;
    });
    updateFileList();
    generateThumbnails();
    updateThumbnailLayout();
    document.getElementById('processButton').disabled = Object.values(videos).every(v => v === null);
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    Object.entries(videos).forEach(([camera, file]) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.draggable = true;
        div.dataset.camera = camera;
        div.innerHTML = `
            <div class="file-info">
                <span class="capitalize">${camera}: ${file ? file.name : 'Not selected'}</span>
                <input type="checkbox" id="exclude-${camera}" ${excludedCameras.includes(camera) ? 'checked' : ''}>
                <label for="exclude-${camera}">Exclude</label>
            </div>
            <div class="thumbnail" id="thumbnail-${camera}"></div>
        `;
        div.querySelector(`#exclude-${camera}`).addEventListener('change', (e) => {
            if (e.target.checked) {
                excludedCameras.push(camera);
            } else {
                excludedCameras = excludedCameras.filter(c => c !== camera);
            }
            updateThumbnailLayout();
        });
        div.addEventListener('dragstart', dragStart);
        div.addEventListener('dragover', dragOver);
        div.addEventListener('drop', drop);
        fileList.appendChild(div);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.camera);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const draggedCamera = e.dataTransfer.getData('text');
    const targetCamera = e.target.closest('.file-item').dataset.camera;
    if (draggedCamera !== targetCamera) {
        swapCameraPositions(draggedCamera, targetCamera);
        updateThumbnailLayout();
    }
}

function swapCameraPositions(camera1, camera2) {
    const temp = cameraPositions[camera1];
    cameraPositions[camera1] = cameraPositions[camera2];
    cameraPositions[camera2] = temp;
}

function updateThumbnailLayout() {
    const layout = document.getElementById('layout').value;
    const fileList = document.getElementById('fileList');
    const selectedLayout = LAYOUTS[layout];

    // Initialize cameraPositions if not set
    if (Object.keys(cameraPositions).length === 0) {
        cameraPositions = {...selectedLayout.cameras};
    }

    fileList.style.gridTemplateAreas = `"${selectedLayout.gridAreas}"`;
    fileList.style.gridTemplateColumns = selectedLayout.gridColumns;
    fileList.style.gridTemplateRows = selectedLayout.gridRows;
    
    Object.entries(cameraPositions).forEach(([camera, dims]) => {
        const thumbnail = document.querySelector(`.file-item[data-camera="${camera}"]`);
        if (thumbnail) {
            thumbnail.style.gridArea = camera;
            thumbnail.style.display = excludedCameras.includes(camera) ? 'none' : 'block';
        }
    });

    const showBorders = document.getElementById('showBorders').checked;
    if (showBorders) {
        fileList.style.gap = '2px';
        fileList.style.padding = '2px';
        fileList.style.backgroundColor = 'white';
    } else {
        fileList.style.gap = '0';
        fileList.style.padding = '0';
        fileList.style.backgroundColor = 'transparent';
    }
}

function generateThumbnails() {
    Object.entries(videos).forEach(([camera, file]) => {
        if (file) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.addEventListener('loadeddata', () => {
                video.currentTime = 1; // Set to 1 second to avoid black frames
            });
            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 90;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnail = document.getElementById(`thumbnail-${camera}`);
                thumbnail.style.backgroundImage = `url(${canvas.toDataURL()})`;
                URL.revokeObjectURL(video.src);
            });
        }
    });
}

function updateOpacityValue() {
    const value = document.getElementById('secondaryOpacity').value;
    document.getElementById('secondaryOpacityValue').textContent = value;
}

function updateSpeedValue() {
    const value = document.getElementById('videoSpeed').value;
    document.getElementById('videoSpeedValue').textContent = value + 'x';
}

function toggleTimestampFormat() {
    const showTimestamp = document.getElementById('showTimestamp').checked;
    document.getElementById('timestampFormatGroup').style.display = showTimestamp ? 'block' : 'none';
}

async function processVideos() {
    const messageElement = document.getElementById('message');
    const outputElement = document.getElementById('output');
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');

    messageElement.textContent = 'Processing videos...';
    outputElement.innerHTML = '';
    document.getElementById('processButton').disabled = true;

    const layout = document.getElementById('layout').value;
    const showTimestamp = document.getElementById('showTimestamp').checked;
    const timestampFormat = document.getElementById('timestampFormat').value;
    const showBorders = document.getElementById('showBorders').checked;
    const secondaryOpacity = parseFloat(document.getElementById('secondaryOpacity').value);
    const videoSpeed = parseFloat(document.getElementById('videoSpeed').value);

    const selectedLayout = LAYOUTS[layout];
    canvas.width = selectedLayout.width;
    canvas.height = selectedLayout.height;

    const videoElements = {};
    for (const [camera, file] of Object.entries(videos)) {
        if (file && !excludedCameras.includes(camera)) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            await video.play();
            videoElements[camera] = video;
        }
    }

    const startTime = Date.now();
    const stream = canvas.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        outputElement.innerHTML = `
            <video controls src="${videoUrl}" style="width: 100%;"></video>
            <a href="${videoUrl}" download="processed_dashcam_video.webm">Download Video</a>
        `;
        messageElement.textContent = 'Video processing complete!';
    };

    recorder.start();

    function drawFrame() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        Object.entries(cameraPositions).forEach(([camera, dims]) => {
            if (videoElements[camera] && !excludedCameras.includes(camera)) {
                ctx.save();
                ctx.globalAlpha = camera === 'front' ? 1 : secondaryOpacity;
                drawVideo(ctx, videoElements[camera], dims);
                ctx.restore();
            }
        });

        if (showBorders) {
            drawBorders(ctx, selectedLayout);
        }

        if (showTimestamp) {
            const elapsedTime = (Date.now() - startTime) * videoSpeed;
            const timestamp = moment(startTime + elapsedTime).format(timestampFormat);
            ctx.font = '24px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(timestamp, canvas.width / 2, canvas.height - 10);
        }

        if (Object.values(videoElements)[0].currentTime < Object.values(videoElements)[0].duration) {
            Object.values(videoElements).forEach(video => {
                video.currentTime += (1 / 60) * videoSpeed; // Assuming 60 fps
            });
            requestAnimationFrame(drawFrame);
        } else {
            recorder.stop();
            for (const video of Object.values(videoElements)) {
                video.pause();
            }
        }
    }

    drawFrame();
}
function drawVideo(ctx, video, layout) {
    const { width, height, x, y } = layout;
    const aspectRatio = video.videoWidth / video.videoHeight;
    let drawWidth = width;
    let drawHeight = height;
    let drawX = x;
    let drawY = y;

    if (width / height > aspectRatio) {
        drawWidth = height * aspectRatio;
        drawX = x + (width - drawWidth) / 2;
    } else {
        drawHeight = width / aspectRatio;
        drawY = y + (height - drawHeight) / 2;
    }

    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
}

function drawBorders(ctx, layout) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    Object.values(layout.cameras).forEach(camera => {
        ctx.rect(camera.x, camera.y, camera.width, camera.height);
    });
    ctx.stroke();
}

// Helper function to ensure video seeking doesn't go out of bounds
function safeSeek(video, time) {
    video.currentTime = Math.min(Math.max(0, time), video.duration);
}

// Add this function to handle video playback
function playProcessedVideo(videoUrl) {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.style.width = '100%';
    
    const outputElement = document.getElementById('output');
    outputElement.innerHTML = '';
    outputElement.appendChild(video);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = videoUrl;
    downloadLink.download = 'processed_dashcam_video.webm';
    downloadLink.textContent = 'Download Video';
    downloadLink.className = 'download-button';
    outputElement.appendChild(downloadLink);
}

// Error handling function
function handleError(message) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = `Error: ${message}`;
    messageElement.style.color = 'red';
    document.getElementById('processButton').disabled = false;
}

// Add this function to clean up resources
function cleanupResources() {
    Object.values(videos).forEach(video => {
        if (video) {
            URL.revokeObjectURL(video.src);
        }
    });
}

// Update the processVideos function to use these new helper functions
async function processVideos() {
    const messageElement = document.getElementById('message');
    const outputElement = document.getElementById('output');
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');

    messageElement.textContent = 'Processing videos...';
    outputElement.innerHTML = '';
    document.getElementById('processButton').disabled = true;

    try {
        const layout = document.getElementById('layout').value;
        const showTimestamp = document.getElementById('showTimestamp').checked;
        const timestampFormat = document.getElementById('timestampFormat').value;
        const showBorders = document.getElementById('showBorders').checked;
        const secondaryOpacity = parseFloat(document.getElementById('secondaryOpacity').value);
        const videoSpeed = parseFloat(document.getElementById('videoSpeed').value);

        const selectedLayout = LAYOUTS[layout];
        canvas.width = selectedLayout.width;
        canvas.height = selectedLayout.height;

        const videoElements = {};
        for (const [camera, file] of Object.entries(videos)) {
            if (file && !excludedCameras.includes(camera)) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                await video.play();
                videoElements[camera] = video;
            }
        }

        const startTime = Date.now();
        const stream = canvas.captureStream();
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            playProcessedVideo(videoUrl);
            messageElement.textContent = 'Video processing complete!';
            document.getElementById('processButton').disabled = false;
        };

        recorder.start();

        function drawFrame() {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            Object.entries(cameraPositions).forEach(([camera, dims]) => {
                if (videoElements[camera] && !excludedCameras.includes(camera)) {
                    ctx.save();
                    ctx.globalAlpha = camera === 'front' ? 1 : secondaryOpacity;
                    drawVideo(ctx, videoElements[camera], dims);
                    ctx.restore();
                }
            });

            if (showBorders) {
                drawBorders(ctx, selectedLayout);
            }

            if (showTimestamp) {
                const elapsedTime = (Date.now() - startTime) * videoSpeed;
                const timestamp = moment(startTime + elapsedTime).format(timestampFormat);
                ctx.font = '24px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(timestamp, canvas.width / 2, canvas.height - 10);
            }

            if (Object.values(videoElements)[0].currentTime < Object.values(videoElements)[0].duration) {
                Object.values(videoElements).forEach(video => {
                    safeSeek(video, video.currentTime + (1 / 60) * videoSpeed);
                });
                requestAnimationFrame(drawFrame);
            } else {
                recorder.stop();
                Object.values(videoElements).forEach(video => video.pause());
            }
        }

        drawFrame();
    } catch (error) {
        handleError(error.message);
    } finally {
        cleanupResources();
    }
}