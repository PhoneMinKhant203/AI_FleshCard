# AI Flashcard Generator

An AI-powered flashcard generation tool that helps you create study flashcards from your PDF documents or plain text. Leveraging the Google Gemini API, it generates flashcards at various difficulty levels, making your study process more efficient and personalized.

## ✨ Features

* **Document Input:** Upload PDF files or paste raw text directly.
* **AI-Powered Flashcard Generation:** Utilizes the Google Gemini API to intelligently create question-and-answer flashcards.
* **Adjustable Difficulty Levels:**
  * **Easy:** Direct questions and answers extracted explicitly from the input text.
  * **Normal:** Questions requiring basic inference or understanding.
  * **Hard:** Questions encouraging critical thinking and synthesis. *(Future enhancement: RAG for “beyond the document” questions.)*
* **Interactive Flashcards:** Click to flip cards and reveal answers.
* **User-Provided API Key:** Securely allows users to input their own Gemini API key.
* **Clean User Interface:** Simple and intuitive design for ease of use.

## ⚙️ How It Works

The application operates in two main phases:

1. **API Key Setup:**  
   On first load, the user inputs their Google Gemini API key. This is stored securely in `sessionStorage` for the session.

2. **Flashcard Generation:**
   * Upload PDF or paste text.
   * Text is extracted (via PDF.js) and chunked.
   * Each chunk and selected difficulty is sent to the Gemini API.
   * Gemini returns question-answer pairs in JSON format.
   * Flashcards are displayed interactively for review.

## 🚀 Getting Started

Follow these steps to get the AI Flashcard Generator up and running on your local machine.

### ✅ Prerequisites

* A web browser (Chrome, Firefox, Edge, Safari, etc.)
* Node.js (recommended) **OR** Python 3
* A Google Account to obtain a Gemini API Key

### 📁 Local Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/PhoneMinKhant203/AI_FleshCard.git
   ```

2. **Project Structure:**

   ```
   .
   ├── index.html
   ├── css/
   │   └── style.css
   └── js/
       └── script.js
   ```

### 🔑 Obtaining a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/).
2. Sign in with your Google account.
3. Click "Create API Key in new project" or "Get API Key".
4. Copy the generated API key.

> ⚠️ Keep your API key secure. Do not share it or commit it to public code repositories.


## 🧠 Usage

1. **Enter API Key:**
   * Paste your Gemini API Key on the initial screen.
   * Click "Submit API Key".

2. **Upload Document or Paste Text:**
   * Upload a PDF file **OR** paste plain text.
   * If both are provided, PDF takes priority.

3. **Select Difficulty:**
   * Choose between: Easy, Normal, or Hard.

4. **Generate Flashcards:**
   * Click the "Generate Flashcards" button.

5. **Review Flashcards:**
   * Click on any card to flip and reveal the answer.

## 🧬 Technical Workflow

* **PDF Text Extraction:** Handled via PDF.js.
* **Text Chunking:** Based on size limits and paragraph breaks.
* **Prompting Gemini:** Sends each chunk with a structured prompt to `gemini-2.0-flash`, requesting 3–5 question-answer pairs in JSON.
* **Flashcard Consolidation:** Results are merged and de-duplicated.
* **Display:** Final flashcards are rendered for interactive review.

## 🤝 Contributing

We welcome contributions!

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make changes and commit:

   ```bash
   git commit -m "Add new feature"
   ```

4. Push and open a pull request:

   ```bash
   git push origin feature/your-feature-name
   ```
