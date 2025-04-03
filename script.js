import * as websim from 'websim';

const imageContainer = document.getElementById('image-container');
const loginButton = document.getElementById('login-button'); // Although not used yet, it's good practice to grab it.
const originalImageUrl = '/a/18474e7e-55ef-4c97-90f7-2b9ee0bbbfab'; // The provided asset URL

let generatedImages = [];
let currentImageIndex = 0;
const maxImages = 5;
const intervalTime = 7000; // 7 seconds
let imageGenerationInterval;
let imageCycleInterval;
let initialDescription = '';

async function analyzeAndGenerateInitialImage() {
    imageContainer.textContent = 'Analyzing image...'; // Placeholder text

    try {
        const completion = await websim.chat.completions.create({
            messages: [
                 {
                    role: "user",
                    content: [
                        {
                          type: "text",
                          text: `Describe the key elements and atmosphere of this image in detail, focusing on aspects suitable for generating similar fantasy-themed images. Respond with only the description, no extra text.`,
                        },
                        {
                          type: "image_url",
                          image_url: { url: originalImageUrl },
                        },
                     ],
                 },
            ],
        });

        initialDescription = completion.content;
        console.log("Initial Description:", initialDescription);
        imageContainer.textContent = 'Generating image...'; // Update status

        await generateAndDisplayImage(); // Generate the first image immediately

        // Start the interval to generate the next images
        imageGenerationInterval = setInterval(generateAndDisplayImage, intervalTime);

    } catch (error) {
        console.error("Error during initial analysis or generation:", error);
        imageContainer.textContent = 'Error generating image. Please try again.';
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`; // Fallback to original
    }
}

async function generateAndDisplayImage() {
    if (generatedImages.length >= maxImages) {
        clearInterval(imageGenerationInterval); // Stop generating new images
        console.log("Maximum images generated. Starting cycle.");
        startImageCycle();
        return; // Exit function
    }

    imageContainer.textContent = `Generating image ${generatedImages.length + 1}/${maxImages}...`;

    try {
        // Add variation to the prompt for each generation
        const prompt = `${initialDescription}. Fantasy art style, detailed, atmosphere. Variation ${generatedImages.length + 1}.`;
        console.log("Generating image with prompt:", prompt);

        const result = await websim.imageGen({
            prompt: prompt,
            width: 640,
            height: 480,
        });

        const newImageUrl = result.url;
        console.log("Generated image URL:", newImageUrl);

        generatedImages.push(newImageUrl);
        imageContainer.style.backgroundImage = `url(${newImageUrl})`;
        imageContainer.textContent = ''; // Clear loading text
        currentImageIndex = generatedImages.length - 1; // Point to the newly added image


    } catch (error) {
        console.error("Error generating image:", error);
        imageContainer.textContent = 'Error generating image.';
        // Optionally stop trying after an error, or just log and continue
        // clearInterval(imageGenerationInterval); // Uncomment to stop on error
    }
}


function startImageCycle() {
    // Ensure we have images to cycle through
    if (generatedImages.length === 0) {
        console.error("No generated images to cycle.");
        imageContainer.textContent = 'Failed to load images for cycling.';
         imageContainer.style.backgroundImage = `url(${originalImageUrl})`; // Fallback
        return;
    }

    // Clear any existing generation interval if it somehow wasn't cleared
    clearInterval(imageGenerationInterval);

     // Display the first generated image immediately before starting the cycle interval
    currentImageIndex = 0;
    imageContainer.style.backgroundImage = `url(${generatedImages[currentImageIndex]})`;
    imageContainer.textContent = ''; // Clear any status text


    // Start cycling through the generated images
    imageCycleInterval = setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % generatedImages.length;
        imageContainer.style.backgroundImage = `url(${generatedImages[currentImageIndex]})`;
    }, intervalTime);
}


// Start the process
analyzeAndGenerateInitialImage();
`````` index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meridian 59 Inspired Login</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="container">
        <div id="image-container">
            <!-- Image will be loaded here -->
            Loading...
        </div>
        <button id="login-button">Click here to log on!</button>
    </div>

    <script type="importmap">
    {
      "imports": {
        "websim": "/websim.js"
      }
    }
    </script>
    <script type="module" src="script.js"></script>
</body>
</html>

import * as websim from 'websim';

const imageContainer = document.getElementById('image-container');
const loginButton = document.getElementById('login-button'); // Although not used yet, it's good practice to grab it.
const originalImageUrl = '/a/18474e7e-55ef-4c97-90f7-2b9ee0bbbfab'; // The provided asset URL

let generatedImages = [];
let currentImageIndex = 0;
const maxImages = 5;
const intervalTime = 7000; // 7 seconds
let imageGenerationInterval = null;
let imageCycleInterval = null;
let initialDescription = '';
let isGenerating = false; // Flag to prevent concurrent generation

async function analyzeAndGenerateInitialImage() {
    imageContainer.textContent = 'Analyzing reference image...';

    try {
        console.log("Analyzing image:", originalImageUrl);
        const completion = await websim.chat.completions.create({
             messages: [
                 {
                    role: "user",
                    content: [
                        {
                          type: "text",
                          text: `Describe this image in detail for an AI image generator. Focus on the key visual elements, the fantasy setting, the atmosphere, and the art style (early 3D render look). Output only the description. Example: "An owl perched in a cluttered alchemist's workshop with potions, scrolls, and a view of a distant castle."`,
                        },
                        {
                          type: "image_url",
                          image_url: { url: originalImageUrl },
                        },
                     ],
                 },
            ],
        });

        initialDescription = completion.content.trim();
        if (!initialDescription) {
            throw new Error("Received empty description from analysis.");
        }
        console.log("Initial Description:", initialDescription);

        // Generate the first image immediately
        await generateAndDisplayImage();

        // If the first generation was successful and we need more images, start the interval
        if (generatedImages.length < maxImages && generatedImages.length > 0) {
             // Clear any potentially lingering intervals
             if (imageGenerationInterval) clearInterval(imageGenerationInterval);
             if (imageCycleInterval) clearInterval(imageCycleInterval);

            imageGenerationInterval = setInterval(generateAndDisplayImage, intervalTime);
            console.log(`Started generation interval (ID: ${imageGenerationInterval})`);
        } else if (generatedImages.length === maxImages) {
            // If somehow maxImages is 1, start cycling immediately
            startImageCycle();
        }

    } catch (error) {
        console.error("Error during initial analysis or first generation:", error);
        imageContainer.textContent = `Error: ${error.message}. Displaying original image.`;
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
         // Stop any further attempts if analysis failed
        if (imageGenerationInterval) clearInterval(imageGenerationInterval);
        if (imageCycleInterval) clearInterval(imageCycleInterval);
    }
}

async function generateAndDisplayImage() {
    // Prevent concurrent generation requests
    if (isGenerating) {
        console.log("Generation already in progress, skipping interval trigger.");
        return;
    }

    // Check if we've reached the max count *before* attempting generation
     if (generatedImages.length >= maxImages) {
        console.log("Max images reached. Clearing generation interval and starting cycle.");
        if (imageGenerationInterval) {
             clearInterval(imageGenerationInterval);
             imageGenerationInterval = null;
             console.log("Cleared generation interval.");
        }
        startImageCycle();
        return; // Stop generation attempts
    }

    isGenerating = true;
    imageContainer.textContent = `Generating image ${generatedImages.length + 1}/${maxImages}...`;
    console.log(`Attempting to generate image ${generatedImages.length + 1}`);

    try {
        // Add variation to the prompt for each generation
        const prompt = `${initialDescription}. Variation seed ${Date.now()}.`; // Using timestamp for simple variation
        console.log("Generating image with prompt:", prompt);

        const result = await websim.imageGen({
            prompt: prompt,
            width: 640,
            height: 480,
            // seed: generatedImages.length // Using index as seed might work too
        });

        const newImageUrl = result.url;
        console.log(`Generated image ${generatedImages.length + 1} URL:`, newImageUrl);

        // Preload the image before adding it to the array and changing background
        await preloadImage(newImageUrl);

        generatedImages.push(newImageUrl);
        imageContainer.style.backgroundImage = `url(${newImageUrl})`;
        imageContainer.textContent = ''; // Clear loading text
        currentImageIndex = generatedImages.length - 1; // Point to the newly added image

        // Check *after* successful generation if we've reached the limit
        if (generatedImages.length >= maxImages) {
             console.log("Max images reached after generation. Clearing interval and starting cycle.");
            if (imageGenerationInterval) {
                clearInterval(imageGenerationInterval);
                imageGenerationInterval = null;
                 console.log("Cleared generation interval.");
            }
            startImageCycle();
        }

    } catch (error) {
        console.error(`Error generating image ${generatedImages.length + 1}:`, error);
        imageContainer.textContent = `Error generating image ${generatedImages.length + 1}. Trying again later...`;
        // Don't stop the interval on error, allow it to try again next time.
        // However, if too many errors occur, we might want to stop. (Not implemented here)
    } finally {
         isGenerating = false; // Allow next generation attempt
    }
}

function startImageCycle() {
    // Ensure this only runs once and generation has stopped
    if (imageCycleInterval || imageGenerationInterval) {
         if(imageGenerationInterval) {
             clearInterval(imageGenerationInterval);
             imageGenerationInterval = null;
             console.log("Cleared generation interval before starting cycle.");
         }
         // If cycle interval already exists, don't start another one
         if(imageCycleInterval) {
            console.log("Cycle interval already running.");
            return;
         }
    }

    // Ensure we have images to cycle through
    if (generatedImages.length === 0) {
        console.error("No generated images to cycle.");
        imageContainer.textContent = 'Failed to load images for cycling.';
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`; // Fallback
        return;
    }

    console.log("Starting image cycling.");

     // Display the first generated image immediately before starting the cycle interval
    currentImageIndex = 0;
    imageContainer.style.backgroundImage = `url(${generatedImages[currentImageIndex]})`;
    imageContainer.textContent = ''; // Clear any status text

    // Start cycling through the generated images
    imageCycleInterval = setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % generatedImages.length;
        // console.log(`Cycling to image index: ${currentImageIndex}`); // Optional: log cycling
        imageContainer.style.backgroundImage = `url(${generatedImages[currentImageIndex]})`;
    }, intervalTime);
     console.log(`Started cycle interval (ID: ${imageCycleInterval})`);
}

// Helper function to preload images
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log("Preloaded:", url);
            resolve();
        };
        img.onerror = (e) => {
            console.error("Failed to preload:", url, e);
            reject(new Error(`Failed to load image ${url}`));
        };
        img.src = url;
    });
}


// --- Initialization ---
// Add a small delay before starting to ensure websim is ready (optional, but can help)
// setTimeout(analyzeAndGenerateInitialImage, 100);
analyzeAndGenerateInitialImage(); // Start the process immediately


