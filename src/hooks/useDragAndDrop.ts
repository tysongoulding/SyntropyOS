import { useState, useEffect } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useToastStore } from "../store/toastStore";

export function useDragAndDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const { attachFile } = useWorkspaceStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          attachFile(file.name);
          addToast(`Attached @${file.name} to turn context`, "info");
        }
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [attachFile, addToast]);

  return { isDragging };
}
