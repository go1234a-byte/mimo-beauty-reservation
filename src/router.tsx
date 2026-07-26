import { Navigate } from "react-router-dom";
import { MimoRootLayout } from "./components/mimo/layout/MimoRootLayout";
import MimoHome from "./pages/mimo/MimoHome";
import MimoSalonDetail from "./pages/mimo/MimoSalonDetail";
import MimoCheckout from "./pages/mimo/MimoCheckout";
import MimoSuccess from "./pages/mimo/MimoSuccess";
import MimoBookings from "./pages/mimo/MimoBookings";
import MimoFavorites from "./pages/mimo/MimoFavorites";
import MimoMyPage from "./pages/mimo/MimoMyPage";
import { MimoManagerProviderLayout } from "./components/mimo/manager/MimoManagerProviderLayout";
import { MimoManagerProtectedLayout } from "./components/mimo/manager/MimoManagerProtectedLayout";
import MimoManagerLogin from "./pages/mimo/manager/MimoManagerLogin";
import MimoManagerSignup from "./pages/mimo/manager/MimoManagerSignup";
import MimoManagerSalonSetup from "./pages/mimo/manager/MimoManagerSalonSetup";
import MimoManagerDashboard from "./pages/mimo/manager/MimoManagerDashboard";
import MimoManagerReservations from "./pages/mimo/manager/MimoManagerReservations";
import MimoManagerSalonEdit from "./pages/mimo/manager/MimoManagerSalonEdit";
import MimoManagerMyPage from "./pages/mimo/manager/MimoManagerMyPage";

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
      {
        path: "manager",
        element: <MimoManagerProviderLayout />,
        children: [
          { path: "login", element: <MimoManagerLogin /> },
          { path: "signup", element: <MimoManagerSignup /> },
          { path: "salon-setup", element: <MimoManagerSalonSetup /> },
          {
            element: <MimoManagerProtectedLayout />,
            children: [
              { index: true, element: <MimoManagerDashboard /> },
              { path: "reservations", element: <MimoManagerReservations /> },
              { path: "salon", element: <MimoManagerSalonEdit /> },
              { path: "mypage", element: <MimoManagerMyPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/mimo" replace />,
  },
];
