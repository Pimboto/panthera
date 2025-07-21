import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, FileText, Settings } from "lucide-react";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import Dashboard from "./components/Dashboard";
import PhoneSelector from "./components/PhoneSelector";
import LogsViewer from "./components/LogsViewer";
import Configuration from "./components/Configuration";

type Page = "dashboard" | "phones" | "logs" | "config";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [appVersion] = useState("1.0.0");
  const [isElectron, setIsElectron] = useState(false);
  const toast = useToast();

  // Detectar si estamos corriendo en Electron
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (window.electron) {
          setIsElectron(true);

          // Obtener información del sistema
          const systemInfo = await window.appAPI?.getSystemInfo();
          if (systemInfo) {
            console.log("Sistema detectado:", systemInfo);
          }

          // Test del IPC básico
          const response = await window.electron.ipcRenderer.invoke("ping");
          console.log("IPC Test Response:", response);

          // Mostrar notificación de bienvenida
          window.appAPI?.notifications.show(
            "iOS Automation Control Center",
            "Application loaded successfully",
            "success"
          );
        } else {
          console.log("Ejecutándose en navegador web");
          toast.showInfo(
            "Web Mode",
            "Running in browser (limited functionality)"
          );
        }
      } catch (error) {
        console.error("Error al inicializar Electron APIs:", error);
        toast.showError("Initialization Error", "Could not load Electron APIs");
      }
    };

    initializeApp();
  }, []);

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: Monitor },
    { id: "phones", label: "Devices", icon: Smartphone },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "config", label: "Config", icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard toast={toast} />;
      case "phones":
        return <PhoneSelector toast={toast} />;
      case "logs":
        return <LogsViewer toast={toast} />;
      case "config":
        return <Configuration toast={toast} />;
      default:
        return <Dashboard toast={toast} />;
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col desktop-window">
      {/* Title Bar */}
      <div className="title-bar flex items-center justify-between px-6 py-3 h-14">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3">
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isElectron && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">
                Desktop
              </span>
            </div>
          )}
          <div className="text-xs text-gray-500">v{appVersion}</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-52 desktop-sidebar p-5">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as Page)}
                  className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-600 border border-blue-200 desktop-card"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 desktop-content p-8 overflow-auto">
          {renderPage()}
          <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        </div>
      </div>
    </div>
  );
}

export default App;
