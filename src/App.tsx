
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import CompanyDetail from "./pages/CompanyDetail";
import ProjectsOverview from "./pages/ProjectsOverview";
import ProjectDetail from "./pages/ProjectDetail";
import SnapshotDetail from "./pages/SnapshotDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/company/:companyId" element={<CompanyDetail />} />
          <Route path="/projects" element={<ProjectsOverview />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/snapshots/:snapshotId" element={<SnapshotDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
