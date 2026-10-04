"""
LearnSphere RAG Backend — Gemini-powered answer, quiz, and flashcard generation.

Uses the google-genai SDK to call Gemini with carefully crafted prompts
grounded strictly in the retrieved context chunks, producing structured JSON
with page-level citations.
"""

import os
import json
import time
import re
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

from config import GEMINI_MODEL

# Ensure environment variables are loaded
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# ── Client initialisation ───────────────────────────────────────────────

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. "
                "Create a backend/.env file with your key (see .env.example)."
            )
        _client = genai.Client(api_key=api_key)
    return _client


# ── System Prompts ───────────────────────────────────────────────────────

QA_SYSTEM_PROMPT = """\
You are **LearnSphere Copilot**, an expert, student-friendly AI tutor.

## Rules
1. Answer the student's question using **ONLY** the provided context chunks below.
2. If the context is insufficient to answer fully, say so honestly — do NOT make up information.
3. Write a clear, well-structured answer. Use bullet points, numbered lists, or short paragraphs as appropriate.
4. After the answer, cite the chunks used.
5. Extract **key takeaways** (2-4 bullets) for quick review.
6. Suggest 2 natural follow-up questions the student might ask next.
7. Keep the tone encouraging, precise, and concise.

## Output format
Return **valid JSON** with exactly these keys:
{
  "answer": "...",
  "citations": [
    {
      "filename": "...",
      "page_number": <int>,
      "excerpt": "short quote from chunk (max 120 chars)"
    }
  ],
  "key_takeaways": ["...", "..."],
  "follow_up_questions": ["...", "..."]
}
Do NOT wrap the JSON in markdown code fences. Return raw JSON only.
"""

QUIZ_SYSTEM_PROMPT = """\
You are **LearnSphere Quiz Master**, an expert educator creating high-yield multiple-choice questions for students.

## Rules
1. Create exactly {num_questions} multiple-choice questions grounded **EXCLUSIVELY** in the provided context chunks.
2. Provide exactly 4 options per question.
3. The options must be distinct, realistic, and plausible, with exactly ONE unambiguous correct answer.
4. Set "correct_index" to 0, 1, 2, or 3 (0-indexed integer pointing to the correct option in the options array).
5. Provide a clear, educational "explanation" grounded in the text explaining why the correct option is right.
6. For each question, specify the exact source "filename", "page_number" (integer), and an exact supporting "excerpt" quote (max 140 chars) from the chunk.
7. Provide a concise "topic" label reflecting the subject matter.
8. Calibrate the questions to the requested difficulty level: {difficulty}.

## Output Format
Return **valid JSON** with key "questions":
{{
  "questions": [
    {{
      "id": "q1",
      "question": "What is...",
      "options": ["A...", "B...", "C...", "D..."],
      "correct_index": 0,
      "explanation": "...",
      "topic": "...",
      "difficulty": "{difficulty}",
      "filename": "...",
      "page_number": 1,
      "excerpt": "..."
    }}
  ]
}}
Do NOT wrap the JSON in markdown code fences. Return raw JSON only.
"""

FLASHCARD_SYSTEM_PROMPT = """\
You are **LearnSphere Memory Coach**, an expert in spaced repetition and active recall.

## Rules
1. Create exactly {num_cards} concise, high-yield flashcards grounded **EXCLUSIVELY** in the provided context chunks.
2. "front": a clear question, key concept, formula prompt, or term definition prompt.
3. "back": a crisp, complete explanation or definition answering the front prompt.
4. For each flashcard, specify the exact source "filename", "page_number" (integer), and an exact supporting "excerpt" quote (max 140 chars) from the chunk.
5. Provide a concise "topic" label and difficulty ("easy", "medium", "hard").

## Output Format
Return **valid JSON** with key "flashcards":
{{
  "flashcards": [
    {{
      "id": "fc1",
      "front": "What is...",
      "back": "...",
      "topic": "...",
      "difficulty": "{difficulty}",
      "filename": "...",
      "page_number": 1,
      "excerpt": "..."
    }}
  ]
}}
Do NOT wrap the JSON in markdown code fences. Return raw JSON only.
"""


# ── Generic LLM Call with Fallback and Robust JSON Parsing ───────────────

def _call_gemini_json(system_instruction: str, user_message: str) -> tuple[dict | None, str]:
    """
    Call Gemini with multi-model failover and sanitize JSON outputs (including LaTeX escapes).
    Returns (parsed_dict, raw_text).
    """
    client = _get_client()
    candidate_models = [GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.8-flash"]
    response = None
    last_err = None

    for m in candidate_models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=[user_message],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.3,
                        max_output_tokens=3072,
                        response_mime_type="application/json",
                    ),
                )
                break
            except Exception as e:
                last_err = e
                time.sleep(1.0)
        if response is not None:
            break

    if response is None:
        raise last_err or RuntimeError("Failed to generate response from Gemini.")

    raw = response.text.strip()

    # Strip code fences if present
    cleaned = raw
    if "```" in cleaned:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()

    parsed = None
    # 1. Direct parse
    try:
        parsed = json.loads(cleaned, strict=False)
    except Exception:
        pass

    # 2. Fix unescaped LaTeX backslashes if present (e.g., \alpha, \nabla, \frac)
    if not parsed:
        try:
            fixed = re.sub(r'\\(?![/\\bfnrtu"U])', r'\\\\', cleaned)
            parsed = json.loads(fixed, strict=False)
        except Exception:
            pass

    # 3. Search for outermost JSON object block
    if not parsed:
        obj_match = re.search(r"(\{[\s\S]*\})", cleaned)
        if obj_match:
            candidate = obj_match.group(1)
            try:
                parsed = json.loads(candidate, strict=False)
            except Exception:
                try:
                    fixed = re.sub(r'\\(?![/\\bfnrtu"U])', r'\\\\', candidate)
                    parsed = json.loads(fixed, strict=False)
                except Exception:
                    pass

    return parsed, raw


# ── Public APIs ──────────────────────────────────────────────────────────

def generate_answer(question: str, context_chunks: list[dict]) -> dict:
    """Generate a RAG-grounded answer using Gemini."""
    context_parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(
            f"--- Chunk {i} ---\n"
            f"File: {chunk.get('filename', 'document.pdf')}\n"
            f"Page: {chunk.get('page_number', 1)}\n"
            f"Content:\n{chunk.get('text', '')}\n"
        )
    context_block = "\n".join(context_parts)

    user_message = (
        f"## Context Chunks\n{context_block}\n\n"
        f"## Student Question\n{question}"
    )

    parsed, raw = _call_gemini_json(QA_SYSTEM_PROMPT, user_message)

    if not parsed:
        parsed = {
            "answer": raw,
            "citations": [],
            "key_takeaways": [],
            "follow_up_questions": [],
        }

    return {
        "answer": parsed.get("answer", raw),
        "citations": parsed.get("citations", []),
        "key_takeaways": parsed.get("key_takeaways", []),
        "follow_up_questions": parsed.get("follow_up_questions", []),
    }


def generate_quiz(
    context_chunks: list[dict],
    num_questions: int = 5,
    difficulty: str = "Medium",
    topic: str | None = None,
) -> dict:
    """
    Generate multiple-choice quiz questions grounded in document chunks.
    """
    if not context_chunks:
        raise ValueError("No context chunks provided for quiz generation.")

    # Select representative chunks across pages
    if len(context_chunks) > 12:
        step = len(context_chunks) / 12
        sampled = [context_chunks[int(i * step)] for i in range(12)]
    else:
        sampled = context_chunks

    context_parts: list[str] = []
    for i, chunk in enumerate(sampled, 1):
        context_parts.append(
            f"--- Chunk {i} ---\n"
            f"File: {chunk.get('filename', 'document.pdf')}\n"
            f"Page: {chunk.get('page_number', 1)}\n"
            f"Content:\n{chunk.get('text', '')}\n"
        )
    context_block = "\n".join(context_parts)

    prompt = QUIZ_SYSTEM_PROMPT.format(num_questions=num_questions, difficulty=difficulty)
    user_message = (
        f"## Context Chunks\n{context_block}\n\n"
        f"## Request\nGenerate {num_questions} multiple-choice questions with difficulty '{difficulty}'"
        + (f" focusing on topic: '{topic}'." if topic else ".")
    )

    parsed, raw = _call_gemini_json(prompt, user_message)

    if not parsed or "questions" not in parsed:
        raise RuntimeError("Failed to parse valid quiz questions from AI response.")

    # Validate and clean questions
    valid_questions = []
    for idx, q in enumerate(parsed.get("questions", []), 1):
        options = q.get("options", [])
        if len(options) < 4:
            continue
        correct_idx = q.get("correct_index", 0)
        if not (0 <= correct_idx < len(options)):
            correct_idx = 0

        valid_questions.append({
            "id": q.get("id") or f"q-{idx}",
            "question": q.get("question", "Question"),
            "options": options[:4],
            "correct_index": correct_idx,
            "explanation": q.get("explanation", "Grounded in the study text."),
            "topic": q.get("topic", topic or "General Concepts"),
            "difficulty": q.get("difficulty", difficulty),
            "filename": q.get("filename", sampled[0].get("filename", "document.pdf")),
            "page_number": int(q.get("page_number", sampled[0].get("page_number", 1))),
            "excerpt": q.get("excerpt", ""),
        })

    return {"questions": valid_questions}


def generate_flashcards(
    context_chunks: list[dict],
    num_cards: int = 6,
    difficulty: str = "medium",
    topic: str | None = None,
) -> dict:
    """
    Generate active-recall flashcards grounded in document chunks.
    """
    if not context_chunks:
        raise ValueError("No context chunks provided for flashcard generation.")

    if len(context_chunks) > 12:
        step = len(context_chunks) / 12
        sampled = [context_chunks[int(i * step)] for i in range(12)]
    else:
        sampled = context_chunks

    context_parts: list[str] = []
    for i, chunk in enumerate(sampled, 1):
        context_parts.append(
            f"--- Chunk {i} ---\n"
            f"File: {chunk.get('filename', 'document.pdf')}\n"
            f"Page: {chunk.get('page_number', 1)}\n"
            f"Content:\n{chunk.get('text', '')}\n"
        )
    context_block = "\n".join(context_parts)

    prompt = FLASHCARD_SYSTEM_PROMPT.format(num_cards=num_cards, difficulty=difficulty)
    user_message = (
        f"## Context Chunks\n{context_block}\n\n"
        f"## Request\nGenerate {num_cards} flashcards with difficulty '{difficulty}'"
        + (f" focusing on topic: '{topic}'." if topic else ".")
    )

    parsed, raw = _call_gemini_json(prompt, user_message)

    if not parsed or "flashcards" not in parsed:
        raise RuntimeError("Failed to parse valid flashcards from AI response.")

    valid_cards = []
    for idx, fc in enumerate(parsed.get("flashcards", []), 1):
        front = fc.get("front", "").strip()
        back = fc.get("back", "").strip()
        if not front or not back:
            continue

        valid_cards.append({
            "id": fc.get("id") or f"fc-{idx}",
            "front": front,
            "back": back,
            "topic": fc.get("topic", topic or "Key Concept"),
            "difficulty": fc.get("difficulty", difficulty).lower(),
            "filename": fc.get("filename", sampled[0].get("filename", "document.pdf")),
            "page_number": int(fc.get("page_number", sampled[0].get("page_number", 1))),
            "excerpt": fc.get("excerpt", ""),
        })

    return {"flashcards": valid_cards}
