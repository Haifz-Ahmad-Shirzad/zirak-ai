import { useState, useCallback } from "react";

export function useFeedback(initialFeedback, onFeedback, messageId) {
  const [feedback, setFeedback] = useState(initialFeedback);

  const handleFeedback = useCallback(
    (type) => {
      // Toggle feedback: if same type is clicked again, reset to null.
      const newFeedback = feedback === type ? null : type;
      setFeedback(newFeedback);

      // Propagate the change to the parent component.
      onFeedback(messageId, newFeedback);
    },
    [feedback, onFeedback, messageId],
  );

  return [feedback, handleFeedback];
}
