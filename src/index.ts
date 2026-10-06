// ZaUI stylesheet
import "zmp-ui/zaui.css";
// Tailwind stylesheet
import "@/css/tailwind.scss";
// Your stylesheet
import "@/css/fonts.css";
import "@/css/app.scss";
import "@/css/restaurant.scss";

// React core
import React from "react";
import { createRoot } from "react-dom/client";

// Mount the app
import MiniApp from "./app";
import { API_BASE_URL } from "./services/apiClient";
console.log("[APP API BASE URL]", API_BASE_URL || "development same-origin proxy");

// Expose app configuration
import appConfig from "../app-config.json";

if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig as any;
}

const root = createRoot(document.getElementById("app")!);
root.render(React.createElement(MiniApp));
