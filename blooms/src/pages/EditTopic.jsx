import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import topicService from "../appwrite/topic_service";

export default function EditTopic() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    important: false,
    status: "learning",
  });

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const data = await topicService.getTopic(id);
        setTopic(data);
        setForm({
          title: data.title,
          important: data.important,
          status: data.status,
        });
      } catch (err) {
        console.error("Error fetching topic:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopic();
  }, [id]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await topicService.updateTopic(id, form);
      alert("Topic updated successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Failed to update topic:", err);
      alert("Failed to update. Try again.");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (!topic) return <p className="p-4 text-red-500">Topic not found</p>;

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded mt-6">
      <h2 className="text-xl font-bold mb-4">Edit Topic</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-medium">Title</span>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="border rounded px-2 py-1"
            required
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="important"
            checked={form.important}
            onChange={handleChange}
          />
          <span>Mark as Important</span>
        </label>

        <label className="flex flex-col">
          <span className="font-medium">Status</span>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          >
            <option value="learning">Learning</option>
            <option value="mastered">Mastered</option>
            <option value="forgotten">Forgotten</option>
          </select>
        </label>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
