import "./app.css";
import TrackDetail from "./ui/detail/TrackDetail";
import TracksGallery from "./ui/listing/TracksGallery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, LocationProvider, Route, Router } from "preact-iso";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    }
  }
});

const NotFound = () => (
  <div>
    <p>Page not found</p>
    <p>
      <a href="/">Home</a>
    </p>
  </div>
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <ErrorBoundary>
          <div className="container">
          <Router>
            <TracksGallery path="/" />
            {/* Alternative dedicated route component for better TS support */}
            <Route path="/tracks/:id" component={TrackDetail} />
            {/* `default` prop indicates a fallback route. Useful for 404 pages */}
            <NotFound default />
          </Router>
          </div>
        </ErrorBoundary>
      </LocationProvider>
    </QueryClientProvider>
  );
}
