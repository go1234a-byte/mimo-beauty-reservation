import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import { routers } from "./router";

const queryClient = new QueryClient();

const App = () => {
  const router = createBrowserRouter(routers);
  return (
    <ChunkErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Sonner />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ChunkErrorBoundary>
  );
};

export default App;
