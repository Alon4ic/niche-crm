import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DealsListPage } from "./pages/DealsListPage";
import { ClientsPage } from "./pages/ClientsPage";
import { StockItemsPage } from "./pages/StockItemsPage";
import { DealDetailPage } from "./pages/DealDetailPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/deals", element: <DealsListPage /> },
      { path: "/deals/:id", element: <DealDetailPage /> },
      { path: "/clients", element: <ClientsPage /> },
      { path: "/stock-items", element: <StockItemsPage /> },
      { path: "/", element: <Navigate to="/deals" replace /> },
    ],
  },
]);
