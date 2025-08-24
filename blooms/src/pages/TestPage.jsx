import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import reviewService from "../appwrite/review_service";
import topicService from "../appwrite/topic_service"; //  import service
import conf from "../conf/conf";
import { Databases } from "appwrite";
import { client } from "../appwrite/appwrite";

const databases = new Databases(client);

export default function TestPage() {
  const { id } = useParams(); // topicId
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("pending");

  // 🔹 Fetch session (if exists) or generate new test
  // 🔹 Always generate a new test on load
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const newSession = await reviewService.generateTest(id);
  
        //  Safely handle both stringified JSON and array
        let parsedQ = [];
        try {
          if (typeof newSession?.questions === "string") {
            parsedQ = JSON.parse(newSession.questions);
          } else if (Array.isArray(newSession?.questions)) {
            parsedQ = newSession.questions;
          } else {
            parsedQ = [];
          }
        } catch (e) {
          console.warn("Questions not in valid JSON format, using raw:", e);
          parsedQ = newSession?.questions || [];
        }
  
        setQuestions(parsedQ);
        setSessionId(newSession?.sessionId || null);
        setStatus("pending");
      } catch (err) {
        console.error("Error generating test:", err);
        alert("Failed to load test questions");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);
  


  const handleChange = (qid, value) => {
    if (status === "completed") return;
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async () => {
    if (!sessionId) {
      alert("No session found. Please retry.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await reviewService.submitTest(sessionId, answers);

      setResult(res);
      setStatus("completed");

      //  Append score to topic collection
      await topicService.appendTestResult(id, res.score, res.weaknesses);
    } catch (err) {
      console.error(" Submit error:", err);
      alert("Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/topic/${id}`);
  };

  const handleRetake = async () => {
    try {
      setAnswers({});
      setResult(null);
      setStatus("loading");
  
      const newSession = await reviewService.generateTest(id);
  
      //  Safe parsing like in useEffect
      let parsedQ = [];
      try {
        if (typeof newSession?.questions === "string") {
          parsedQ = JSON.parse(newSession.questions);
        } else if (Array.isArray(newSession?.questions)) {
          parsedQ = newSession.questions;
        } else {
          parsedQ = [];
        }
      } catch (e) {
        console.warn("Questions not in valid JSON format, using raw:", e);
        parsedQ = newSession?.questions || [];
      }
  
      setQuestions(parsedQ);
      setSessionId(newSession?.sessionId || null);
      setStatus("pending");
    } catch (err) {
      console.error("Error regenerating test:", err);
      alert("Failed to retake test");
      setStatus("error");
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Test for Topic {id}
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 w-full rounded-lg bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : !result ? (
        <>
          {questions.length === 0 ? (
            <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
              <p className="font-bold">No Questions</p>
              <p>No test available for this topic yet.</p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div
                key={q.id || index}
                className="mb-4 border rounded-lg shadow-sm p-4 bg-white"
              >
                <p className="font-medium mb-2">
                  Q{index + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options?.map((opt, i) => (
                    <label
                      key={i}
                      className={`flex items-center space-x-2 ${
                        status === "completed" ? "opacity-60" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id || index}
                        value={opt}
                        checked={answers[q.id || index] === opt}
                        onChange={() => handleChange(q.id || index, opt)}
                        className="h-4 w-4"
                        disabled={status === "completed"}
                      />
                      <span>{opt}</span>
                      {status === "completed" && opt === q.answer && (
                        <span className="ml-2 text-green-600 font-medium">
                          (Correct)
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}

          {questions.length > 0 && status !== "completed" && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          )}
        </>
      ) : (
        <div className="p-6 border rounded-lg shadow text-center bg-white">
          <h2 className="text-xl font-semibold mb-2">Your Result</h2>
          <p className="mb-2">
            Score: <span className="font-bold">{result.score}</span>%
          </p>
          <p
            className={`mb-4 font-bold ${
              result.score >= 50 ? "text-green-600" : "text-red-600"
            }`}
          >
            {result.score >= 50 ? "Passed" : " Failed"}
          </p>

          <div className="text-left mb-4">
            <h3 className="font-semibold">Weaknesses:</h3>
            {result.weaknesses && result.weaknesses.trim() !== "" ? (
              <ul className="list-disc pl-6 text-gray-700">
                {result.weaknesses
                  .split(/[,;\n]+/)
                  .map((w, i) => (
                    <li key={i}>{w.trim()}</li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-700">No weaknesses provided.</p>
            )}
          </div>

          <p className="mb-4 text-gray-600">
            Next Review Date:{" "}
            <span className="font-medium">
              {result.nextReviewDate
                ? new Date(result.nextReviewDate).toLocaleDateString()
                : "Not set"}
            </span>
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Back to Topic
            </button>
            <button
              onClick={handleRetake}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Retake Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
