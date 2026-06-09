/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Input } from "@/src/elements/ui/input";
import { Textarea } from "@/src/elements/ui/textarea";
import { useReactFlow } from "@xyflow/react";
import { Bell } from "lucide-react";
import { useState } from "react";
import { BaseNode } from "./BaseNode";
import { NodeField } from "./NodeField";

export function NotifyAgentNode({ data, id }: any) {
  const { setNodes } = useReactFlow();
  const [touched, setTouched] = useState(false);

  const errors: string[] = [];
  if (touched || data.forceValidation) {
    if (!data.agent_phone || !data.agent_phone.trim()) errors.push("Agent phone number is required.");
  }

  const updateNodeData = (field: string, value: any) => {
    if (!touched) setTouched(true);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, [field]: value } } : node
      )
    );
  };

  const defaultMessage =
    "🔔 *New Real Estate Lead!*\n\n👤 Name: {{customer_name}}\n📱 Phone: {{senderNumber}}\n📍 Location: {{preferred_location}}\n\n_Captured via WhatyPie Bot_";

  return (
    <BaseNode
      id={id}
      title="Notify Agent"
      icon={<Bell size={18} />}
      iconBgColor="bg-orange-500"
      iconColor="text-white"
      borderColor="border-orange-200"
      handleColor="bg-orange-500!"
      errors={errors}
    >
      <div className="space-y-4">
        <NodeField label="Step Name" description="Identify this step in your flow report.">
          <Input
            placeholder="e.g. Alert Sales Agent"
            value={data.name || ""}
            onChange={(e) => updateNodeData("name", e.target.value)}
            className="text-sm bg-gray-50 border-gray-200 focus:bg-gray-50 dark:focus:bg-(--page-body-bg) dark:bg-(--page-body-bg) dark:border-(--card-border-color)"
          />
        </NodeField>

        <NodeField
          label="Agent WhatsApp Number"
          required
          description="Include country code. e.g. 919876543210"
          error={(touched || data.forceValidation) && !data.agent_phone ? "Agent phone is required." : ""}
        >
          <Input
            placeholder="e.g. 919876543210"
            value={data.agent_phone || ""}
            onFocus={() => setTouched(true)}
            onChange={(e) => updateNodeData("agent_phone", e.target.value)}
            className="text-sm bg-gray-50 border-gray-200 focus:bg-gray-50 dark:focus:bg-(--page-body-bg) dark:bg-(--page-body-bg) dark:border-(--card-border-color)"
          />
        </NodeField>

        <NodeField
          label="Alert Message"
          description="Use {{customer_name}}, {{senderNumber}}, {{preferred_location}}"
        >
          <Textarea
            placeholder={defaultMessage}
            value={data.message_template || ""}
            onFocus={() => setTouched(true)}
            onChange={(e) => updateNodeData("message_template", e.target.value)}
            className="min-h-28 resize-none text-sm bg-gray-50 border-gray-200 focus:bg-white dark:bg-(--page-body-bg) dark:border-(--card-border-color) dark:focus:bg-(--page-body-bg)"
          />
          <p className="mt-1 text-[10px] text-gray-400 italic">
            Leave blank to use the default lead alert template.
          </p>
        </NodeField>

        <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 p-3">
          <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">⚡ Non-Blocking</p>
          <p className="text-[10px] text-orange-500 dark:text-orange-300 leading-relaxed">
            If the agent message fails, the flow continues without stopping. Lead is always captured.
          </p>
        </div>
      </div>
    </BaseNode>
  );
}
