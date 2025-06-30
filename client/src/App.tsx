import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import AnimeDetail from "./pages/AnimeDetail";
import Search from "./pages/Search";
import CustomAnime from "./pages/CustomAnime";
import Notifications from "./pages/Notifications";
import PageTransition from "./components/PageTransition";
import { NotificationProvider } from "./contexts/NotificationContext";

const AppContent: React.FC = () => {
  return (
    <NotificationProvider>
      <div
        className="min-h-screen transition-all duration-1500 ease-in-out"
        style={{
          background:
            "linear-gradient(180deg, #08221B 0%, #000000 50%, #000000 100%)",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/search"
              element={
                <PageTransition>
                  <Search />
                </PageTransition>
              }
            />
            <Route
              path="/anime/:id"
              element={
                <PageTransition>
                  <AnimeDetail />
                </PageTransition>
              }
            />
            <Route
              path="/custom"
              element={
                <PageTransition>
                  <CustomAnime />
                </PageTransition>
              }
            />
            <Route
              path="/notifications"
              element={
                <PageTransition>
                  <Notifications />
                </PageTransition>
              }
            />
          </Routes>
        </main>
      </div>
    </NotificationProvider>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
