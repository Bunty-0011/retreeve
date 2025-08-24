import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import TopicCard from "../components/TopicCard";
import topicService from "../appwrite/topic_service";
import reviewService from "../appwrite/review_service";
import { clearTopicQuery } from "../features/searchSlice";

// helpers
const sameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const normalize = (t) => {
  const next = t.next_review_date ? new Date(t.next_review_date) : null;
  const last = t.last_reviewed_at ? new Date(t.last_reviewed_at) : null;
  return {
    ...t,
    nextReviewAt: next,
    lastReviewedAt: last,
    nextReviewDate: next ? next.toLocaleDateString() : undefined,
    lastReviewedDate: last ? last.toLocaleDateString() : undefined,
    important: !!t.important,
  };
};

// WeaknessTest Component
function WeaknessTest({ weakness, topicId, onComplete, onCancel }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const generateTest = async () => {
      try {
        const result = await reviewService.generateWeaknessTest(weakness.weakness, topicId);
        setQuestions(result.questions);
        setSessionId(result.sessionId);
        setLoading(false);
      } catch (error) {
        console.error("Error generating weakness test:", error);
        setLoading(false);
      }
    };
    generateTest();
  }, [weakness.weakness, topicId]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await reviewService.submitTest(sessionId, answers);
      onComplete(result);
    } catch (error) {
      console.error("Error submitting test:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Generating Test...</h3>
          <p>Creating questions for: <strong>{weakness.weakness}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Weakness Test</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Focus Area:</strong> {weakness.weakness}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Score above 50% to earn points!
          </p>
        </div>

        {questions.map((question, index) => (
          <div key={question.id} className="mb-6 p-4 border rounded-lg">
            <h4 className="font-medium mb-3">
              {index + 1}. {question.question}
            </h4>
            <div className="space-y-2">
              {question.options.map((option, optIndex) => {
                const optionLetter = ['a', 'b', 'c', 'd'][optIndex];
                return (
                  <label key={optionLetter} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value={optionLetter}
                      checked={answers[question.id] === optionLetter}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>{optionLetter.toUpperCase()}. {option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
            className={`px-6 py-2 rounded-lg text-white ${
              submitting || Object.keys(answers).length < questions.length
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}

// TestResult Component
function TestResult({ result, onClose, onClaimPoints }) {
  const [claimingPoints, setClaimingPoints] = useState(false);

  const handleClaimPoints = async () => {
    setClaimingPoints(true);
    try {
      await onClaimPoints();
    } finally {
      setClaimingPoints(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Test Results</h3>
        
        <div className="text-center mb-4">
          <div className={`text-4xl font-bold ${result.score >= 50 ? 'text-green-500' : 'text-red-500'}`}>
            {result.score}%
          </div>
          <p className="text-gray-600 mt-1">
            {result.isWeaknessTest && result.targetWeakness && (
              <span className="block text-sm">Focus: {result.targetWeakness}</span>
            )}
          </p>
        </div>

        {result.isWeaknessTest && result.pointsEarned > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-center text-green-800 font-semibold">
              Congratulations! You earned {result.pointsEarned} points!
            </p>
            <button
              onClick={handleClaimPoints}
              disabled={claimingPoints}
              className={`w-full mt-3 px-4 py-2 rounded-lg text-white ${
                claimingPoints
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {claimingPoints ? 'Claiming...' : 'Claim Points'}
            </button>
          </div>
        )}

        {result.isWeaknessTest && result.score <= 50 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-center text-yellow-800">
              Keep practicing! Score above 50% to earn points on weakness tests.
            </p>
          </div>
        )}

        {result.weaknesses && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Areas for improvement:</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {result.weaknesses}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [topics, setTopics] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weaknessesLoading, setWeaknessesLoading] = useState(false);

  const [dueFilter, setDueFilter] = useState("None");
  const [riskFilter, setRiskFilter] = useState("None");
  const [activeCategory, setActiveCategory] = useState(null);

  const [showWeaknessTest, setShowWeaknessTest] = useState(false);
  const [selectedWeakness, setSelectedWeakness] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showWeaknesses, setShowWeaknesses] = useState(false);

  const user = useSelector((s) => s.user.user);
  const query = useSelector((s) => s.search.topicQuery);
  const dispatch = useDispatch();

  // Single source of truth: fetcher used by both effects and TopicCard
  const refreshTopics = useCallback(async () => {
    if (!user?.$id) return;

    try {
      const res = query.trim()
        ? await topicService.searchTopics(user.$id, query)
        : await topicService.getUserTopics(user.$id);

      setTopics((res?.documents || []).map(normalize));
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [user?.$id, query]);

  // Load user weaknesses
  const loadWeaknesses = useCallback(async () => {
    if (!user?.$id) return;

    setWeaknessesLoading(true);
    try {
      const userWeaknesses = await reviewService.getUserWeaknesses(user.$id);
      setWeaknesses(userWeaknesses);
    } catch (error) {
      console.error("Error loading weaknesses:", error);
      setWeaknesses([]);
    } finally {
      setWeaknessesLoading(false);
    }
  }, [user?.$id]);

  // Initial load + react to search changes (debounced)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await refreshTopics();
    };

    // Debounce only when query changes; still runs on mount
    const id = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [refreshTopics]);

  // Load weaknesses on mount
  useEffect(() => {
    loadWeaknesses();
  }, [loadWeaknesses]);

  const handleWeaknessClick = (weakness) => {
    setSelectedWeakness(weakness);
    setShowWeaknessTest(true);
  };

  const handleTestComplete = (result) => {
    setShowWeaknessTest(false);
    setTestResult(result);
    // Refresh weaknesses to update counts/scores
    loadWeaknesses();
  };

  const handleClaimPoints = async () => {
    if (testResult && testResult.sessionId) {
      try {
        await reviewService.claimPoints(testResult.sessionId);
        setTestResult(null);
      } catch (error) {
        console.error("Error claiming points:", error);
        alert("Failed to claim points. Please try again.");
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  const today = new Date();
  const dueToday = topics.filter(
    (t) => t.nextReviewAt && sameDay(t.nextReviewAt, today)
  );
  const atRisk = topics.filter((t) => t.status === "due");

  const mastered = topics.filter((t) => t.status === "mastered");
  const learning = topics.filter((t) => t.status === "learning");
  const forgotten = topics.filter((t) => t.status === "forgotten");

  // filters
  const applyFilter = (list, filter) => {
    let arr = [...list];
    if (filter === "ImportantOnly") arr = arr.filter((t) => t.important);
    else if (filter === "NotImportant") arr = arr.filter((t) => !t.important);
    else if (filter === "Newest")
      arr.sort(
        (a, b) =>
          (b.nextReviewAt?.getTime() ?? 0) - (a.nextReviewAt?.getTime() ?? 0)
      );
    else if (filter === "Oldest")
      arr.sort(
        (a, b) =>
          (a.nextReviewAt?.getTime() ?? 0) - (b.nextReviewAt?.getTime() ?? 0)
      );
    return arr;
  };

  const resetSearch = () => {
    dispatch(clearTopicQuery());
  };
  const isSearching = query.trim().length > 0;

  const getActiveList = () => {
    if (activeCategory === "mastered") return mastered;
    if (activeCategory === "learning") return learning;
    if (activeCategory === "forgotten") return forgotten;
    return null;
  };
  const activeList = getActiveList();

  return (
    <div className="flex gap-6 p-6">
      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-6">
        {isSearching ? (
          <>
            {topics.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => (
                  <TopicCard
                    key={topic.$id}
                    topic={topic}
                    refreshTopics={refreshTopics} // ✅ pass fetcher
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No topics found</p>
            )}
            <div className="flex justify-center mt-4">
              <button
                onClick={resetSearch}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Back
              </button>
            </div>
          </>
        ) : activeCategory ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold capitalize">
                {activeCategory} Topics
              </h2>
              <button
                onClick={() => setActiveCategory(null)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                Back to Dashboard
              </button>
            </div>
            {activeList?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeList.map((topic) => (
                  <TopicCard
                    key={topic.$id}
                    topic={topic}
                    refreshTopics={refreshTopics} // ✅ pass fetcher
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No topics in this category</p>
            )}
          </>
        ) : showWeaknesses ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Weaknesses</h2>
              <button
                onClick={() => setShowWeaknesses(false)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                Back to Dashboard
              </button>
            </div>
            
            {weaknessesLoading ? (
              <p className="text-gray-500">Loading weaknesses...</p>
            ) : weaknesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weaknesses.map((weakness, index) => (
                  <div
                    key={index}
                    onClick={() => handleWeaknessClick(weakness)}
                    className="p-4 bg-white border rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {weakness.weakness}
                      </h3>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        {weakness.count}x
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Average Score: <span className="font-medium">{weakness.averageScore}%</span></p>
                      <p>Last Seen: {new Date(weakness.lastSeen).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                      Click to take a targeted test and earn points!
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No weaknesses found!</p>
                <p className="text-sm text-gray-400">
                  Complete some tests to identify areas for improvement.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Due Today */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Due Today</h2>
                <select
                  value={dueFilter}
                  onChange={(e) => setDueFilter(e.target.value)}
                  className="border p-1 rounded"
                >
                  <option value="None">No Filter</option>
                  <option value="ImportantOnly">Important only</option>
                  <option value="NotImportant">Not important</option>
                  <option value="Newest">Newest first</option>
                  <option value="Oldest">Oldest first</option>
                </select>
              </div>
              {applyFilter(dueToday, dueFilter).length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applyFilter(dueToday, dueFilter).map((topic) => (
                    <TopicCard
                      key={topic.$id}
                      topic={topic}
                      refreshTopics={refreshTopics} // ✅ pass fetcher
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No topics for today</p>
              )}
            </div>

            {/* Topics at Risk */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Topics at Risk</h2>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="border p-1 rounded"
                >
                  <option value="None">No Filter</option>
                  <option value="ImportantOnly">Important only</option>
                  <option value="NotImportant">Not important</option>
                  <option value="Newest">Newest first</option>
                  <option value="Oldest">Oldest first</option>
                </select>
              </div>
              {applyFilter(atRisk, riskFilter).length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applyFilter(atRisk, riskFilter).map((topic) => (
                    <TopicCard
                      key={topic.$id}
                      topic={topic}
                      refreshTopics={refreshTopics} // ✅ pass fetcher
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No topics at risk</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Column → Categories and Weaknesses */}
      {!isSearching && !activeCategory && !showWeaknesses && (
        <div className="w-80 flex flex-col gap-4">
          {/* Weaknesses Section */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Your Weaknesses</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-gray-700 text-sm mb-3">
              {weaknesses.length} areas need attention
            </p>
            <button
              onClick={() => setShowWeaknesses(true)}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 text-sm font-medium"
            >
              Practice & Earn Points
            </button>
          </div>

          {/* Category Buttons */}
          <button
            onClick={() => setActiveCategory("mastered")}
            className="bg-green-100 p-4 rounded-lg shadow hover:bg-green-200 text-left"
          >
            <h3 className="font-semibold text-lg">Mastered</h3>
            <p className="text-gray-700">{mastered.length} topics</p>
          </button>
          <button
            onClick={() => setActiveCategory("learning")}
            className="bg-yellow-100 p-4 rounded-lg shadow hover:bg-yellow-200 text-left"
          >
            <h3 className="font-semibold text-lg">Learning</h3>
            <p className="text-gray-700">{learning.length} topics</p>
          </button>
          <button
            onClick={() => setActiveCategory("forgotten")}
            className="bg-red-100 p-4 rounded-lg shadow hover:bg-red-200 text-left"
          >
            <h3 className="font-semibold text-lg">Forgotten</h3>
            <p className="text-gray-700">{forgotten.length} topics</p>
          </button>
        </div>
      )}

      {/* Weakness Test Modal */}
      {showWeaknessTest && selectedWeakness && (
        <WeaknessTest
          weakness={selectedWeakness}
          topicId={selectedWeakness.topicId}
          onComplete={handleTestComplete}
          onCancel={() => setShowWeaknessTest(false)}
        />
      )}

      {/* Test Result Modal */}
      {testResult && (
        <TestResult
          result={testResult}
          onClose={() => setTestResult(null)}
          onClaimPoints={handleClaimPoints}
        />
      )}
    </div>
  );
}
