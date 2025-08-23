import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import topicService from '../appwrite/topic_service';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AddTopic() {
  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const user = useSelector((state) => state.user.user);
  const userId = user?.$id;

  const onSubmit = async (data) => {
    try {
      setError(null);

      const now = new Date();
      const newTopic = {
        title: data.title,
        description: data.description || "",
        userId: userId,
        lastReviewedAt: now.toISOString(),
        nextReviewDate: now.toISOString(),
        reviewCount: 0
      };

      const createdTopic = await topicService.createTopic(newTopic);

      reset();


      navigate('/dashboard');
    } catch (err) {
      console.error("Error adding topic:", err);
      setError("Failed to add topic. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Add New Topic</h2>

      {error && (
        <p className="text-red-500 text-sm mb-3">{error}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input
            {...register('title', { required: true })}
            className="w-full border rounded p-2"
            placeholder="Enter topic title"
          />
        </div>

        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            {...register('description')}
            className="w-full border rounded p-2"
            placeholder="Enter description"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Topic
        </button>
      </form>
    </div>
  );
}
