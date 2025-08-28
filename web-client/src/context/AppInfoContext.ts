import { createContext } from "preact";
import { HttphandlersInfoResponse } from "../openapi/generated/tracksAppSchemas";

export const AppInfoContext = createContext<HttphandlersInfoResponse|undefined>(undefined);

