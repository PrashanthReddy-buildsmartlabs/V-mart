"use client";

import { useEffect } from "react";
import { initializeFirebaseSync } from "@/lib/sync";

export function FirebaseInit() {
  useEffect(() => {
    initializeFirebaseSync();
  }, []);

  return null;
}
