import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { AppLayout } from "./components/AppLayout";
import { RegisterPage } from "./pages/RegisterPage";
import { DealsListPage } from "./pages/DealsListPage";
import { ClientsPage } from "./pages/ClientsPage";
import { StockItemsPage } from "./pages/StockItemsPage";
import { DealDetailPage } from "./pages/DealDetailPage";
import { ContactsPage } from "./pages/ContactsPage";
import { RequireRole } from "./components/RequireRole";
import { UsersPage } from "./pages/UsersPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ImportStockItemsPage } from "./pages/ImportStockItemsPage";
import { SettingsPage } from "./pages/Settings";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/deals", element: <DealsListPage /> },
          { path: "/deals/:id", element: <DealDetailPage /> },
          { path: "/clients", element: <ClientsPage /> },
          { path: "/stock-items", element: <StockItemsPage /> },
          { path: "/contacts", element: <ContactsPage /> },
          { path: "/analytics", element: <AnalyticsPage /> },
          {
            element: <RequireRole allowed={["OWNER", "ADMIN"]} />,
            children: [
              { path: "/users", element: <UsersPage /> },
              {
                path: "/import/stock-items",
                element: <ImportStockItemsPage />,
              },
            ],
          },
          {
            element: <RequireRole allowed={["OWNER"]} />,
            children: [{ path: "/settings", element: <SettingsPage /> }],
          },
          { path: "/", element: <Navigate to="/deals" replace /> },
        ],
      },
    ],
  },
]);
