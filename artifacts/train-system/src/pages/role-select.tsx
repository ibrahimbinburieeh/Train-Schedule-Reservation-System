import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function RoleSelect() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const selectRole = (role: "admin" | "staff") => {
    if (user?.role !== role) {
      alert(`You are logged in as ${user?.role}. You cannot access ${role} dashboard.`);
      return;
    }
    if (role === "admin") {
      setLocation("/admin");
    } else {
      setLocation("/staff");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full border border-gray-400 p-6 bg-gray-50 text-center">
        <h2 className="text-xl font-bold mb-6 text-black">Select Dashboard</h2>
        <div className="space-y-4">
          <Button 
            onClick={() => selectRole("admin")} 
            className="w-full bg-blue-600 text-white rounded-none border border-blue-800 py-6 text-lg font-bold"
          >
            Administrator
          </Button>
          <Button 
            onClick={() => selectRole("staff")} 
            className="w-full bg-white text-blue-700 rounded-none border border-blue-700 py-6 text-lg font-bold"
          >
            Staff
          </Button>
        </div>
      </div>
    </div>
  );
}
