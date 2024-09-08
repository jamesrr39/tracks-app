import "./app.css";
import TrackDetail from "./ui/TrackDetail";
import TracksGallery from "./ui/TracksGallery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, LocationProvider, Route, Router } from "preact-iso";

const queryClient = new QueryClient();

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
      <div>
        <LocationProvider>
          <ErrorBoundary>
            <Router>
              <TracksGallery path="/" />
              {/* Alternative dedicated route component for better TS support */}
              <Route path="/tracks/:id" component={TrackDetail} />
              {/* `default` prop indicates a fallback route. Useful for 404 pages */}
              <NotFound default />
            </Router>
          </ErrorBoundary>
        </LocationProvider>
      </div>
    </QueryClientProvider>
  );
}
