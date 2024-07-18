const LAYOUTS = {
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
};

let videos = { front: null, left: null, right: null, rear: null };
let excludedCameras = [];
let ffmpeg;

document.addEventListener('DOMContentLoaded', async () => {
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

    // Initialize ffmpeg
    try {
        ffmpeg = new FFmpeg();
        await ffmpeg.load({
            log: true,
            progress: ({ ratio }) => {
                const percent = (ratio * 100).toFixed(2);
                document.getElementById('progressBar').style.width = `${percent}%`;
                document.getElementById('progressText').textContent = `${percent}%`;
            },
        });
        console.log('ffmpeg is ready to use');
        document.getElementById('message').textContent = 'ffmpeg.wasm is ready. You can now process videos.';
    } catch (error) {
        console.error('Failed to load ffmpeg:', error);
        document.getElementById('message').textContent = 'Failed to load ffmpeg.wasm. Please check your internet connection and try again.';
    }
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
    const progressElement = document.getElementById('progress');
    messageElement.textContent = 'Processing videos...';
    outputElement.innerHTML = '';
    document.getElementById('processButton').disabled = true;
    progressElement.style.display = 'block';

    const layout = document.getElementById('layout').value;
    const showTimestamp = document.getElementById('showTimestamp').checked;
    const timestampFormat = document.getElementById('timestampFormat').value;
    const videoSpeed = parseFloat(document.getElementById('videoSpeed').value);

    const selectedLayout = LAYOUTS[layout];

    try {
        // Process each video
        for (const [camera, video] of Object.entries(videos)) {
            if (video && !excludedCameras.includes(camera)) {
                const inputName = `input_${camera}.mp4`;
                const { width, height } = selectedLayout.cameras[camera];
                await ffmpeg.writeFile(inputName, await FFmpeg.fetchFile(video));
                await ffmpeg.exec([
                    '-i', inputName,
                    '-vf', `scale=${width}:${height},setpts=${1/videoSpeed}*PTS`,
                    '-c:v', 'libx264',
                    '-crf', '23',
                    '-preset', 'medium',
                    '-an',
                    `output_${camera}.mp4`
                ]);
                messageElement.textContent = `Processed ${camera} camera`;
            }
        }

        // Combine videos
        const filterComplex = [];
        const inputs = [];
        const availableCameras = Object.entries(videos)
            .filter(([camera, v]) => v !== null && !excludedCameras.includes(camera));

        availableCameras.forEach(([camera], index) => {
            inputs.push('-i', `output_${camera}.mp4`);
            const { x, y } = selectedLayout.cameras[camera];
            filterComplex.push(`[${index}:v]setpts=PTS-STARTPTS,format=yuva420p,colorchannelmixer=aa=1[${camera}];`);
            filterComplex.push(`[${camera}]overlay=${x}:${y}:shortest=1:format=yuv420`);
            if (index < availableCameras.length - 1) filterComplex.push('[temp];[temp]');
        });

        if (showTimestamp) {
            filterComplex.push(`,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-tw)/2:y=h-th-10:text='${timestampFormat}'`);
        }

        const { width, height } = selectedLayout;
        await ffmpeg.exec([
            '-f', 'lavfi', '-i', `color=c=black:s=${width}x${height}`,
            ...inputs,
            '-filter_complex', filterComplex.join(''),
            '-c:v', 'libx264',
            '-crf', '23',
            '-preset', 'medium',
            'output.mp4'
        ]);

        messageElement.textContent = 'Finalizing video...';

        const data = await ffmpeg.readFile('output.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);

        outputElement.innerHTML = `
            <h2>Processed Video:</h2>
            <video controls src="${videoUrl}" style="width: 100%;"></video>
            <a href="${videoUrl}" download="processed_dashcam_video.mp4">Download Video</a>
        `;

        messageElement.textContent = 'Video processing complete!';
    } catch (error) {
        console.error('Error processing videos:', error);
        messageElement.textContent = `Error processing videos: ${error.message}. Please try again.`;
    } finally {
        document.getElementById('processButton').disabled = false;
        progressElement.style.display = 'none';
    }
}