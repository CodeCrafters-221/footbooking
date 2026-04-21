import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AppLayout() {
  const location = useLocation();

  const hideHeaderRoutes = ["/search", "/compte"];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background-dark overflow-x-hidden flex flex-col">
      {shouldShowHeader && <Header />}

      <main className={`flex-1 flex flex-col ${shouldShowHeader ? "pt-20 md:pt-24" : ""}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <Suspense fallback={<div className="p-6 text-center text-text-secondary">Chargement...</div>}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
