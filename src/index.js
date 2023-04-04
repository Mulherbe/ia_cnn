import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,Link
} from "react-router-dom";
import "./index.css";
import Home from './components/Home'
import HomeNew from './components/HomeNew'

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeNew/>,
  },
  {
    path: "/Home",
    element: <Home/>,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <>

  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>


  </>

);