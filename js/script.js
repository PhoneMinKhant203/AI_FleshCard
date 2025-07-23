// Set up PDF.js worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Get DOM elements
const apiKeySetup = document.getElementById('apiKeySetup');
const mainAppContent = document.getElementById('mainAppContent');
const apiKeyInput = document.getElementById('apiKeyInput');
const submitApiKeyBtn = document.getElementById('submitApiKeyBtn');
const apiKeyMessage = document.getElementById('apiKeyMessage');

const pdfUpload = document.getElementById('pdfUpload');
const textInput = document.getElementById('textInput');
const difficultySelect = document.getElementById('difficulty');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const messageArea = document.getElementById('messageArea');
const flashcardsContainer = document.getElementById('flashcardsContainer');

// Modal elements
const customModal = document.getElementById('customModal');
const modalMessage = document.getElementById('modalMessage');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const closeButton = document.querySelector('.close-button');

// Event Listeners for Modal
closeButton.onclick = () => customModal.classList.add('hidden');
modalCloseBtn.onclick = () => customModal.classList.add('hidden');
window.onclick = (event) => {
    if (event.target == customModal) {
        customModal.classList.add('hidden');
    }
};

/**
 * Displays a custom modal message.
 * @param {string} message - The message to display.
 */
function showModal(message) {
    modalMessage.textContent = message;
    customModal.classList.remove('hidden');
}

/**
 * Extracts text from a PDF file using PDF.js.
 * @param {File} file - The PDF file to extract text from.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 */
async function extractTextFromPdf(file) {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
        fileReader.onload = async () => {
            try {
                const typedarray = new Uint8Array(fileReader.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                resolve(fullText);
            } catch (error) {
                console.error('Error extracting text from PDF:', error);
                reject('Failed to extract text from PDF. Please try a different file or paste text directly.');
            }
        };
        fileReader.onerror = () => reject('Error reading file.');
        fileReader.readAsArrayBuffer(file);
    });
}

/**
 * Chunks the input text into smaller segments.
 * Aims to split by paragraphs (double newlines) and ensures chunks are not excessively long.
 * @param {string} text - The full input text.
 * @param {number} maxChunkSize - Maximum approximate character count per chunk.
 * @returns {string[]} An array of text chunks.
 */
function chunkText(text, maxChunkSize = 2000) {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        if ((currentChunk + para).length <= maxChunkSize) {
            currentChunk += (currentChunk ? '\n\n' : '') + para;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = para;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Calls the Gemini API to generate flashcards for a given text chunk and difficulty.
 * @param {string} chunk - The text chunk to generate flashcards from.
 * @param {string} difficulty - The selected difficulty level ('easy', 'normal', 'hard').
 * @returns {Promise<Array<{question: string, answer: string}>>} A promise resolving to an array of flashcards.
 */
async function generateFlashcardsWithGemini(chunk, difficulty) {
    console.log('--- generateFlashcardsWithGemini called ---');
    const userApiKey = sessionStorage.getItem('geminiApiKey');
    if (!userApiKey) {
        console.error('API Key not found in session storage.');
        showModal('API Key not found. Please re-enter your API key.');
        return [];
    }
    console.log('API Key retrieved from session storage.');

    const jsonExample = `[{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]`;
    let prompt = `Generate 3-5 question-and-answer flashcards based on the following text. Return only a JSON array in this format: ${jsonExample}. Do not include any additional text, explanations, or comments outside the JSON array.\n\nText: ${chunk}`;

    switch (difficulty) {
        case 'easy':
            prompt = `Generate 3-5 simple question-and-answer flashcards based on the following text. Return only a JSON array in this format: ${jsonExample}. Do not include any additional text, explanations, or comments outside the JSON array.\n\nText: ${chunk}`;
            break;
        case 'normal':
            prompt = `Generate 3-5 question-and-answer flashcards requiring a slightly deeper understanding based on the following text. Return only a JSON array in this format: ${jsonExample}. Do not include any additional text, explanations, or comments outside the JSON array.\n\nText: ${chunk}`;
            break;
        case 'hard':
            prompt = `Generate 3-5 challenging question-and-answer flashcards encouraging critical thinking or synthesis based on the following text. Return only a JSON array in this format: ${jsonExample}. Do not include any additional text, explanations, or comments outside the JSON array.\n\nText: ${chunk}`;
            break;
    }

    console.log('Prompt being sent to Gemini:', prompt);
    console.log('Chunk length:', chunk.length);

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        question: { type: "STRING" },
                        answer: { type: "STRING" }
                    },
                    required: ["question", "answer"]
                }
            }
        }
    };

    const apiKey = userApiKey;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        console.log('Attempting fetch to Gemini API...');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Fetch response received. Status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response not OK:', errorText);
            if (response.status === 400 || response.status === 401 || response.status === 403) {
                showModal(`API Error (${response.status}): Please check your Gemini API key and ensure it's valid and has access to the model. Details: ${errorText.substring(0, 200)}...`);
            } else if (response.status === 429) {
                showModal(`Rate Limit Exceeded (${response.status}): You've sent too many requests. Please wait a moment and try again.`);
            } else {
                showModal(`Server Error (${response.status}): An unexpected error occurred. Details: ${errorText.substring(0, 200)}...`);
            }
            return [];
        }

        const result = await response.json();
        console.log('Raw Gemini API Result:', result);

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            let jsonString = result.candidates[0].content.parts[0].text;
            console.log('Gemini returned JSON string:', jsonString);

            jsonString = jsonString.trim();
            jsonString = jsonString.replace(/^[^[]+/, '').replace(/[^}\]]+$/, '');
            jsonString = jsonString.replace(/"{2,}/g, '"').replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');

            try {
                const parsedFlashcards = JSON.parse(jsonString);
                if (Array.isArray(parsedFlashcards) && parsedFlashcards.every(fc => 
                    typeof fc === 'object' && fc !== null && 
                    typeof fc.question === 'string' && typeof fc.answer === 'string' &&
                    fc.question.trim() && fc.answer.trim()
                )) {
                    console.log('Successfully parsed flashcards:', parsedFlashcards);
                    return parsedFlashcards;
                } else {
                    console.warn('Gemini returned invalid or incomplete JSON structure:', parsedFlashcards);
                    showModal('The API returned an invalid flashcard format. Attempting fallback parsing.');
                    return parseTextFlashcards(jsonString);
                }
            } catch (parseError) {
                console.error('Failed to parse Gemini JSON response (parseError):', jsonString, parseError);
                showModal('Failed to parse API response as JSON. Attempting fallback parsing.');
                return parseTextFlashcards(jsonString);
            }
        } else {
            console.warn('Gemini response structure unexpected or no content in candidates:', result);
            if (result.promptFeedback && result.promptFeedback.blockReason) {
                showModal(`Content Blocked: The prompt or response was blocked due to safety reasons. Reason: ${result.promptFeedback.blockReason}. Please try different text.`);
            } else {
                showModal('Gemini did not return any content. This might be due to a very short or unsuitable text chunk, or an internal model issue.');
            }
            return [];
        }
    } catch (error) {
        console.error('Error during fetch or processing Gemini response:', error);
        showModal(`An error occurred during API call: ${error.message}. Check console for details.`);
        return [];
    }
}

/**
 * Fallback function to parse flashcards if JSON parsing fails.
 * Attempts to extract question-answer pairs from raw text.
 * @param {string} text - The raw text from Gemini.
 * @returns {Array<{question: string, answer: string}>} An array of parsed flashcards.
 */
function parseTextFlashcards(text) {
    console.log('Attempting to parse flashcards from raw text (JSON parsing failed).');
    const flashcards = [];
    let cleanedText = text.trim();

    const jsonMatch = cleanedText.match(/\[.*?\]/s);
    if (!jsonMatch) {
        console.warn('No valid JSON array found in text:', cleanedText);
        return flashcards;
    }

    cleanedText = jsonMatch[0];
    try {
        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed) && parsed.every(fc => 
            typeof fc === 'object' && fc !== null && 
            typeof fc.question === 'string' && typeof fc.answer === 'string' &&
            fc.question.trim() && fc.answer.trim()
        )) {
            console.log('Successfully parsed flashcards from cleaned text:', parsed);
            return parsed;
        }
    } catch (e) {
        console.warn('Cleaned text still not valid JSON:', cleanedText);
    }

    const objects = cleanedText.split('},').map(obj => obj.trim());
    for (let obj of objects) {
        if (!obj.endsWith('}')) obj += '}';
        if (!obj.startsWith('{')) obj = '{' + obj;

        try {
            const parsedObj = JSON.parse(obj);
            if (typeof parsedObj.question === 'string' && typeof parsedObj.answer === 'string' &&
                parsedObj.question.trim() && parsedObj.answer.trim()) {
                flashcards.push({
                    question: parsedObj.question.trim(),
                    answer: parsedObj.answer.trim()
                });
            }
        } catch (e) {
            const questionMatch = obj.match(/"question"\s*:\s*"([^"]+?)"/);
            const answerMatch = obj.match(/"answer"\s*:\s*"([^"]+?)"/);
            if (questionMatch && answerMatch) {
                flashcards.push({
                    question: questionMatch[1].trim(),
                    answer: answerMatch[1].trim()
                });
            }
        }
    }

    console.log('Flashcards parsed from text:', flashcards);
    return flashcards;
}

/**
 * Renders the generated flashcards to the UI.
 * @param {Array<{question: string, answer: string}>} flashcards - The array of flashcards to render.
 */
function renderFlashcards(flashcards) {
    flashcardsContainer.innerHTML = '';
    if (flashcards.length === 0) {
        messageArea.textContent = 'No flashcards generated. Please try adjusting your input or difficulty.';
        return;
    }
    messageArea.textContent = '';

    flashcards.forEach((card, index) => {
        const flashcardDiv = document.createElement('div');
        flashcardDiv.classList.add('flashcard', 'relative', 'h-48', 'flex', 'items-center', 'justify-center', 'text-center');

        flashcardDiv.innerHTML = `
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <h3 class="text-lg font-semibold">Q: ${card.question}</h3>
                </div>
                <div class="flashcard-back">
                    <p class="text-base">${card.answer}</p>
                </div>
            </div>
        `;

        flashcardDiv.addEventListener('click', () => {
            flashcardDiv.classList.toggle('flipped');
        });
        flashcardsContainer.appendChild(flashcardDiv);
    });
}

/**
 * Validates the API key (basic check for non-empty).
 * @param {string} key - The API key to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateApiKey(key) {
    return key.trim().length > 0;
}

// Event listener for API Key submission
submitApiKeyBtn.addEventListener('click', () => {
    const userApiKey = apiKeyInput.value.trim();
    if (validateApiKey(userApiKey)) {
        sessionStorage.setItem('geminiApiKey', userApiKey);
        apiKeySetup.classList.add('hidden');
        mainAppContent.classList.remove('hidden');
        apiKeyMessage.textContent = '';
    } else {
        apiKeyMessage.textContent = 'Please enter a valid Gemini API Key.';
    }
});

// Check for API key on page load
document.addEventListener('DOMContentLoaded', () => {
    const storedApiKey = sessionStorage.getItem('geminiApiKey');
    if (storedApiKey && validateApiKey(storedApiKey)) {
        apiKeySetup.classList.add('hidden');
        mainAppContent.classList.remove('hidden');
    } else {
        apiKeySetup.classList.remove('hidden');
        mainAppContent.classList.add('hidden');
    }
});

// Main generation logic
generateBtn.addEventListener('click', async () => {
    messageArea.textContent = '';
    flashcardsContainer.innerHTML = '';
    loadingIndicator.classList.remove('hidden');
    generateBtn.disabled = true;

    let inputText = textInput.value.trim();
    const pdfFile = pdfUpload.files[0];
    const difficulty = difficultySelect.value;

    if (!inputText && !pdfFile) {
        showModal('Please upload a PDF file or paste text to generate flashcards.');
        loadingIndicator.classList.add('hidden');
        generateBtn.disabled = false;
        return;
    }

    try {
        if (pdfFile) {
            messageArea.textContent = 'Extracting text from PDF... This may take a moment.';
            inputText = await extractTextFromPdf(pdfFile);
            if (!inputText) {
                showModal('Could not extract text from the PDF. It might be an image-only PDF or corrupted. Please try pasting text instead.');
                loadingIndicator.classList.add('hidden');
                generateBtn.disabled = false;
                return;
            }
        }

        if (inputText.length < 50) {
            showModal('Please provide more text (at least 50 characters) to generate meaningful flashcards.');
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false;
            return;
        }

        messageArea.textContent = 'Chunking text and generating flashcards... This might take a few minutes for large documents.';
        const textChunks = chunkText(inputText);
        let allFlashcards = [];

        for (const chunk of textChunks) {
            const chunkFlashcards = await generateFlashcardsWithGemini(chunk, difficulty);
            allFlashcards = allFlashcards.concat(chunkFlashcards);
        }

        const uniqueFlashcards = [];
        const seen = new Set();
        allFlashcards.forEach(card => {
            const key = `${card.question.toLowerCase()}|||${card.answer.toLowerCase()}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueFlashcards.push(card);
            }
        });

        renderFlashcards(uniqueFlashcards);
        if (uniqueFlashcards.length === 0) {
            showModal('No flashcards could be generated from the provided text. Please ensure the text is clear and contains information suitable for Q&A.');
        } else {
            messageArea.textContent = `Generated ${uniqueFlashcards.length} flashcards. Click on a card to reveal the answer!`;
        }

    } catch (error) {
        console.error('Overall error during flashcard generation:', error);
        showModal(`An error occurred: ${error.message || error}. Please check the console for more details.`);
        messageArea.textContent = `Error: ${error.message || error}`;
    } finally {
        loadingIndicator.classList.add('hidden');
        generateBtn.disabled = false;
    }
});