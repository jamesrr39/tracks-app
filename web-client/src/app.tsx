import "./app.css";
import TrackDetail from "./ui/detail/TrackDetail";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, LocationProvider, Route, Router, useLocation } from "preact-iso";
import TracksGalleryScreen from "./ui/listing/TracksGalleryScreen";
import { useEffect } from "preact/hooks";

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
            <Route path="/tracks" component={TracksGalleryScreen} />
            <Route path="/tracks/:id" component={TrackDetail} />
            <Route path="/" component={() => <Redirect to={"/tracks"} />} />
            <NotFound default />
          </Router>
          </div>
        </ErrorBoundary>
      </LocationProvider>
    </QueryClientProvider>
  );
}

function Redirect({to}: {to: string}) {
  const {route} = useLocation();

  useEffect(() => route(to));
  return null;
}

