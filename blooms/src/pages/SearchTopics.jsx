import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import topicService from "../appwrite/topic_service";
import TopicCard from "../components/TopicCard";

export default function SearchTopics() {
  const location = useLocation();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useSelector((state) => state.user.user); // ✅ logged-in user

  // Extract search query from URL
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = (queryParams.get("q") || "").trim().toLowerCase();

  useEffect(() => {
    const fetchTopics = async () => {
      if (!searchTerm || !user?.$id) {
        setTopics([]);
        setLoading(false);
        return;
      }

      try {
        console.log("🔎 Searching for:", searchTerm, "by user:", user.$id);
        const res = await topicService.searchTopics(user.$id, searchTerm);
      
        console.log("✅ Raw search response:", res);
      
        if (Array.isArray(res)) {
          setTopics(res);
        } else if (res?.documents && Array.isArray(res.documents)) {
          setTopics(res.documents);
        } else {
          setTopics([]);
        }
      } catch (error) {
        console.error("❌ Error searching topics:", error);
        setTopics([]);
      } finally {
        setLoading(false);
      }
      
    };

    fetchTopics();
  }, [searchTerm, user]);

  const handleReset = () => {
    navigate("/dashboard");
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Search Results for "{searchTerm}"
      </h1>

      {topics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <TopicCard key={topic.$id} topic={topic} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No topics found.</p>
      )}

      <button
        onClick={handleReset}
        className="mt-6 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Back
      </button>
    </div>
  );
}
