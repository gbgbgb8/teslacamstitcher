# Tesla Dashcam Video Processor

## Overview
The Tesla Dashcam Video Processor is a web-based tool that allows users to combine and process video files from Tesla's dashcam and sentry mode. It provides various layout options and features to create a single, comprehensive video output from multiple camera inputs.
Made with Claude, GPT4o, etc.

## Current Features
- Drag-and-drop interface for easy file uploading
- Support for multiple video layouts:
  - Mobile Landscape
  - Fullscreen
  - Widescreen
  - Diamond
  - Cross
- Option to exclude specific cameras
- Customizable timestamp overlay
- Fade effect for secondary cameras in Mobile Landscape layout
- Aspect ratio preservation to prevent video distortion
- In-browser video processing using HTML5 Canvas and MediaRecorder APIs
- Downloadable output in WebM format
- Responsive design for both desktop and mobile devices

## Requested Features (To Be Implemented)
1. Drag-and-drop rearrangement of camera views:
   - Allow users to customize the position of each camera view within the layout
   - Translate the custom arrangement to the final video output
2. Optional borders:
   - Add a toggle to show/hide borders between camera views
   - Borders should be off by default
3. Adjustable settings exposed in the UI:
   - Secondary camera opacity control
   - Video playback speed control

## Suggested Enhancements
1. Preview thumbnails:
   - Generate and display thumbnails for each uploaded video file
   - Update thumbnails in real-time when layout or arrangement changes
2. Color customization:
   - Allow users to choose custom colors for borders, timestamps, and other UI elements
3. Export options:
   - Add options for different output formats (e.g., MP4, AVI)
   - Allow users to choose video quality settings
4. Keyboard shortcuts:
   - Implement keyboard shortcuts for common actions (e.g., play/pause, skip forward/backward)
5. Batch processing:
   - Enable users to queue multiple sets of dashcam videos for sequential processing
6. Save/Load configurations:
   - Allow users to save their layout and settings preferences
   - Provide option to load saved configurations for quick setup

## Technical Improvements
1. Performance optimization:
   - Implement Web Workers for better performance during video processing
   - Add progress indicators for longer operations
2. Error handling:
   - Improve error messages and handling for various scenarios (e.g., unsupported file types, processing errors)
3. Accessibility:
   - Enhance keyboard navigation and screen reader compatibility
4. Testing:
   - Implement unit tests for core functions
   - Add end-to-end tests for the user interface

## How to Use
1. Open `index.html` in a modern web browser
2. Drag and drop Tesla dashcam video files onto the designated area, or click to select files
3. Choose the desired layout from the dropdown menu
4. Configure timestamp display and format if needed
5. Click "Process Videos" to start the video processing
6. Once processing is complete, preview the video and download it

## Development Setup
1. Clone the repository
2. Ensure you have the following files in your project directory:
   - `index.html`
   - `script.js`
   - `style.css`
3. No build process is required as this is a client-side application
4. For development, it's recommended to use a local server to avoid CORS issues when loading local files
5. currently deployed to https://teslacamstitcher.vercel.app/

## Next Steps
1. Implement drag-and-drop rearrangement of camera views
2. Add optional borders with a toggle in the UI
3. Implement adjustable settings for secondary camera opacity and video playback speed
4. Generate and display preview thumbnails for uploaded videos
5. Enhance error handling and user feedback during video processing

## License
This project is open source and available under the [MIT License](LICENSE).