"""
LearnSphere Personalized Study Planner & Adaptive Scheduling Engine

Features:
1. Manages study goals, exam deadlines, and daily study time allocation.
2. Extracts topics from uploaded PDF chunks and RAG metadata.
3. Generates daily study and revision plans combining:
   - Overdue flashcards (prioritizing 'Review Again')
   - Weak topics identified by the ML analytics engine
   - Consolidating topics due for spaced repetition
   - Unfinished/untested topics from course PDFs
4. Balances daily study budgets (e.g. 30, 45, 60 mins) across revision and active recall.
5. Handles task completion, skipping, and rescheduling to future dates.
6. Automatically recalculates future schedules when quiz results or task progress changes.
7. Persists goals and schedules in JSON storage.
"""

import time
import math
import uuid
import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from config import DATA_DIR
import embeddings
import analytics_engine

GOALS_FILE = DATA_DIR / "study_goals.json"
PLANNER_TASKS_FILE = DATA_DIR / "planner_tasks.json"


def _load_json(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            import json
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default
    return default


def _save_json(path: Path, data: Any) -> None:
    import json
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── 1. Study Goals Management ────────────────────────────────────────────

def get_goals() -> List[Dict[str, Any]]:
    """Retrieve all saved study goals."""
    return _load_json(GOALS_FILE, [])


def save_goal(goal_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create or update a study goal.
    Fields:
      - title: str
      - subject_name: str
      - doc_id: str | None
      - doc_name: str | None
      - exam_date: str (YYYY-MM-DD)
      - daily_study_minutes: int (default 45)
      - target_mastery: int (default 90)
    """
    goals = get_goals()
    goal_id = goal_data.get("id") or f"goal-{uuid.uuid4().hex[:8]}"

    exam_date = goal_data.get("exam_date")
    if not exam_date:
        # Default to 14 days from today
        future_date = datetime.date.today() + datetime.timedelta(days=14)
        exam_date = future_date.isoformat()

    record = {
        "id": goal_id,
        "title": goal_data.get("title", "Course Exam Preparation"),
        "subject_name": goal_data.get("subject_name", "Machine Learning & AI"),
        "doc_id": goal_data.get("doc_id"),
        "doc_name": goal_data.get("doc_name", "All Documents"),
        "exam_date": exam_date,
        "daily_study_minutes": int(goal_data.get("daily_study_minutes", 45)),
        "target_mastery": int(goal_data.get("target_mastery", 90)),
        "created_at": goal_data.get("created_at", time.time()),
        "updated_at": time.time(),
    }

    # Replace existing or insert at top
    existing_idx = next((i for i, g in enumerate(goals) if g["id"] == goal_id), None)
    if existing_idx is not None:
        goals[existing_idx] = record
    else:
        goals.insert(0, record)

    _save_json(GOALS_FILE, goals)

    # Automatically generate or update schedule for this goal
    generate_adaptive_schedule(record)

    return record


def delete_goal(goal_id: str) -> bool:
    """Delete a goal and its associated planner tasks."""
    goals = get_goals()
    filtered = [g for g in goals if g["id"] != goal_id]
    _save_json(GOALS_FILE, filtered)

    # Delete tasks for this goal
    tasks = get_tasks()
    remaining_tasks = [t for t in tasks if t.get("goal_id") != goal_id]
    _save_json(PLANNER_TASKS_FILE, remaining_tasks)
    return True


# ── 2. Topic Extraction from Uploaded Documents ──────────────────────────

def extract_document_topics(doc_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Extracts distinct topics and page locations from indexed PDF chunks.
    """
    chunks = embeddings.get_document_chunks(doc_id)
    if not chunks:
        return []

    topics_found: Dict[str, Dict[str, Any]] = {}

    for chunk in chunks:
        text = chunk.get("text", "")
        fn = chunk.get("filename", "document.pdf")
        pg = chunk.get("page_number", 1)

        # Check for core subject concepts first
        lowered = text.lower()
        if "gradient descent" in lowered and "stochastic" in lowered:
            candidate_topic = "Stochastic & Mini-Batch Gradient Descent"
        elif "gradient descent" in lowered:
            candidate_topic = "Gradient Descent Optimization"
        elif "backpropagation" in lowered:
            candidate_topic = "Backpropagation Algorithm"
        elif "perceptron" in lowered:
            candidate_topic = "Perceptrons & Multi-Layer Networks"
        elif "bias-variance" in lowered:
            candidate_topic = "Bias-Variance Tradeoff"
        elif "regularization" in lowered or "dropout" in lowered:
            candidate_topic = "Regularization & Dropout"
        elif "cost function" in lowered or "mse" in lowered:
            candidate_topic = "Cost Functions & Mean Squared Error"
        elif "activation" in lowered or "softmax" in lowered or "relu" in lowered:
            candidate_topic = "Activation Functions (ReLU, Softmax)"
        else:
            for line in lines[:4]:
                cleaned_line = line.lstrip("#*-0123456789. ").strip()
                if 5 <= len(cleaned_line) <= 45 and not cleaned_line.endswith(":") and cleaned_line[0].isupper():
                    candidate_topic = cleaned_line
                    break

        if not candidate_topic:
            candidate_topic = f"Key Concepts in {fn}"

        if candidate_topic not in topics_found:
            topics_found[candidate_topic] = {
                "topic": candidate_topic,
                "filename": fn,
                "page_number": pg,
                "excerpt": text[:180].strip(),
            }

    return list(topics_found.values())


# ── 3. Adaptive Schedule Generation ──────────────────────────────────────

def get_tasks(goal_id: Optional[str] = None, date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve planner tasks, optionally filtered by goal_id or date."""
    tasks = _load_json(PLANNER_TASKS_FILE, [])
    if goal_id:
        tasks = [t for t in tasks if t.get("goal_id") == goal_id]
    if date_str:
        tasks = [t for t in tasks if t.get("date") == date_str]
    return tasks


def generate_adaptive_schedule(goal: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Builds a 7-day personalized study schedule balancing:
    1. Overdue flashcards (prioritizing Review Again)
    2. Weak topics identified by ML weakness model
    3. Spaced revision for consolidating topics
    4. New/untested topics from course documents
    """
    today = datetime.date.today()
    goal_id = goal["id"]
    daily_budget = goal.get("daily_study_minutes", 45)
    doc_id = goal.get("doc_id")
    doc_name = goal.get("doc_name", "ml_study_guide.pdf")

    # Load existing analytics and topics
    analytics = analytics_engine.compute_learning_analytics()
    weak_topics = analytics.get("weak_topics", [])
    all_analytics_topics = {t["topic"].lower(): t for t in analytics.get("topics", [])}
    spaced_cards = analytics.get("spaced_repetition", {}).get("cards", [])

    # Extract all topics available in PDF
    pdf_topics = extract_document_topics(doc_id)

    # Keep already completed or skipped tasks intact
    existing_tasks = get_tasks(goal_id=goal_id)
    completed_task_ids = {t["id"]: t for t in existing_tasks if t.get("status") in ("completed", "skipped")}

    new_schedule: List[Dict[str, Any]] = []

    # Plan for the next 7 days
    for day_offset in range(7):
        current_day = today + datetime.timedelta(days=day_offset)
        day_str = current_day.isoformat()

        # Check existing completed tasks for this day to preserve streak
        day_completed = [t for t in existing_tasks if t.get("date") == day_str and t.get("status") in ("completed", "skipped")]
        used_minutes = sum(t.get("duration_minutes", 15) for t in day_completed)

        remaining_minutes = max(0, daily_budget - used_minutes)
        if remaining_minutes <= 10:
            new_schedule.extend(day_completed)
            continue

        day_tasks: List[Dict[str, Any]] = list(day_completed)

        # Day 0 & 1: prioritize urgent flashcards & weak topics
        if day_offset == 0:
            # Overdue flashcards check
            due_cards = [c for c in spaced_cards if c.get("is_overdue") or c.get("status") == "review"]
            if due_cards and remaining_minutes >= 15:
                card = due_cards[0]
                task_id = f"task-{goal_id}-d{day_offset}-fc"
                if task_id not in completed_task_ids:
                    day_tasks.append({
                        "id": task_id,
                        "goal_id": goal_id,
                        "date": day_str,
                        "time": "09:00",
                        "title": f"Spaced Flashcard Review: {card.get('topic')}",
                        "topic": card.get("topic"),
                        "type": "flashcards",
                        "priority": "high",
                        "duration_minutes": 15,
                        "status": "scheduled",
                        "reason": f"Card flagged as 'Review Again'. Grounded in {card.get('filename')} (p. {card.get('page_number')}).",
                        "doc_name": card.get("filename", doc_name),
                        "page_number": card.get("page_number", 1),
                        "action_url": "/flashcards",
                        "created_at": time.time(),
                    })
                    remaining_minutes -= 15

            # Weak topics check
            if weak_topics and remaining_minutes >= 20:
                wt = weak_topics[0]
                task_id = f"task-{goal_id}-d{day_offset}-wt"
                if task_id not in completed_task_ids:
                    day_tasks.append({
                        "id": task_id,
                        "goal_id": goal_id,
                        "date": day_str,
                        "time": "14:00",
                        "title": f"Targeted Practice Drill: {wt.get('topic')}",
                        "topic": wt.get("topic"),
                        "type": "quiz",
                        "priority": "high",
                        "duration_minutes": 20,
                        "status": "scheduled",
                        "reason": f"Weakness risk estimated at {wt.get('weakness_probability')}%. {wt.get('reason')}",
                        "doc_name": wt.get("source_doc", doc_name),
                        "page_number": wt.get("page_number", 1),
                        "action_url": "/practice",
                        "created_at": time.time(),
                    })
                    remaining_minutes -= 20

        # Day 1 - 3: Second weak topic or consolidating spaced revision
        elif day_offset in (1, 2):
            # Consolidating or secondary weak topic
            target_topic = None
            if len(weak_topics) > 1:
                target_topic = weak_topics[1]
            elif pdf_topics:
                target_topic = pdf_topics[day_offset % len(pdf_topics)]

            if target_topic and remaining_minutes >= 25:
                topic_name = target_topic.get("topic")
                analytics_info = all_analytics_topics.get(topic_name.lower(), {})
                mastery = analytics_info.get("mastery", 65)

                task_id = f"task-{goal_id}-d{day_offset}-rev"
                if task_id not in completed_task_ids:
                    day_tasks.append({
                        "id": task_id,
                        "goal_id": goal_id,
                        "date": day_str,
                        "time": "10:30",
                        "title": f"Active Recall & Concept Review: {topic_name}",
                        "topic": topic_name,
                        "type": "reading" if mastery < 50 else "quiz",
                        "priority": "medium",
                        "duration_minutes": 25,
                        "status": "scheduled",
                        "reason": f"Current mastery at {mastery}%. Review key definitions and formulas before decay.",
                        "doc_name": target_topic.get("filename", doc_name),
                        "page_number": target_topic.get("page_number", 1),
                        "action_url": f"/study-room?page={target_topic.get('page_number', 1)}" if mastery < 50 else "/practice",
                        "created_at": time.time(),
                    })
                    remaining_minutes -= 25

        # Day 4 - 6: Unstudied chapters / Full Practice Exam Drill
        else:
            topic_idx = day_offset % len(pdf_topics) if pdf_topics else 0
            pt = pdf_topics[topic_idx] if pdf_topics else {"topic": "Course Synthesis", "filename": doc_name, "page_number": 1}

            task_id = f"task-{goal_id}-d{day_offset}-study"
            if task_id not in completed_task_ids:
                day_tasks.append({
                    "id": task_id,
                    "goal_id": goal_id,
                    "date": day_str,
                    "time": "16:00",
                    "title": f"Deep Learning & Synthesis: {pt.get('topic')}",
                    "topic": pt.get("topic"),
                    "type": "reading",
                    "priority": "low" if day_offset >= 5 else "medium",
                    "duration_minutes": min(30, max(20, remaining_minutes)),
                    "status": "scheduled",
                    "reason": f"Systematic syllabus coverage for {goal['subject_name']}. Grounded in {pt.get('filename')} (p. {pt.get('page_number')}).",
                    "doc_name": pt.get("filename", doc_name),
                    "page_number": pt.get("page_number", 1),
                    "action_url": f"/study-room?page={pt.get('page_number', 1)}",
                    "created_at": time.time(),
                })
                remaining_minutes -= 25

        new_schedule.extend(day_tasks)

    # Save to storage
    # Preserve tasks from other goals
    other_tasks = [t for t in existing_tasks if t.get("goal_id") != goal_id]
    all_combined = other_tasks + new_schedule
    _save_json(PLANNER_TASKS_FILE, all_combined)

    return new_schedule


# ── 4. Task Status Transitions (Complete, Skip, Reschedule) ───────────────

def update_task_status(
    task_id: str,
    status: str,
    new_date: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Updates a task's status: 'completed', 'skipped', 'rescheduled', or 'scheduled'.
    If 'rescheduled', moves to new_date or tomorrow.
    """
    tasks = get_tasks()
    target = None

    for t in tasks:
        if t["id"] == task_id:
            t["status"] = status
            t["updated_at"] = time.time()

            if status == "completed":
                t["completed_at"] = time.time()
            elif status == "rescheduled":
                if new_date:
                    t["date"] = new_date
                else:
                    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
                    t["date"] = tomorrow.isoformat()
                t["status"] = "scheduled"

            target = t
            break

    if target:
        _save_json(PLANNER_TASKS_FILE, tasks)

    return target


# ── 5. Planner Summary & Progress Overview ───────────────────────────────

def get_planner_overview() -> Dict[str, Any]:
    """
    Returns high-level summary of goals, daily checklist, weekly calendar, and deadline countdown.
    """
    today_str = datetime.date.today().isoformat()
    goals = get_goals()
    all_tasks = get_tasks()

    if not goals:
        # Check if any documents exist to offer goal creation
        docs = embeddings.get_index_stats()
        has_docs = docs.get("total_documents", 0) > 0

        return {
            "has_goals": False,
            "has_documents": has_docs,
            "message": "No study goals defined yet. Set your target exam date and daily study time to generate an adaptive revision schedule.",
            "goals": [],
            "today_tasks": [],
            "today_stats": {"total": 0, "completed": 0, "percentage": 0, "minutes_planned": 0, "minutes_spent": 0},
            "weekly_tasks": [],
            "upcoming_deadlines": [],
        }

    active_goal = goals[0]

    # Compute today's tasks & stats
    today_tasks = [t for t in all_tasks if t.get("date") == today_str]
    completed_today = [t for t in today_tasks if t.get("status") == "completed"]
    total_today_minutes = sum(t.get("duration_minutes", 15) for t in today_tasks)
    spent_today_minutes = sum(t.get("duration_minutes", 15) for t in completed_today)

    pct_today = round((len(completed_today) / len(today_tasks)) * 100) if today_tasks else 0

    # Weekly view: Next 7 days
    today = datetime.date.today()
    week_days = []
    weekly_tasks = []

    for i in range(7):
        d = today + datetime.timedelta(days=i)
        d_str = d.isoformat()
        day_tasks = [t for t in all_tasks if t.get("date") == d_str]
        week_days.append({
            "date": d_str,
            "day": d.strftime("%a"),
            "day_number": d.day,
            "is_today": i == 0,
            "tasks_count": len(day_tasks),
            "completed_count": len([t for t in day_tasks if t.get("status") == "completed"]),
        })
        weekly_tasks.extend(day_tasks)

    # Upcoming Deadlines
    upcoming_deadlines = []
    for g in goals:
        try:
            exam_d = datetime.date.fromisoformat(g["exam_date"])
            days_left = (exam_d - today).days
            upcoming_deadlines.append({
                "goal_id": g["id"],
                "title": g["title"],
                "subject_name": g["subject_name"],
                "exam_date": g["exam_date"],
                "days_remaining": days_left,
                "is_urgent": days_left <= 3,
                "target_mastery": g.get("target_mastery", 90),
            })
        except Exception:
            pass

    return {
        "has_goals": True,
        "has_documents": True,
        "goals": goals,
        "active_goal": active_goal,
        "today_stats": {
            "total": len(today_tasks),
            "completed": len(completed_today),
            "percentage": pct_today,
            "minutes_planned": total_today_minutes,
            "minutes_spent": spent_today_minutes,
            "daily_budget": active_goal.get("daily_study_minutes", 45),
        },
        "today_tasks": today_tasks,
        "week_days": week_days,
        "weekly_tasks": weekly_tasks,
        "upcoming_deadlines": upcoming_deadlines,
    }
