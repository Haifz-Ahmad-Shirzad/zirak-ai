import { useRef, useEffect } from "react";

export function useAutoResizeTextarea(value) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }
  }, [value]);

  return ref;
}
