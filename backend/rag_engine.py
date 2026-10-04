"""
LearnSphere RAG Backend — Gemini-powered answer generation.

Uses the google-genai SDK to call Gemini with a carefully crafted prompt
that forces the model to answer solely from the retrieved context chunks
and produce structured citations.
"""

import os
import json
from google import genai
from google.genai import types

from config import GEMINI_MODEL

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


# ── System prompt ────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are **LearnSphere Copilot**, an expert, student-friendly AI tutor.

## Rules
1. Answer the student's question using **ONLY** the provided context chunks below.
2. If the context is insufficient to answer fully, say so honestly — do NOT make up information.
3. Write a clear, well-structured answer. Use bullet points, numbered lists, or short paragraphs as appropriate.
4. After the answer, include a **"Sources"** section listing every chunk you used, in this exact format:
   - [filename, Page page_number] — one-line summary of what was cited from that chunk.
5. If you can extract **key takeaways** (2-4 bullets) for quick review, add them under a **"Key Takeaways"** heading.
6. Suggest 2 natural follow-up questions the student might ask next, under a **"Follow-up Questions"** heading.
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


# ── Public API ───────────────────────────────────────────────────────────

def generate_answer(question: str, context_chunks: list[dict]) -> dict:
    """
    Generate a RAG-grounded answer using Gemini.

    Parameters
    ----------
    question : str
        The student's question.
    context_chunks : list[dict]
        Retrieved chunks, each having keys: filename, page_number, text, score.

    Returns
    -------
    dict with keys: answer, citations, key_takeaways, follow_up_questions
    """
    client = _get_client()

    # Build the context block
    context_parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(
            f"--- Chunk {i} ---\n"
            f"File: {chunk['filename']}\n"
            f"Page: {chunk['page_number']}\n"
            f"Content:\n{chunk['text']}\n"
        )
    context_block = "\n".join(context_parts)

    user_message = (
        f"## Context Chunks\n{context_block}\n\n"
        f"## Student Question\n{question}"
    )

    candidate_models = [GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.8-flash"]
    response = None
    last_err = None

    import time
    for m in candidate_models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=[user_message],
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.3,
                        max_output_tokens=2048,
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
        raise last_err or RuntimeError("Failed to generate response from Gemini models.")

    raw = response.text.strip()

    # Strip markdown code fences if present
    cleaned = raw
    if "```" in cleaned:
        import re
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()

    parsed = None
    # 1. Direct parse with strict=False
    try:
        parsed = json.loads(cleaned, strict=False)
    except Exception:
        pass

    # 2. Fix unescaped LaTeX backslashes if any (e.g. \alpha, \nabla)
    if not parsed:
        try:
            import re
            fixed = re.sub(r'\\(?![/\\bfnrtu"U])', r'\\\\', cleaned)
            parsed = json.loads(fixed, strict=False)
        except Exception:
            pass

    # 3. Search for outermost JSON object block
    if not parsed:
        import re
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

    if not parsed:
        parsed = {
            "answer": raw,
            "citations": [],
            "key_takeaways": [],
            "follow_up_questions": [],
        }

    # Normalise keys
    return {
        "answer": parsed.get("answer", raw),
        "citations": parsed.get("citations", []),
        "key_takeaways": parsed.get("key_takeaways", []),
        "follow_up_questions": parsed.get("follow_up_questions", []),
    }
