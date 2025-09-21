# Text to Handwriting

This web application transforms digital text into a realistic handwriting style. It provides a rich editor to customize the appearance of the text, integrate it with images, and export the final result.

## Features

- **Dynamic Text Conversion**: Renders typed text into a handwriting format on an interactive canvas.
- **Custom Fonts**: Includes a variety of custom handwriting fonts to choose from.
- **Image Integration**: Allows users to upload their own images to use as backgrounds.
- **Canvas Editor**: A full-featured editor to manipulate the text and image layers.
- **Style Adjustments**: Provides tools for cropping, applying filters, and adjusting the output.
- **Export to Image**: Save your final creation as an image file.

## Tech Stack

- **Frontend**: React, TypeScript
- **Build Tool**: Vite
- **Core Dependencies**:
  - `react-image-crop` for image manipulation.
  - `html-to-image` for exporting the canvas content.


## Getting Started (Local Development)

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (comes with Node.js)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd Texttohandwriting
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```



### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Open your browser:**
    Navigate to `http://localhost:5173` to see the application running.