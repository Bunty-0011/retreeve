import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import topicService from "../appwrite/topic_service";
import reviewService from "../appwrite/review_service";
import ProgressChart from "../components/progressChart";

export default function TopicDetail() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [takingTest, setTakingTest] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Load Topic (with refresh support)
  const loadTopic = async () => {
    try {
      const res = await topicService.getTopic(id);
      setTopic(res);
    } catch (err) {
      console.error("Failed to fetch topic", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTopic();
  }, [id]);

  // ✅ Re-fetch when user comes back from test page
  useEffect(() => {
    if (location.state?.refresh) {
      loadTopic();
      // clear refresh flag so it doesn’t reload infinitely
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // ✅ Mark as Reviewed
  const handleReview = async () => {
    if (!topic) return;
    setReviewing(true);
    try {
      const updated = await reviewService.updateReviewData(
        topic.$id,
        topic.user_id,
        { giveTest: false }
      );
      setTopic(updated);
    } catch (err) {
      console.error("Failed to update review", err);
    } finally {
      setReviewing(false);
    }
  };

  // ✅ Navigate to TestPage
  const handleTakeTest = () => {
    if (!topic) return;
    setTakingTest(true);
    // Pass refresh flag so TopicDetail reloads after test
    navigate(`/topics/${id}/test`, { state: { from: "topicDetail" } });
  };

  // ✅ Test History (for chart)
  const testHistory = (topic?.test_results || []).map((score, idx) => ({
    attempt: idx + 1,
    score,
  }));

  if (loading) return <div>Loading topic...</div>;
  if (!topic) return <div>Topic not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Back
      </button>

      {/* Topic Info */}
      <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
      <p className="text-gray-600 mb-2">Status: {topic.status}</p>
      <p className="text-gray-600 mb-2">
        Next Review: {topic.next_review_date || "N/A"}
      </p>
      <p className="text-gray-600 mb-2">
        Last Reviewed: {topic.last_reviewed_at || "N/A"}
      </p>
      <p className="text-gray-600 mb-2">
        Ease Factor: {topic.ease_factor?.toFixed(2) || "N/A"}
      </p>
      <p className="text-gray-600 mb-2">
        Interval: {topic.interval || "N/A"} days
      </p>
      <p className="text-gray-600 mb-2">
        Repetitions: {topic.repetition_count || 0}
      </p>

      {/* Test Results */}
      <div className="mt-4">
        <h2 className="font-semibold mb-2">Test History:</h2>
        {topic.test_results && topic.test_results.length > 0 ? (
          <ul className="list-disc ml-6">
            {topic.test_results.map((score, idx) => (
              <li key={idx}>Attempt {idx + 1}: {score}%</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No test attempts yet.</p>
        )}
      </div>

      {/* Weak Areas */}
      {topic.weak_areas && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Weak Areas:</h2>
          <ul className="list-disc list-inside text-red-600">
            {Array.isArray(topic.weak_areas)
              ? topic.weak_areas.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))
              : topic.weak_areas
                  ?.replace(/^\[|\]$/g, "")
                  .split(",")
                  .map((area, idx) => (
                    <li key={idx}>{area.replace(/["']/g, "").trim()}</li>
                  ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="mt-4">
        <h2 className="font-semibold mb-2">Content:</h2>
        <p>{topic.content || "No content available."}</p>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <h2 className="font-semibold mb-2">Notes Preview:</h2>
        {!topic.notes || topic.notes.trim() === "" ? (
          <div className="p-3 rounded border bg-gray-50">
            <p className="text-gray-600 mb-3">Notes are not added yet.</p>
            <button
              onClick={() => navigate(`/notes/${topic.$id}`)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Notes
            </button>
          </div>
        ) : (
          <div className="p-3 rounded border bg-gray-50">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: topic.notes }}
            />
            <button
              onClick={() => navigate(`/notes/${topic.$id}`)}
              className="mt-3 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Edit Notes
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleReview}
          disabled={reviewing}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {reviewing ? "Reviewing..." : "Mark as Reviewed"}
        </button>

        <button
          onClick={handleTakeTest}
          disabled={takingTest}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {takingTest ? "Loading Test..." : "Take Test"}
        </button>
      </div>

      {/* Progress Chart */}
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Progress Over Time</h2>
        {testHistory.length > 0 ? (
          <ProgressChart testHistory={testHistory} />
        ) : (
          <p className="text-gray-500">No test results yet</p>
        )}
      </div>
    </div>
  );
}
