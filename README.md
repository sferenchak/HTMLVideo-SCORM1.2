# HTML5 Video Scorm 1.2 Course

This is a very simple implementation of an HTML5 Video course that can be packaged and delivered through an LMS that supports Scorm 1.2.

## Scorm 1.2 Tracking

- **Completion** - Will mark the course as complete once getting through 95% of the video. Initializes the status to _incomplete_ upon first launch.
- **Time** - Tracks the total time spent within the course.
- **Bookmarking** - Will record the furthest point that the learner reached within a video. Upon exiting and re-opening the course the learner will be prompted to return where they left off. If they opt to continue, they'll be returned to that their furthest point reached in the video.

## Getting Started

Clone or download the repository to your computer

### Make changes to the video and title

The Title would need to be changed within the dist/index.html as well as dist/imsmanifest.xml files.

The video is in dist/videos. If you change the name of the video, make sure to update the video src wtihin dist/index.html as well as the resource filename within the imsmanifest.xml.

When ready to package the course zip up everything within the "dist" directory and upload to the LMS for testing.

## Tested Environments

- SCORM Cloud
  - Chrome 75.0.3770.80
  - Firefox 66.0.2
  - Internet Explorer 11.765.17134.0

Video Credits: Sintel © copyright Blender Foundation | www.sintel.org.
