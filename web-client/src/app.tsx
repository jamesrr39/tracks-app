import "./app.css";
import TracksGallery from "./ui/TracksGallery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import a, { ErrorBoundary, LocationProvider, Route, Router } from "preact-iso";

const queryClient = new QueryClient();

const NotFound = () => (
  <div>
    <p>Page not found</p>
    <p>
      <a href="/">Home</a>
    </p>
  </div>
);

const Track = (props: { params: { id: string } }) => {
  console.log("track props", props);
  return <p>fetching track {props.params.id}</p>;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <LocationProvider>
          <ErrorBoundary>
            <Router>
              <TracksGallery path="/" />
              {/* Alternative dedicated route component for better TS support */}
              <Route path="/tracks/:id" component={Track} />
              {/* `default` prop indicates a fallback route. Useful for 404 pages */}
              <NotFound default />
            </Router>
          </ErrorBoundary>
        </LocationProvider>
      </div>
    </QueryClientProvider>
  );
}
