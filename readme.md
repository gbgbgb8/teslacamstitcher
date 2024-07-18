# Tesla Dashcam Video Processor

## Overview
The Tesla Dashcam Video Processor is a browser-based tool that allows users to combine and process video files from Tesla's dashcam and sentry mode. It provides various layout options and features to create a single, comprehensive video output from multiple camera inputs.

## Current Features
- Drag-and-drop interface for easy file uploading
- Support for multiple video layouts: Fullscreen, Widescreen, Diamond, and Cross
- Option to exclude specific cameras
- Customizable timestamp overlay
- Background blur effect for aesthetically pleasing video composition
- Aspect ratio preservation to prevent video distortion
- In-browser video processing using HTML5 Canvas and MediaRecorder APIs
- Downloadable output in WebM format

## Code Review and Issues

### HTML (index.html)
1. **Accessibility**: The file input is hidden, which may cause accessibility issues. Consider using `aria-label` or `aria-labelledby` to improve screen reader compatibility.
2. **Validation**: There's no form validation for the timestamp format input.

### JavaScript (script.js)
1. **Error Handling**: There's limited error handling, especially for file reading and video processing.
2. **Performance**: The video processing might be slow for longer videos or on less powerful devices.
3. **Browser Compatibility**: The code uses modern APIs which might not work in older browsers.
4. **Memory Management**: Large video files might cause memory issues as everything is processed in-browser.

### CSS (style.css)
1. **Responsiveness**: The design is not fully responsive and might not work well on smaller screens.
2. **Customization**: Limited color scheme customization options.

## Planned Fixes and Improvements

### Short-term Fixes
1. Improve accessibility by adding proper ARIA attributes to the file input.
2. Implement basic form validation for the timestamp format input.
3. Add error handling for file reading and video processing.
4. Implement a progress indicator for video processing.

### Long-term Improvements
1. Optimize video processing performance, possibly by using Web Workers or chunked processing.
2. Implement fallbacks or polyfills for older browsers.
3. Add support for more video formats (currently limited to what the browser supports).
4. Implement a more responsive design for better mobile compatibility.
5. Add color scheme customization options.
6. Implement server-side processing for handling larger files and reducing client-side load.

## How to Use
1. Open `index.html` in a modern web browser.
2. Drag and drop Tesla dashcam video files onto the designated area, or click to select files.
3. Choose the desired layout from the dropdown menu.
4. Optionally, configure the timestamp display and format.
5. Click "Process Videos" to start the video processing.
6. Once processing is complete, you can preview the video and download it.

## Development Setup
1. Ensure you have the following files in your project directory:
   - `index.html`
   - `script.js`
   - `style.css`
2. No build process is required as this is a client-side application.
3. For development, it's recommended to use a local server to avoid CORS issues when loading local files.

## License
MIT, do wtf you want