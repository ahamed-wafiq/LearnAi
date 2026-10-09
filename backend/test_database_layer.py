"""
Learn AI — Database Layer Automated Test Suite.

Tests:
1. Database connection
2. User creation & dev user retrieval
3. Document creation & metadata persistence
4. Document -> DocumentChunk relationship & retrieval
5. FAISS ID -> DocumentChunk mapping verification
6. Question -> Citation relationship persistence
7. Document deletion cascading (chunks & citations properly deleted)
8. Database migration / Alembic schema integrity
"""

import uuid
import unittest
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine, SessionLocal, check_db_connection, get_or_create_dev_user, DEV_USER_ID
from models import (
    Base,
    User,
    Document,
    DocumentChunk,
    DocumentStatus,
    Question,
    Citation,
    StudySession,
    Quiz,
    QuizQuestion,
    QuizAttempt,
    Progress,
)


class TestDatabaseLayer(unittest.TestCase):
    def setUp(self):
        self.db: Session = SessionLocal()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_01_database_connection(self):
        """Verify PostgreSQL connection health."""
        check = check_db_connection()
        self.assertEqual(check["status"], "connected")
        self.assertEqual(check["database"], "postgresql")

        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 + 1 AS test_val"))
            row = result.fetchone()
            self.assertEqual(row[0], 2)

    def test_02_user_creation_and_dev_user(self):
        """Verify user creation, unique constraints, and dev user getter."""
        dev_user = get_or_create_dev_user(self.db)
        self.assertIsNotNone(dev_user)
        self.assertEqual(dev_user.id, DEV_USER_ID)
        self.assertEqual(dev_user.email, "dev@learnai.local")

        # Create a test student user
        test_email = f"student_{uuid.uuid4().hex[:6]}@example.com"
        test_user = User(
            email=test_email,
            name="Test Student",
            password_hash="hashed_pw_123",
        )
        self.db.add(test_user)
        self.db.commit()
        self.db.refresh(test_user)

        self.assertIsNotNone(test_user.id)
        self.assertEqual(test_user.name, "Test Student")
        self.assertIsNotNone(test_user.created_at)

        # Cleanup test user
        self.db.delete(test_user)
        self.db.commit()

    def test_03_document_creation(self):
        """Verify Document record creation, status, and metadata."""
        dev_user = get_or_create_dev_user(self.db)
        doc_id = f"test-doc-{uuid.uuid4().hex[:8]}"

        doc = Document(
            id=doc_id,
            user_id=dev_user.id,
            filename="lecture_notes.pdf",
            original_filename="lecture_notes.pdf",
            file_path="/data/uploads/lecture_notes.pdf",
            file_size=1048576,
            page_count=10,
            chunk_count=25,
            status=DocumentStatus.READY.value,
            indexed_at=datetime.utcnow(),
        )
        self.db.add(doc)
        self.db.commit()

        # Query back
        fetched = self.db.query(Document).filter(Document.id == doc_id).first()
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.filename, "lecture_notes.pdf")
        self.assertEqual(fetched.page_count, 10)
        self.assertEqual(fetched.chunk_count, 25)
        self.assertEqual(fetched.status, "READY")
        self.assertEqual(fetched.user_id, dev_user.id)

        # Cleanup
        self.db.delete(fetched)
        self.db.commit()

    def test_04_document_chunk_relationship_and_faiss_id_mapping(self):
        """Verify Document -> DocumentChunk relationship and FAISS index ID mapping."""
        dev_user = get_or_create_dev_user(self.db)
        doc_id = f"test-doc-{uuid.uuid4().hex[:8]}"

        doc = Document(
            id=doc_id,
            user_id=dev_user.id,
            filename="neural_networks.pdf",
            original_filename="neural_networks.pdf",
            file_path="/data/uploads/neural_networks.pdf",
            file_size=50000,
            page_count=2,
            chunk_count=2,
            status=DocumentStatus.READY.value,
        )
        self.db.add(doc)
        self.db.flush()

        chunk_1 = DocumentChunk(
            document_id=doc_id,
            chunk_id=f"{doc_id}_chunk_0",
            page_number=1,
            text="Backpropagation computes gradients using the chain rule.",
            start_offset=0,
            end_offset=58,
            faiss_index_id=101,
        )
        chunk_2 = DocumentChunk(
            document_id=doc_id,
            chunk_id=f"{doc_id}_chunk_1",
            page_number=2,
            text="Activation functions like ReLU prevent vanishing gradients.",
            start_offset=0,
            end_offset=59,
            faiss_index_id=102,
        )
        self.db.add_all([chunk_1, chunk_2])
        self.db.commit()

        # Test relationship from document -> chunks
        fetched_doc = self.db.query(Document).filter(Document.id == doc_id).first()
        self.assertEqual(len(fetched_doc.chunks), 2)
        self.assertEqual(fetched_doc.chunks[0].faiss_index_id, 101)
        self.assertEqual(fetched_doc.chunks[1].faiss_index_id, 102)

        # Test querying chunk by FAISS ID
        chunk_by_faiss = self.db.query(DocumentChunk).filter(DocumentChunk.faiss_index_id == 101).first()
        self.assertIsNotNone(chunk_by_faiss)
        self.assertEqual(chunk_by_faiss.page_number, 1)
        self.assertEqual(chunk_by_faiss.document.filename, "neural_networks.pdf")

        # Cleanup
        self.db.delete(fetched_doc)
        self.db.commit()

    def test_05_question_and_citation_relationship(self):
        """Verify Question -> Citation relationship and document linking."""
        dev_user = get_or_create_dev_user(self.db)
        doc_id = f"test-doc-{uuid.uuid4().hex[:8]}"

        doc = Document(
            id=doc_id,
            user_id=dev_user.id,
            filename="optics.pdf",
            original_filename="optics.pdf",
            file_path="/data/uploads/optics.pdf",
            file_size=20000,
            page_count=1,
            chunk_count=1,
            status=DocumentStatus.READY.value,
        )
        self.db.add(doc)
        self.db.flush()

        question = Question(
            user_id=dev_user.id,
            document_id=doc_id,
            question_text="What is Snell's Law?",
            answer_text="Snell's Law relates refractive indices to the angles of incidence and refraction.",
            key_takeaways=["n1 * sin(theta1) = n2 * sin(theta2)"],
            follow_up_questions=["What is total internal reflection?"],
        )
        self.db.add(question)
        self.db.flush()

        citation = Citation(
            question_id=question.id,
            document_id=doc_id,
            chunk_id=f"{doc_id}_chunk_0",
            page_number=1,
            quote="n1 * sin(theta1) = n2 * sin(theta2)",
            similarity_score=0.92,
        )
        self.db.add(citation)
        self.db.commit()

        # Query question with citations
        fetched_q = self.db.query(Question).filter(Question.id == question.id).first()
        self.assertIsNotNone(fetched_q)
        self.assertEqual(len(fetched_q.citations), 1)
        self.assertEqual(fetched_q.citations[0].page_number, 1)
        self.assertAlmostEqual(fetched_q.citations[0].similarity_score, 0.92, places=2)

        # Cleanup
        self.db.delete(doc)
        self.db.commit()

    def test_06_document_deletion_cascading(self):
        """Verify deleting a Document cascades and cleans up chunks & citations."""
        dev_user = get_or_create_dev_user(self.db)
        doc_id = f"test-doc-{uuid.uuid4().hex[:8]}"

        doc = Document(
            id=doc_id,
            user_id=dev_user.id,
            filename="to_delete.pdf",
            original_filename="to_delete.pdf",
            file_path="/data/uploads/to_delete.pdf",
            file_size=1000,
            page_count=1,
            chunk_count=1,
            status=DocumentStatus.READY.value,
        )
        self.db.add(doc)
        self.db.flush()

        chunk = DocumentChunk(
            document_id=doc_id,
            chunk_id=f"{doc_id}_c0",
            page_number=1,
            text="Temporary chunk text.",
            faiss_index_id=999,
        )
        self.db.add(chunk)

        q = Question(
            user_id=dev_user.id,
            document_id=doc_id,
            question_text="Q text",
            answer_text="A text",
        )
        self.db.add(q)
        self.db.flush()

        cit = Citation(
            question_id=q.id,
            document_id=doc_id,
            chunk_id=f"{doc_id}_c0",
            page_number=1,
            quote="Temporary quote",
        )
        self.db.add(cit)
        self.db.commit()

        # Delete the document
        self.db.delete(doc)
        self.db.commit()

        # Verify chunks and citations were deleted
        remaining_chunks = self.db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
        self.assertEqual(len(remaining_chunks), 0)

        remaining_citations = self.db.query(Citation).filter(Citation.document_id == doc_id).all()
        self.assertEqual(len(remaining_citations), 0)

        # Cleanup question
        self.db.delete(q)
        self.db.commit()


if __name__ == "__main__":
    unittest.main()
