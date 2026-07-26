import { Navigate } from "react-router-dom";
import { MimoRootLayout } from "./components/mimo/layout/MimoRootLayout";
import MimoHome from "./pages/mimo/MimoHome";
import MimoSalonDetail from "./pages/mimo/MimoSalonDetail";
import MimoCheckout from "./pages/mimo/MimoCheckout";
import MimoSuccess from "./pages/mimo/MimoSuccess";
import MimoBookings from "./pages/mimo/MimoBookings";
import MimoFavorites from "./pages/mimo/MimoFavorites";
import MimoMyPage from "./pages/mimo/MimoMyPage";

export const routers = [
  {
    path: "/",
    element: <Navigate to="/mimo" replace />,
  },
  {
    path: "/mimo",
    element: <MimoRootLayout />,
    children: [
      { index: true, element: <MimoHome /> },
      { path: "salon/:salonId", element: <MimoSalonDetail /> },
      { path: "checkout/:salonId", element: <MimoCheckout /> },
      { path: "success", element: <MimoSuccess /> },
      { path: "bookings", element: <MimoBookings /> },
      { path: "favorites", element: <MimoFavorites /> },
      { path: "mypage", element: <MimoMyPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/mimo" replace />,
  },
];
