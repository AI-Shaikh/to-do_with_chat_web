import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Check, 
  Edit, 
  Clock, 
  CheckCircle, 
  CalendarCheck,
  Loader2 
} from "lucide-react";

const TodoPage = () => {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    alarmTime: "",
  });
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Check initial Google connection status
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const res = await axiosInstance.get("/auth/profile");
        setIsGoogleConnected(!!res.data.googleTokens);
      } catch (error) {
        console.error("Error checking Google connection:", error);
      } finally {
        setLoading(false);
      }
    };
    checkGoogleConnection();
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const googleConnected = searchParams.get("google_connected");
    const googleError = searchParams.get("google_error");

    if (googleConnected) {
      toast.success("Google Calendar connected successfully!");
      setIsGoogleConnected(true);
      window.history.replaceState({}, document.title, "/todo");
    } else if (googleError) {
      toast.error(`Google connection failed: ${googleError}`);
      window.history.replaceState({}, document.title, "/todo");
    }
  }, [searchParams]);

  // Fetch todos
  const fetchTodos = async () => {
    try {
      const res = await axiosInstance.get("/todos");
      setTodos(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load todos");
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // Create new todo
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.alarmTime && !isGoogleConnected) {
      toast.error("Please connect Google Calendar to set reminders");
      return;
    }

    try {
      const res = await axiosInstance.post("/todos", {
        ...form,
        alarmTime: form.alarmTime || undefined
      });
      
      setTodos([...todos, res.data]);
      setForm({ title: "", description: "", alarmTime: "" });
      
      if (form.alarmTime) {
        toast.success("Todo created with Google Calendar event!");
      } else {
        toast.success("Todo created!");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create todo";
      toast.error(errorMessage);
      
      if (error.response?.data?.googleError) {
        toast.error("Google Calendar event creation failed");
      }
    }
  };

  // Google connection handler
  const handleGoogleConnection = async () => {
    if (isGoogleConnected) {
      try {
        await axiosInstance.post("/google/disconnect");
        setIsGoogleConnected(false);
        toast.success("Google Calendar disconnected");
      } catch (error) {
        toast.error("Failed to disconnect Google Calendar");
      }
    } else {
      try {
        const res = await axiosInstance.get("/google/auth-url");
        window.location.href = res.data.url;
      } catch (error) {
        toast.error("Failed to connect Google Calendar");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center p-6 sm:p-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2 group">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Check className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mt-2">My Todo List</h1>
            <p className="text-base-content/60">Organize your tasks efficiently</p>
          </div>
        </div>

        {/* Google Connection */}
        <div className="flex justify-end">
          <button
            onClick={handleGoogleConnection}
            className={`btn btn-sm gap-2 ${
              isGoogleConnected 
                ? "btn-success" 
                : "btn-outline hover:btn-primary"
            }`}
          >
            {isGoogleConnected ? (
              <>
                <CalendarCheck className="size-4" />
                Connected to Google
              </>
            ) : (
              "Connect Google Calendar"
            )}
          </button>
        </div>

        {/* Todo Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Title</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Edit className="size-5 text-base-content/40" />
              </div>
              <input
                type="text"
                className="input input-bordered w-full pl-10"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              placeholder="Task details"
              className="textarea textarea-bordered w-full"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                Reminder
                {!isGoogleConnected && form.alarmTime && (
                  <span className="text-xs text-error ml-2">
                    (Connect Google Calendar to enable)
                  </span>
                )}
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="size-5 text-base-content/40" />
              </div>
              <input
                type="datetime-local"
                className="input input-bordered w-full pl-10"
                value={form.alarmTime}
                onChange={(e) => setForm({ ...form, alarmTime: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full gap-2"
          >
            <Check className="size-4" />
            Add Todo
          </button>
        </form>

        {/* Todo List */}
        <div className="space-y-4">
          {todos.map((todo) => (
            <div 
              key={todo._id} 
              className="border rounded-lg p-4 hover:bg-base-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckCircle className="size-5 text-primary/70" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{todo.title}</h3>
                  {todo.description && (
                    <p className="text-base-content/80 mt-1">{todo.description}</p>
                  )}
                  {todo.alarmTime && (
                    <p className="text-sm text-base-content/60 mt-2 flex items-center gap-1">
                      <Clock className="size-4" />
                      {new Date(todo.alarmTime).toLocaleString()}
                      {/* Google Calendar Status Indicator */}
                      {todo.googleEventId && (
                        <span className="text-xs text-success ml-2">
                          (Added to Google Calendar)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodoPage;