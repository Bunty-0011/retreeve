import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import TopicCard from "../components/TopicCard";
import topicService from "../appwrite/topic_service";
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

export default function UserDashboard() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dueFilter, setDueFilter] = useState("None");
  const [riskFilter, setRiskFilter] = useState("None");
  const [activeCategory, setActiveCategory] = useState(null);

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

      {/* Right Column → Categories only */}
      {!isSearching && !activeCategory && (
        <div className="w-80 flex flex-col gap-6">
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
    </div>
  );
}