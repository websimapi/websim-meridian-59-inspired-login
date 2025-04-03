import * as websim from 'websim';

const imageContainer = document.getElementById('image-container');
const loginButton = document.getElementById('login-button');
const originalImageUrl = '/a/18474e7e-55ef-4c97-90f7-2b9ee0bbbfab';

let generatedImages = [];
let currentImageIndex = 0;
const maxImages = 5;
const intervalTime = 7000; // 7 seconds
let imageCycleInterval = null;
let isGenerating = false;

// Description based on the provided reference image
const imageDescription = "A Meridian 59 inspired alchemist's workshop with a large grey owl perched on a stand. The room features wooden shelves with colorful potion bottles, scrolls, and magical items. There's a wooden table with a large purple glowing potion in a flask. Through an open window, a castle can be seen on a green hill in the distance. The room has medieval fantasy game aesthetics with warm lighting.";

async function initialize() {
    // Set initial background to the original image while generating new ones
    imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
    imageContainer.textContent = 'Starting generation...';
    
    try {
        // Generate first image immediately
        await generateAndDisplayImage();
        
        // Set up interval for remaining images
        const generateInterval = setInterval(async () => {
            if (generatedImages.length >= maxImages) {
                clearInterval(generateInterval);
                startImageCycle();
                return;
            }
            await generateAndDisplayImage();
        }, intervalTime);
        
    } catch (error) {
        console.error("Error during initialization:", error);
        imageContainer.textContent = '';
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
    }
}

async function generateAndDisplayImage() {
    if (isGenerating || generatedImages.length >= maxImages) return;
    
    isGenerating = true;
    const imageNum = generatedImages.length + 1;
    const statusText = document.createElement('div');
    statusText.style.backgroundColor = 'rgba(0,0,0,0.7)';
    statusText.style.padding = '10px';
    statusText.style.borderRadius = '5px';
    statusText.textContent = `Generating image ${imageNum}/${maxImages}...`;
    
    // Clear container and add status text
    imageContainer.textContent = '';
    imageContainer.appendChild(statusText);
    
    try {
        const seed = Math.floor(Math.random() * 10000);
        console.log(`Generating image ${imageNum} with seed ${seed}...`);
        
        const result = await websim.imageGen({
            prompt: `${imageDescription} Style of a classic fantasy RPG game from the 90s. Variation ${imageNum}. Seed: ${seed}`,
            width: 640,
            height: 480,
        });
        
        console.log("Image generation result:", result);
        
        if (result && result.url) {
            generatedImages.push(result.url);
            imageContainer.style.backgroundImage = `url(${result.url})`;
            imageContainer.textContent = '';
            console.log(`Generated image ${imageNum} successfully:`, result.url);
        } else {
            throw new Error(`Failed to generate image ${imageNum}: No URL returned`);
        }
    } catch (error) {
        console.error(`Error generating image ${imageNum}:`, error);
        // If first image fails, make sure original is showing
        if (generatedImages.length === 0) {
            imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
        }
    } finally {
        isGenerating = false;
        // Remove status text
        imageContainer.textContent = '';
    }
}

function startImageCycle() {
    if (generatedImages.length === 0) {
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
        return;
    }
    
    console.log("Starting image cycle with", generatedImages.length, "images");
    
    // Display first image immediately
    currentImageIndex = 0;
    imageContainer.style.backgroundImage = `url(${generatedImages[currentImageIndex]})`;
    
    imageCycleInterval = setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % generatedImages.length;
        console.log(`Cycling to image ${currentImageIndex + 1}`);
        imageContainer.style.backgroundImage = `url(${generatedImages[currentImageIndex]})`;
    }, intervalTime);
}

// Add loading event listener
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");
    // Start the process
    initialize();
});