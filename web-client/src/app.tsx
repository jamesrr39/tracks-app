import "./app.css";
import TrackDetail from "./ui/detail/TrackDetail";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, LocationProvider, Route, Router, useLocation } from "preact-iso";
import TracksGalleryScreen from "./ui/listing/TracksGalleryScreen";
import { useEffect } from "preact/hooks";
import { AppInfoContext } from "./context/AppInfoContext";
import { useGetServiceInfo } from "./openapi/generated/tracksAppComponents";
import Error from "./ui/Error";
import Loading from "./ui/Loading";
import CustomMaps from "./ui/map/CustomMaps";
import SideBySideEditCustomMap from "./ui/map/SideBySideEditCustomMap";
import HomeScreen from "./ui/HomeScreen";
import EditCustomMapScreen from "./ui/map/EditCustomMapScreen";

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
          <LoadedApp />
        </ErrorBoundary>
      </LocationProvider>
    </QueryClientProvider>
  );
}

function LoadedApp() {
    const {data, isLoading, error} = useGetServiceInfo({});
  if (error) {
    return <Error />
  }

  if (isLoading) {
    return <Loading />
  }

  if (!data) {
    return null
  }


  return (
    <AppInfoContext.Provider value={data} >
      <div className="container">
        <Router>
          <Route path="/tracks" component={TracksGalleryScreen} />
          <Route path="/tracks/:id" component={TrackDetail} />
          <Route path="/maps" component={CustomMaps} />
          <Route path="/maps/:name" component={EditCustomMapScreen} />
          <Route path="/" component={HomeScreen} />
          <NotFound default />
        </Router>
      </div>
    </AppInfoContext.Provider>
  );
}

function Redirect({to}: {to: string}) {
  const {route} = useLocation();

  useEffect(() => route(to));
  return null;
}

