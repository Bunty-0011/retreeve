// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import UserDashboard from "./pages/UserDashboard";
import AddTopic from "./pages/AddTopic";
import SearchTopics from "./pages/SearchTopics";
import MyTopics from "./pages/MyTopics";
import TopicDetail from "./pages/TopicDetail";
import EditTopic from "./pages/EditTopic";
import Notes from "./pages/Notes";
import TestPage from "./pages/TestPage";

// Components
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/add-topic"
          element={
            <PrivateRoute>
              <AddTopic />
            </PrivateRoute>
          }
        />

        <Route
          path="/search"
          element={
            <PrivateRoute>
              <SearchTopics />
            </PrivateRoute>
          }
        />

        <Route
          path="/mytopics"
          element={
            <PrivateRoute>
              <MyTopics />
            </PrivateRoute>
          }
        />

        {/* ✅ Dynamic Topic Detail Route */}
        <Route
          path="/topic/:id"
          element={
            <PrivateRoute>
              <TopicDetail />
            </PrivateRoute>
          }
        />

        {/* ✅ Edit Topic */}
        <Route
          path="/topic/edit/:id"
          element={
            <PrivateRoute>
              <EditTopic />
            </PrivateRoute>
          }
        />

        {/* ✅ Notes Page */}
        <Route
          path="/notes/:id"
          element={
            <PrivateRoute>
              <Notes />
            </PrivateRoute>
          }
        />

        {/* ✅ Test Page (Take Test Flow) */}
        <Route
          path="/topics/:id/test"
          element={
            <PrivateRoute>
              <TestPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
