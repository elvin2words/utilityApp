// src/components/supervisor/FaultList.tsx
import React from "react";
import { Button } from "@/components/ui/Button";

const faults = [
  { id: 1, title: "Transformer outage", severity: "High", location: "Zone A" },
  { id: 2, title: "Broken pole", severity: "Medium", location: "Zone B" },
];

const FaultList: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">Title</th>
            <th>Severity</th>
            <th>Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {faults.map((fault) => (
            <tr key={fault.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{fault.title}</td>
              <td>{fault.severity}</td>
              <td>{fault.location}</td>
              <td>
                <Button size="sm" variant="outline">Assign</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FaultList;
