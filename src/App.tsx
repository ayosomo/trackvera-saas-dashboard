import { RouterProvider } from "react-router-dom";
import { appRouter } from "./app/router";
import { AuthProvider } from "./security/AuthProvider";

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={appRouter} />
    </AuthProvider>
  );
}
