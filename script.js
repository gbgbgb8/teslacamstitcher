const LAYOUTS = {
    MOBILE_LANDSCAPE: {
        width: 1920,
        height: 840,
        cameras: {
            front: { width: 960, height: 720, x: 0, y: 0 },
            left: { width: 480, height: 360, x: 0, y: 720 },
            right: { width: 480, height: 360, x: 480, y: 720 },
            rear: { width: 960, height: 720, x: 960, y: 0 },
        },
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
    },
};

let videos = { front: null, left: null, right: null, rear: null };
let excludedCameras = [];

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const processButton = document.getElementById('processButton');
    const showTimestampCheckbox = document.getElementById('showTimestamp');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDrag);
    dropZone.addEventListener('dragleave', handleDrag);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    processButton.addEventListener('click', processVideos);
    showTimestampCheckbox.addEventListener('change', toggleTimestampFormat);

    toggleTimestampFormat();
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
    document.getElementById('processButton').disabled = Object.values(videos).every(v => v === null);
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    Object.entries(videos).forEach(([camera, file]) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <span class="capitalize">${camera}: ${file ? file.name : 'Not selected'}</span>
            <input type="checkbox" id="exclude-${camera}" ${excludedCameras.includes(camera) ? 'checked' : ''}>
            <label for="exclude-${camera}">Exclude</label>
        `;
        div.querySelector(`#exclude-${camera}`).addEventListener('change', (e) => {
            if (e.target.checked) {
                excludedCameras.push(camera);
            } else {
                excludedCameras = excludedCameras.filter(c => c !== camera);
            }
        });
        fileList.appendChild(div);
    });
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

        // Draw blurred background
        ctx.filter = 'blur(20px)';
        for (const [camera, video] of Object.entries(videoElements)) {
            const { width, height, x, y } = selectedLayout.cameras[camera];
            ctx.drawImage(video, x, y, width, height);
        }
        ctx.filter = 'none';

        // Draw actual videos
        for (const [camera, video] of Object.entries(videoElements)) {
            const { width, height, x, y } = selectedLayout.cameras[camera];
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

        if (showTimestamp) {
            const elapsedTime = Date.now() - startTime;
            const timestamp = moment(startTime + elapsedTime).format(timestampFormat);
            ctx.font = '24px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(timestamp, canvas.width / 2, canvas.height - 10);
        }

        if (Object.values(videoElements)[0].currentTime < Object.values(videoElements)[0].duration) {
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