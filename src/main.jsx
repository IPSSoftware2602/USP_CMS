import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/scss/app.scss";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import SessionRoot from "./SessionRoot";

import "./server";

const localToken = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user")).token
  : null;
const sessionToken = sessionStorage.getItem("token");

if (!sessionToken && localToken) {
  window.location.reload();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/cms">
    <Provider store={store}>
      <SessionRoot>
        <App />
      </SessionRoot>
    </Provider>
  </BrowserRouter>
);
