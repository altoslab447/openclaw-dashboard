import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DataProvider>
          <DashboardLayout />
        </DataProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
