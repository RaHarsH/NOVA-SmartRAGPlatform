import Sidebar from "@/components/Sidebar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 transition-all duration-300 ease-in-out ml-64 sidebar-collapsed:ml-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default layout;
