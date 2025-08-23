import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import topicService from "../appwrite/topic_service";
import TopicCard from "../components/TopicCard";
import spaceService from "../appwrite/space_service";
import { Link } from "react-router-dom";

const normalize = (t) => ({
  ...t,
  lastReviewedAt:
    t.lastReviewedAt ??
    (t.last_reviewed_at
      ? new Date(t.last_reviewed_at).toLocaleDateString()
      : undefined),
  nextReviewDate:
    t.nextReviewDate ??
    (t.next_review_date
      ? new Date(t.next_review_date).toLocaleDateString()
      : undefined),
  status: t.status ?? spaceService.getStatus?.(t) 
});

export default function MyTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    let active = true;
    const loadTopics = async () => {
      if (!user?.$id) {
        setTopics([]);
        setLoading(false);
        return;
      }
      try {
        const res = await topicService.getUserTopics(user.$id);
        const docs = res?.documents ?? [];
        if (!active) return;
        setTopics(docs.map(normalize));
      } catch (err) {
        console.error("Error loading topics:", err);
        setTopics([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTopics();
    return () => {
      active = false;
    };
  }, [user]);

  // Updated filtering to support "Important" as a separate attribute
  const filteredTopics = topics.filter((t) => {
    if (filter === "All") return true;
    if (filter === "Important") return t.important === true;
    return t.status?.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return <div className="p-6">Loading your topics...</div>;
  }

  if (topics.length === 0) {
    return <div className="p-6">No topics found</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Topics</h1>
        {/* Filter dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="All">All</option>
          <option value="Learning">Learning</option>
          <option value="Mastered">Mastered</option>
          <option value="Forgotten">Forgotten</option>
          <option value="Important">Important</option>
        </select>
      </div>

      {filteredTopics.length === 0 ? (
        <div className="p-6">No topics found for this filter</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTopics.map((topic) => (
  <Link key={topic.$id} to={`/topic/${topic.$id}`}>
    <TopicCard topic={topic} />
  </Link>
))}
        </div>
      )}
    </div>
  );
}
