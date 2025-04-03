import * as websim from 'websim';

const imageContainer = document.getElementById('image-container');
const loginButton = document.getElementById('login-button');
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
    console.log("Starting analysis...");

    try {
        console.log("Analyzing image URL:", originalImageUrl);
        const completion = await websim.chat.completions.create({
             messages: [
                 {
                    role: "user",
                    content: [
                        {
                          type: "text",
                          // Refined prompt based on the specific image:
                          text: `Describe this image precisely for an AI image generator. It depicts an alchemist's or wizard's workshop from an early 3D game (like Meridian 59). Key elements: A prominent, large grey owl with bright orange eyes perched on metallic apparatus on the right. Wooden shelves filled with colorful potions, skulls, and scrolls in the background. A heavy wooden table in the foreground holds a large glass flask containing a bubbling, glowing purple potion. An open archway or window reveals a view of a distant, dark fantasy castle on a green hill under a daytime sky. The overall style is a low-poly, textured early 3D render with somewhat dim, atmospheric lighting. Focus on capturing this specific scene, style, and moody atmosphere. Output only the description, no conversational text.`,
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
        if (!initialDescription || initialDescription.length < 20) { // Basic check for a meaningful description
            throw new Error("Received an inadequate description from analysis.");
        }
        console.log("Initial Description Received:", initialDescription);

        // Generate the first image immediately
        await generateAndDisplayImage();

        // If the first generation was successful and we need more images, start the interval
        if (generatedImages.length < maxImages && generatedImages.length > 0) {
             // Clear any potentially lingering intervals
             if (imageGenerationInterval) clearInterval(imageGenerationInterval);
             if (imageCycleInterval) clearInterval(imageCycleInterval);

            imageGenerationInterval = setInterval(generateAndDisplayImage, intervalTime);
            console.log(`Started generation interval (ID: ${imageGenerationInterval}) to generate remaining images.`);
        } else if (generatedImages.length === maxImages) {
             // If maxImages is 1, start cycling immediately
            console.log("Max images (1) reached, starting cycle immediately.");
            startImageCycle();
        } else if (generatedImages.length === 0) {
            // This case means the first generation failed within generateAndDisplayImage
            console.error("First image generation failed. Displaying original image.");
            imageContainer.textContent = 'Error generating initial image. Displaying fallback.';
            imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
        }

    } catch (error) {
        console.error("Error during initial analysis or first generation attempt:", error);
        // Display fallback content
        imageContainer.textContent = `Analysis/Generation Error: ${error.message}. Displaying original image.`;
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
         // Stop any further attempts if analysis/initial gen failed
        if (imageGenerationInterval) clearInterval(imageGenerationInterval);
        if (imageCycleInterval) clearInterval(imageCycleInterval);
        imageGenerationInterval = null;
        imageCycleInterval = null;
    }
}

async function generateAndDisplayImage() {
    // Prevent concurrent generation requests
    if (isGenerating) {
        console.log("Generation already in progress, skipping.");
        return;
    }

    // Check if we've reached the max count *before* attempting generation
     if (generatedImages.length >= maxImages) {
        console.log(`Max images (${maxImages}) reached. Generation complete.`);
        if (imageGenerationInterval) {
             clearInterval(imageGenerationInterval);
             imageGenerationInterval = null;
             console.log("Cleared generation interval.");
        }
        // Only start cycling if it's not already running
        if (!imageCycleInterval) {
            startImageCycle();
        }
        return; // Stop generation attempts
    }

    isGenerating = true;
    const imageNum = generatedImages.length + 1;
    imageContainer.textContent = `Generating image ${imageNum}/${maxImages}...`;
    console.log(`Attempting to generate image ${imageNum}`);

    try {
        // Use a different seed for each generation for variation
        const prompt = `${initialDescription} Seed: ${Date.now()}`;
        console.log("Generating image with prompt:", prompt);

        const result = await websim.imageGen({
            prompt: prompt,
            width: 640,
            height: 480,
        });

        if (!result || !result.url) {
            throw new Error("Image generation result is invalid or missing URL.");
        }

        const newImageUrl = result.url;
        console.log(`Generated image ${imageNum} URL:`, newImageUrl);

        // Preload the image before adding it to the array and changing background
        await preloadImage(newImageUrl);

        generatedImages.push(newImageUrl);
        imageContainer.style.backgroundImage = `url(${newImageUrl})`;
        imageContainer.textContent = ''; // Clear loading text
        currentImageIndex = generatedImages.length - 1; // Point to the newly added image
        console.log(`Successfully generated and displayed image ${imageNum}. Total: ${generatedImages.length}`);


        // Check *after* successful generation if we've reached the limit
        if (generatedImages.length >= maxImages) {
             console.log(`Max images (${maxImages}) reached after generation. Clearing interval and starting cycle.`);
            if (imageGenerationInterval) {
                clearInterval(imageGenerationInterval);
                imageGenerationInterval = null;
                 console.log("Cleared generation interval.");
            }
            // Only start cycling if it's not already running
             if (!imageCycleInterval) {
                startImageCycle();
            }
        }

    } catch (error) {
        console.error(`Error generating image ${imageNum}:`, error);
        imageContainer.textContent = `Error generating image ${imageNum}. Will retry or cycle if max reached.`;
        // Don't stop the interval on error, allow it to try again next time unless max images are reached somehow
         if (generatedImages.length >= maxImages) {
             if (imageGenerationInterval) {
                clearInterval(imageGenerationInterval);
                imageGenerationInterval = null;
             }
             if (!imageCycleInterval) startImageCycle(); // Start cycling even if last attempt failed but we have enough images
         }
    } finally {
         isGenerating = false; // Allow next generation attempt
         console.log("Generation flag set to false.");
    }
}

function startImageCycle() {
    console.log("Attempting to start image cycle...");
    // Ensure generation has fully stopped
    if (imageGenerationInterval) {
         clearInterval(imageGenerationInterval);
         imageGenerationInterval = null;
         console.log("Cleared lingering generation interval before starting cycle.");
    }
     // Prevent multiple cycle intervals
     if (imageCycleInterval) {
        console.log("Cycle interval already running. Exiting startImageCycle.");
        return;
     }

    // Ensure we have images to cycle through
    if (generatedImages.length === 0) {
        console.error("No generated images available to start cycling.");
        imageContainer.textContent = 'Failed to load any images for cycling. Displaying fallback.';
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`; // Fallback
        return;
    }

    console.log(`Starting image cycling with ${generatedImages.length} images.`);

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
            console.log("Successfully preloaded:", url);
            resolve();
        };
        img.onerror = (e) => {
            // Don't necessarily reject the whole process, but log the error
            console.error("Failed to preload:", url, e);
            // Resolve anyway, maybe the browser can still load it later? Or reject if critical.
            // For this case, let's resolve but log it clearly. The background might just fail to update later.
            resolve();
            // reject(new Error(`Failed to load image ${url}`)); // Stricter alternative
        };
        img.src = url;
    });
}


// --- Initialization ---
// Start the process
analyzeAndGenerateInitialImage();