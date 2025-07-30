import { useState, useEffect } from "react";
// NUEVO: Importar iconsax-reactjs
import { Home2, Devices, Setting2, Code, Hierarchy3 } from "iconsax-reactjs";
// import { Monitor, Smartphone, FileText, Settings } from "lucide-react"; // Ya no se usa
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import Dashboard from "./components/Dashboard";
import PhoneSelector from "./components/PhoneSelector";
import LogsViewer from "./components/LogsViewer";
import Configuration from "./components/Configuration";
import WorkflowBuilder from "./components/WorkflowBuilder";

type Page = "dashboard" | "phones" | "logs" | "config" | "workflows";

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
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (active: boolean) => (
        <Home2 size={24} color={active ? "#2563eb" : "#64748b"} variant={active ? "Bulk" : "Outline"} />
      ),
    },
    {
      id: "phones",
      label: "Devices",
      icon: (active: boolean) => (
        <Devices size={24} color={active ? "#2563eb" : "#64748b"} variant={active ? "Bulk" : "Outline"} />
      ),
    },
    {
      id: "workflows",
      label: "Workflows",
      icon: (active: boolean) => (
        <Hierarchy3 size={24} color={active ? "#2563eb" : "#64748b"} variant={active ? "Bulk" : "Outline"} />
      ),
    },
    {
      id: "logs",
      label: "Logs",
      icon: (active: boolean) => (
        <Code size={24} color={active ? "#2563eb" : "#64748b"} variant={active ? "Bulk" : "Outline"} />
      ),
    },
    {
      id: "config",
      label: "Config",
      icon: (active: boolean) => (
        <Setting2 size={24} color={active ? "#2563eb" : "#64748b"} variant={active ? "Bulk" : "Outline"} />
      ),
    },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard toast={toast} />;
      case "phones":
        return <PhoneSelector toast={toast} />;
      case "workflows":
        return <WorkflowBuilder toast={toast} />;
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
          <div className="flex items-center space-x-3"></div>
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
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                  currentPage === item.id
                    ? "bg-blue-50 text-blue-600 border border-blue-200 desktop-card"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {item.icon(currentPage === item.id)}
                <span className="ml-3">{item.label}</span>
              </button>
            ))}
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
