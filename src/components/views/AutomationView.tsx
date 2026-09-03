import { useState } from "react";
import { AutomationJob, useAutomationStore } from "../../store/automationStore";
import { useToastStore } from "../../store/toastStore";
import { EditAutomationModal } from "../automation/EditAutomationModal";
import {
  Route,
  Play,
  Edit3,
  Clock,
  Calendar,
  Search,
  Plus,
  Trash2,
  Pause,
  RotateCw,
  Bot,
} from "lucide-react";

export function AutomationView() {
  const { automations, runningJobIds, runJobNow, toggleStatus, deleteAutomation, addAutomation } =
    useAutomationStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [editingJob, setEditingJob] = useState<AutomationJob | null>(null);

  const filterTabs = [
    { id: "all", label: "All Automations" },
    { id: "active", label: "Active" },
    { id: "scheduled", label: "Scheduled" },
    { id: "paused", label: "Paused" },
  ];

  const filtered = automations.filter((job) => {
    const matchesSearch =
      job.name.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.targetAgent.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = selectedFilter === "all" || job.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const handleRun = async (job: AutomationJob) => {
    addToast(`Triggering execution: ${job.name}...`, "info");
    await runJobNow(job.id);
    addToast(`Completed automated job: ${job.name}`, "success");
  };

  const handleAddNew = () => {
    const newJob = {
      name: `Scheduled Codebase Health Monitor #${Date.now().toString().slice(-4)}`,
      description: "Automated cron sweep checking AST invariants, token limits, and open PR status.",
      cronExpression: "0 */2 * * *",
      scheduleLabel: "Every 2 hours",
      nextRun: new Date(Date.now() + 120 * 60000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      targetAgent: "Build Implementer",
      targetPrompt: "Audit recent commit diffs, verify red-first TDD invariants, and validate tests.",
      toolIntegrations: ["schedule", "run_command", "cargo"],
    };

    addAutomation(newJob);
    addToast("Created new scheduled automation job", "success");
  };

  const getStatusBadge = (status: AutomationJob["status"], isRunning: boolean) => {
    if (isRunning) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center space-x-1 animate-pulse">
          <RotateCw className="w-2.5 h-2.5 animate-spin" />
          <span>RUNNING</span>
        </span>
      );
    }
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ACTIVE</span>
          </span>
        );
      case "scheduled":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center space-x-1">
            <Clock className="w-2.5 h-2.5" />
            <span>SCHEDULED</span>
          </span>
        );
      case "paused":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-gray-500/10 border border-gray-500/30 text-gray-400 flex items-center space-x-1">
            <Pause className="w-2.5 h-2.5" />
            <span>PAUSED</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] min-w-0 overflow-hidden text-xs">
      {/* View Header */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Automation & Scheduled Jobs</h1>
            <p className="text-[11px] text-[#8b949e]">
              Manage autonomous agent cron routines, scheduled test sweeps, and background daemon workflows.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search automations & agents..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-8 pr-3 py-1.5 text-white text-xs outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* New Automation Button */}
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Job</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-6 py-2 border-b border-[#30363d] bg-[#0d1117]/80 flex items-center space-x-2 overflow-x-auto flex-shrink-0">
        <span className="text-[10px] text-[#8b949e] uppercase font-semibold mr-1">Status:</span>
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition whitespace-nowrap ${
              selectedFilter === tab.id
                ? "bg-emerald-950/60 border border-emerald-500 text-emerald-200 font-semibold"
                : "bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-[11px] text-[#8b949e] ml-auto font-mono flex-shrink-0">
          Showing {filtered.length} of {automations.length} jobs
        </span>
      </div>

      {/* Grid of Automation Cards */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-[#8b949e]">
            <Route className="w-8 h-8 stroke-1 text-gray-500" />
            <p className="text-xs">No scheduled automation jobs matching filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((job) => {
              const isRunning = runningJobIds.includes(job.id);
              return (
                <div
                  key={job.id}
                  className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/60 transition shadow-sm space-y-4 group"
                >
                  {/* Card Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="p-2 rounded-xl bg-[#0d1117] border border-[#30363d] flex-shrink-0">
                          <Route className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="truncate">
                          <h3 className="font-semibold text-white text-xs truncate group-hover:text-emerald-400 transition">
                            {job.name}
                          </h3>
                          <div className="flex items-center space-x-1.5 text-[10px] text-[#8b949e] mt-0.5">
                            <Bot className="w-3 h-3 text-purple-400" />
                            <span className="truncate">{job.targetAgent}</span>
                          </div>
                        </div>
                      </div>

                      {getStatusBadge(job.status, isRunning)}
                    </div>

                    <p className="text-[11px] text-[#8b949e] line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Timing & Schedule Metrics Box */}
                  <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-2 text-[11px]">
                    {/* Scheduled Time */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e] flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>Scheduled Time:</span>
                      </span>
                      <span className="font-mono text-white font-medium">{job.scheduleLabel}</span>
                    </div>

                    {/* Next Run */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b949e] flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>Next Run:</span>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">{job.nextRun}</span>
                    </div>

                    {/* Last Run & Duration */}
                    {job.lastRun && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#30363d]/60 text-[10px]">
                        <span className="text-[#8b949e]">Last Run: {job.lastRun}</span>
                        {job.lastDuration && (
                          <span className="text-[#8b949e] font-mono">Duration: {job.lastDuration}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tool Integrations Chips */}
                  <div className="flex flex-wrap gap-1">
                    {job.toolIntegrations.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[10px] font-mono text-[#8b949e]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>

                  {/* Card Action Buttons (Run, Edit, Pause, Delete) */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#30363d]/50">
                    <div className="flex items-center space-x-1.5">
                      {/* Run Now Button */}
                      <button
                        onClick={() => handleRun(job)}
                        disabled={isRunning}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                          isRunning
                            ? "bg-yellow-600/30 text-yellow-300 border border-yellow-500/40 cursor-wait"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                        }`}
                        title="Trigger immediate execution"
                      >
                        {isRunning ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>{isRunning ? "Running..." : "Run Now"}</span>
                      </button>

                      {/* Edit Settings Button */}
                      <button
                        onClick={() => setEditingJob(job)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white font-medium text-xs border border-[#30363d] transition"
                        title="Edit schedule and parameters"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#58a6ff]" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Pause / Resume Button */}
                      <button
                        onClick={() => {
                          toggleStatus(job.id);
                          addToast(
                            job.status === "paused"
                              ? `Resumed ${job.name}`
                              : `Paused ${job.name}`,
                            "info"
                          );
                        }}
                        className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition"
                        title={job.status === "paused" ? "Resume automation" : "Pause automation"}
                      >
                        {job.status === "paused" ? (
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          deleteAutomation(job.id);
                          addToast(`Deleted ${job.name}`, "info");
                        }}
                        className="p-1.5 rounded-lg text-[#8b949e] hover:text-red-400 hover:bg-[#21262d] transition"
                        title="Delete automation job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Automation Modal */}
      {editingJob && (
        <EditAutomationModal job={editingJob} onClose={() => setEditingJob(null)} />
      )}
    </div>
  );
}
