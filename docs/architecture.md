# Architecture

The application is divided into independent layers.

## Frontend

Responsible for:

- Image upload
- Preview
- Displaying analysis
- User interaction

Technologies:

- React
- TypeScript
- Tailwind

---

## Backend

Responsible for:

- File validation
- EXIF extraction
- Image analysis
- AI orchestration

Technologies:

- FastAPI
- Python

---

## Computer Vision Layer

Processes uploaded images using OpenCV.

Responsibilities:

- Brightness
- Contrast
- Sharpness
- Color analysis
- Composition metrics

---

## AI Layer

Receives:

- Image
- EXIF data
- Computer vision metrics

Returns:

- Photography critique
- Camera setting estimates
- Recreation instructions
- Editing recommendations

---

## Future Database

Will store:

- User accounts
- Uploaded images
- Analysis history
- Saved reports