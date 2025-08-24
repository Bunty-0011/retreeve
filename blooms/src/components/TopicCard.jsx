import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { statusClasses } from "../utilities/statusColors";
import { FaStar, FaRegStar } from "react-icons/fa";
import topicService from "../appwrite/topic_service";
import reviewService from "../appwrite/review_service"; // ✅ for review updates
import { useSelector } from "react-redux"; // assuming user is stored in Redux

export default function TopicCard({ topic, refreshTopics }) {
  const { $id, title, last_reviewed_at, next_review_date, status } = topic;
  const [isImportant, setIsImportant] = useState(topic.important);
  const [currentStatus, setCurrentStatus] = useState(status);
  const navigate = useNavigate();

  // ✅ get logged-in user from Redux (update if your state is different)
  const user = useSelector((state) => state.user.user);

  // Toggle "important" flag
  const toggleImportant = async (e) => {
    e.stopPropagation();
    try {
      const updated = await topicService.updateTopic($id, {
        important: !isImportant,
      });
      setIsImportant(updated.important);
    } catch (error) {
      console.error("Error updating important flag:", error);
    }
  };

  // Change topic status
  const handleStatusChange = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    setCurrentStatus(newStatus); // Optimistic update

    try {
      // ✅ update status in topic table
      await topicService.updateTopicStatus($id, newStatus);

      // ✅ update review system
      await reviewService.updateReviewData($id, user.$id, {
        status: newStatus,
      });

      // ✅ reload parent topics so the card moves sections
      if (refreshTopics) refreshTopics();

    } catch (err) {
      console.error("Failed to update status:", err);
      setCurrentStatus(status); // revert if error
    }
  };

  // When clicking the card, open TopicDetail page (but ignore button/select clicks)
  const handleCardClick = async (e) => {
    if (
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "SELECT" ||
      e.target.closest("button") ||
      e.target.closest("select")
    ) {
      return; // 🚫 ignore clicks inside buttons/selects
    }

    try {
      await reviewService.updateReviewData($id, user.$id, {
        giveTest: false,
      });
    } catch (err) {
      console.error("Failed to update review data:", err);
    }

    navigate(`/topic/${$id}`);
  };

  // ✅ Delete a topic
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this topic?")) return;

    try {
      await topicService.deleteTopic($id);
      if (refreshTopics) refreshTopics(); // tell parent to reload
    } catch (err) {
      console.error("Failed to delete topic:", err);
    }
  };

  // ✅ Edit a topic (navigate to edit page)
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/topic/edit/${$id}`);
  };

  const colorClasses =
    statusClasses(currentStatus) || statusClasses("learning");

  return (
    <div
      onClick={handleCardClick}
      className={`p-4 rounded shadow cursor-pointer ${colorClasses.badge} ${colorClasses.border} hover:shadow-lg transition-all`}
    >
      <h3 className="font-semibold capitalize">{title}</h3>
      <p className="text-sm">Last reviewed: {last_reviewed_at || "N/A"}</p>
      <p className="text-sm">Next review: {next_review_date || "N/A"}</p>
      <p className="font-medium capitalize">{currentStatus}</p>

      <div className="flex gap-2 mt-2 flex-wrap">
        <button
          onClick={handleEdit}
          className="px-2 py-1 bg-purple-200 hover:bg-purple-300 rounded"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="px-2 py-1 bg-red-200 hover:bg-red-300 rounded"
        >
          Delete
        </button>
        <button onClick={toggleImportant} className="text-yellow-500 text-2xl">
          {isImportant ? <FaStar /> : <FaRegStar />}
        </button>

        <select
          value={currentStatus}
          onChange={handleStatusChange}
          className="border rounded px-2 py-1"
        >
          <option value="learning">Learning</option>
          <option value="mastered">Mastered</option>
          <option value="forgotten">Forgotten</option>
        </select>
      </div>
    </div>
  );
}
