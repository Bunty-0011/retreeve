// src/pages/Notes.jsx
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import notesService from "../appwrite/notes_service";
import RTE from "../components/RTE";

export default function Notes() {
  const { id } = useParams(); // topic id
  const navigate = useNavigate();
  const lastSavedRef = useRef(null);

  const { register, handleSubmit, control, setValue, watch, getValues } = useForm({
    defaultValues: { notes: "" },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load notes
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { notes: html } = await notesService.getNotes(id);
        if (!active) return;
        setValue("notes", html || "");
      } catch (e) {
        console.error("Failed to load notes", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, setValue]);

  // Auto-save function
  const handleAutoSave = async (html) => {
    try {
      await notesService.saveNotes(id, html);
      lastSavedRef.current = new Date();
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  };

  // Manual save
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await notesService.saveNotes(id, data.notes);
      lastSavedRef.current = new Date();
      navigate(`/topic/${id}`);
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading notes…</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Edit Notes</h1>

      {/* Pass control to RTE */}
      <RTE
        label="Notes :"
        name="notes"
        control={control}
        defaultValue={getValues("notes")}
        onAutoSave={(html) => handleAutoSave(html)}
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {lastSavedRef.current && (
          <span className="text-sm text-gray-600">
            Last saved: {lastSavedRef.current.toLocaleTimeString()}
          </span>
        )}
      </div>
    </form>
  );
}
