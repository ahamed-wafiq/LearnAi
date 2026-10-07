"""
LearnSphere Automated Functional & Workflow Test Suite.

Tests all critical backend workflows:
1. Health & Configuration
2. Documents & PDF Extraction
3. FAISS Vector Retrieval
4. RAG Q&A with Gemini & Citations
5. Quiz Generation, Submission & Scoring Persistence
6. Flashcards Generation & Spaced-Repetition Progress Tracking
7. Learning Analytics & ML Weakness Baseline
8. Adaptive Study Planner Horizon & Task Status Transitions
"""

import unittest
import json
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"


def http_get(path: str):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "LearnSphere-Test"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def http_post(path: str, data: dict):
    url = f"{BASE_URL}{path}"
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "LearnSphere-Test"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def http_patch(path: str, data: dict):
    url = f"{BASE_URL}{path}"
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="PATCH",
        headers={"Content-Type": "application/json", "User-Agent": "LearnSphere-Test"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def http_delete(path: str):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        method="DELETE",
        headers={"User-Agent": "LearnSphere-Test"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def http_get_raw(path: str):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "LearnSphere-Test"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, resp.headers.get_content_type(), resp.read()


class TestLearnSphereWorkflows(unittest.TestCase):

    def test_01_health_and_index_stats(self):
        """Verify both /api/health and /health alias respond with healthy status."""
        status_code, body = http_get("/api/health")
        self.assertEqual(status_code, 200)
        self.assertEqual(body.get("status"), "ok")
        self.assertIn("index", body)
        self.assertGreaterEqual(body["index"].get("total_vectors", 0), 0)
        self.assertTrue(body.get("gemini_configured"))

        # Verify /health alias
        status_code_alias, body_alias = http_get("/health")
        self.assertEqual(status_code_alias, 200)
        self.assertEqual(body_alias.get("status"), "ok")

    def test_02_document_listing_and_inspection(self):
        """Verify documents endpoint returns indexed PDFs with valid metadata."""
        status_code, body = http_get("/api/documents")
        self.assertEqual(status_code, 200)
        self.assertIn("documents", body)
        docs = body["documents"]
        self.assertIsInstance(docs, list)
        self.assertGreater(len(docs), 0, "At least one course document should be indexed.")

        doc = docs[0]
        self.assertIn("id", doc)
        self.assertIn("filename", doc)
        self.assertIn("total_pages", doc)
        self.assertIn("chunks_count", doc)
        self.assertGreaterEqual(doc["chunks_count"], 1)

        # Test page text extraction endpoint
        text_status, text_body = http_get(f"/api/documents/{doc['id']}/page/1/text")
        self.assertEqual(text_status, 200)
        self.assertIn("text", text_body)
        self.assertGreater(len(text_body["text"]), 10)

    def test_03_rag_qa_and_citations(self):
        """Verify RAG retrieval produces grounded answers with accurate citations."""
        status_code, docs_body = http_get("/api/documents")
        doc_id = docs_body["documents"][0]["id"]

        ask_data = {
            "question": "What is overfitting and how can it be prevented?",
            "doc_id": doc_id
        }
        status_code, body = http_post("/api/ask", ask_data)
        self.assertEqual(status_code, 200)
        self.assertIn("answer", body)
        self.assertIn("citations", body)
        self.assertIsInstance(body["citations"], list)
        self.assertGreater(len(body["answer"]), 20)

        # Verify citation structure
        if len(body["citations"]) > 0:
            c = body["citations"][0]
            self.assertIn("filename", c)
            self.assertIn("page_number", c)

    def test_04_quiz_generation_and_scoring_persistence(self):
        """Verify quiz creation, question grounding, and attempt score saving."""
        status_code, docs_body = http_get("/api/documents")
        doc_id = docs_body["documents"][0]["id"]
        doc_name = docs_body["documents"][0]["filename"]

        gen_req = {
            "doc_id": doc_id,
            "num_questions": 3,
            "difficulty": "Medium",
            "topic": "Machine Learning Fundamentals"
        }
        status_code, body = http_post("/api/practice/generate", gen_req)
        self.assertEqual(status_code, 200)
        self.assertIn("id", body)
        self.assertIn("questions", body)
        quiz = body
        self.assertGreaterEqual(len(quiz["questions"]), 1)

        # Validate question format
        first_q = quiz["questions"][0]
        self.assertIn("question", first_q)
        self.assertEqual(len(first_q["options"]), 4)
        self.assertIn(first_q["correct_index"], [0, 1, 2, 3])
        self.assertIn("explanation", first_q)

        # Simulate user answering and submitting result
        save_req = {
            "quiz_id": quiz["id"],
            "doc_id": doc_id,
            "doc_name": doc_name,
            "score": 2,
            "total": 3,
            "percentage": 66.7,
            "time_taken_seconds": 45,
            "user_answers": {"0": first_q["correct_index"], "1": 0},
            "questions": quiz["questions"]
        }
        save_status, save_body = http_post("/api/practice/results", save_req)
        self.assertEqual(save_status, 200)
        self.assertIn("id", save_body)

        # Verify result was persisted in results list
        res_status, res_body = http_get("/api/practice/results")
        self.assertEqual(res_status, 200)
        self.assertIsInstance(res_body, list)
        self.assertTrue(any(r["id"] == save_body["id"] for r in res_body))

    def test_05_flashcards_generation_and_progress_tracking(self):
        """Verify flashcards deck creation and spaced-repetition card review status."""
        status_code, docs_body = http_get("/api/documents")
        doc_id = docs_body["documents"][0]["id"]

        gen_req = {
            "doc_id": doc_id,
            "num_cards": 4,
            "difficulty": "medium",
            "topic": "Core Concepts"
        }
        status_code, body = http_post("/api/flashcards/generate", gen_req)
        self.assertEqual(status_code, 200)
        self.assertIn("id", body)
        self.assertIn("cards", body)
        deck = body
        self.assertGreaterEqual(len(deck["cards"]), 1)

        first_card = deck["cards"][0]
        self.assertIn("front", first_card)
        self.assertIn("back", first_card)

        # Update card review status to 'known'
        prog_req = {
            "card_id": first_card["id"],
            "deck_id": deck["id"],
            "status": "known",
            "rating": 5
        }
        prog_status, prog_body = http_post("/api/flashcards/progress", prog_req)
        self.assertEqual(prog_status, 200)
        self.assertEqual(prog_body["status"], "known")

    def test_06_analytics_calculations_and_predictions(self):
        """Verify learning analytics calculations, mastery scoring, and weakness detection."""
        status_code, body = http_get("/api/analytics")
        self.assertEqual(status_code, 200)
        self.assertIn("overall_mastery", body)
        self.assertIn("retention_rate", body)
        self.assertIn("topics", body)
        self.assertIn("weak_topics", body)
        self.assertIn("ml_diagnostics", body)

        # Test recalculation trigger
        recalc_status, recalc_body = http_post("/api/analytics/recalculate", {})
        self.assertEqual(recalc_status, 200)
        self.assertIn("overall_mastery", recalc_body)

    def test_07_study_planner_overview_and_task_transitions(self):
        """Verify planner 7-day adaptive schedule and task status updates."""
        status_code, body = http_get("/api/planner/overview")
        self.assertEqual(status_code, 200)
        self.assertIn("week_days", body)
        self.assertEqual(len(body["week_days"]), 7, "Planner must provide 7-day horizon.")
        self.assertIn("today_stats", body)
        self.assertIn("today_tasks", body)

        # Test updating a task if available
        if len(body["today_tasks"]) > 0:
            task = body["today_tasks"][0]
            new_status = "completed" if task["status"] != "completed" else "scheduled"
            patch_status, patch_body = http_patch(
                f"/api/planner/tasks/{task['id']}",
                {"status": new_status}
            )
            self.assertEqual(patch_status, 200)
            self.assertEqual(patch_body["status"], new_status)

    def test_08_pdf_page_rendering_and_file_streaming(self):
        """Verify PDF page image rendering and raw PDF streaming endpoints."""
        status_code, docs_body = http_get("/api/documents")
        doc_id = docs_body["documents"][0]["id"]

        # 1. Render page 1 image as PNG
        img_status, img_type, img_data = http_get_raw(f"/api/documents/{doc_id}/page/1?dpi=72")
        self.assertEqual(img_status, 200)
        self.assertEqual(img_type, "image/png")
        self.assertGreater(len(img_data), 1000, "Rendered page image should contain valid PNG bytes.")

        # 2. Stream original PDF
        pdf_status, pdf_type, pdf_data = http_get_raw(f"/api/documents/{doc_id}/pdf")
        self.assertEqual(pdf_status, 200)
        self.assertEqual(pdf_type, "application/pdf")
        self.assertTrue(pdf_data.startswith(b"%PDF"), "PDF stream must begin with %PDF magic bytes.")

    def test_09_study_goal_lifecycle_and_reschedule(self):
        """Verify study goal creation, listing, schedule generation, and deletion."""
        status_code, docs_body = http_get("/api/documents")
        doc_id = docs_body["documents"][0]["id"]
        doc_name = docs_body["documents"][0]["filename"]

        # Create new study goal
        new_goal_req = {
            "title": "Automated Test Exam Sprint",
            "subject_name": "Integration Testing",
            "doc_id": doc_id,
            "doc_name": doc_name,
            "exam_date": "2026-12-15",
            "daily_study_minutes": 60,
            "target_mastery": 95
        }
        create_status, created_goal = http_post("/api/planner/goals", new_goal_req)
        self.assertEqual(create_status, 200)
        self.assertIn("id", created_goal)
        goal_id = created_goal["id"]

        # Verify listed in goals
        list_status, goals_list = http_get("/api/planner/goals")
        self.assertEqual(list_status, 200)
        self.assertTrue(any(g["id"] == goal_id for g in goals_list))

        # Test rescheduling
        resched_status, resched_body = http_post("/api/planner/reschedule", {})
        self.assertEqual(resched_status, 200)
        self.assertIn("tasks_count", resched_body)

        # Delete the test goal
        del_status, del_body = http_delete(f"/api/planner/goals/{goal_id}")
        self.assertEqual(del_status, 200)
        self.assertIn("message", del_body)


if __name__ == "__main__":
    unittest.main(verbosity=2)
