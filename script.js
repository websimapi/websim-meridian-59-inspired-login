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
const imageDescription = `An alchemist's or wizard's workshop from a classic fantasy game. Features a large grey owl with bright orange eyes perched on a stand, wooden shelves filled with colorful potions and scrolls, a wooden table with a large glass flask containing a glowing purple potion, and an open window revealing a distant castle on a green hill. The style is reminiscent of early 3D fantasy games with atmospheric lighting.`;

async function initialize() {
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
        imageContainer.textContent = 'Error generating images. Displaying original.';
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
    }
}

async function generateAndDisplayImage() {
    if (isGenerating || generatedImages.length >= maxImages) return;
    
    isGenerating = true;
    const imageNum = generatedImages.length + 1;
    imageContainer.textContent = `Generating image ${imageNum}/${maxImages}...`;
    
    try {
        const seed = Math.floor(Math.random() * 10000);
        const result = await websim.imageGen({
            prompt: `${imageDescription} Variation ${imageNum}. Seed: ${seed}`,
            width: 640,
            height: 480,
        });
        
        if (result && result.url) {
            generatedImages.push(result.url);
            imageContainer.style.backgroundImage = `url(${result.url})`;
            imageContainer.textContent = '';
            console.log(`Generated image ${imageNum}`);
        } else {
            throw new Error("Failed to generate image");
        }
    } catch (error) {
        console.error(`Error generating image ${imageNum}:`, error);
        // If first image fails, show original
        if (generatedImages.length === 0) {
            imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
            imageContainer.textContent = '';
        }
    } finally {
        isGenerating = false;
    }
}

function startImageCycle() {
    if (generatedImages.length === 0) {
        imageContainer.style.backgroundImage = `url(${originalImageUrl})`;
        return;
    }
    
    console.log("Starting image cycle with", generatedImages.length, "images");
    
    imageCycleInterval = setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % generatedImages.length;
        imageContainer.style.backgroundImage = `url(${generatedImages[currentImageIndex]})`;
    }, intervalTime);
}

// Start the process
initialize();