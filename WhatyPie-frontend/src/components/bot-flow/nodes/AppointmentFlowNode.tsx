/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/elements/ui/select";
import { useListAppointmentConfigsQuery } from "@/src/redux/api/appointmentApi";
import { RootState } from "@/src/redux/store";
import { useReactFlow } from "@xyflow/react";
import { Calendar, Loader } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { BaseNode } from "./BaseNode";
import { NodeField } from "./NodeField";

export function AppointmentFlowNode({ data, id }: any) {
  const { setNodes } = useReactFlow();
  const [touched, setTouched] = useState(false);
  const selectedWorkspace = useSelector((state: RootState) => state.workspace.selectedWorkspace);

  const { data: configsData, isLoading } = useListAppointmentConfigsQuery(
    { waba_id: selectedWorkspace?.waba_id || "", limit: 100 },
    { skip: !selectedWorkspace?.waba_id }
  );

  const configs = configsData?.data?.configs || [];

  const errors: string[] = [];
  if (touched || data.forceValidation) {
    if (!data.appointment_config_id) errors.push("Please select an Appointment Config.");
  }

  const updateNodeData = (field: string, value: any) => {
    if (!touched) setTouched(true);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, [field]: value } }
          : node,
      ),
    );
  };

  const selectedConfig = configs.find((c: any) => c._id === data.appointment_config_id);

  return (
    <BaseNode
      id={id}
      title="Booking Flow"
      icon={<Calendar size={18} />}
      iconBgColor="bg-amber-600"
      iconColor="text-white"
      borderColor="border-amber-200"
      handleColor="bg-amber-500!"
      errors={errors}
    >
      <div className="space-y-4">
        <NodeField
          label="Select Appointment Config"
          required
          description="Choose which appointment booking to use"
          error={(touched || data.forceValidation) && !data.appointment_config_id ? "Please select a config." : ""}
        >
          <Select
            value={data.appointment_config_id || ""}
            onValueChange={(val) => updateNodeData("appointment_config_id", val)}
          >
            <SelectTrigger
              className="text-sm bg-gray-50 border-gray-200 dark:bg-(--page-body-bg) dark:border-(--card-border-color) h-10!"
              onFocus={() => setTouched(true)}
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader size={12} className="animate-spin" /> Loading...
                </span>
              ) : (
                <SelectValue placeholder="Select appointment config..." />
              )}
            </SelectTrigger>
            <SelectContent className="dark:bg-(--card-color)">
              {configs.length === 0 && !isLoading && (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">
                  No appointment configs found.<br />
                  Create one in Appointment Booking first.
                </div>
              )}
              {configs.map((cfg: any) => (
                <SelectItem
                  key={cfg._id}
                  value={cfg._id}
                  className="dark:hover:bg-(--table-hover)"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{cfg.name}</span>
                    {cfg.location && (
                      <span className="text-[10px] text-gray-400">📍 {cfg.location}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </NodeField>

        {selectedConfig && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-3 space-y-1">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Selected Config</p>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{selectedConfig.name}</p>
            {selectedConfig.location && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">📍 {selectedConfig.location}</p>
            )}
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              ⏱ {selectedConfig.duration_minutes} min • Max {selectedConfig.max_daily_appointments}/day
            </p>
          </div>
        )}

        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-3">
          <p className="text-[10px] text-blue-600 dark:text-blue-300 leading-relaxed">
            🤖 This node hands off the conversation to the booking system — it will ask your custom questions, show available dates & times, and confirm the booking automatically.
          </p>
        </div>
      </div>
    </BaseNode>
  );
}
